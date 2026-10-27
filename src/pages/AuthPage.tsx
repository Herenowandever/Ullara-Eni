import { useEffect, useState, type FormEvent } from 'react'
import { supabase, authProviders } from '../supabase'
import { Brand } from '../components/Layout'
import { Note } from '../components/ui'
import { friendly } from '../lib/errors'
import { useT, LangSwitch } from '../lib/i18n'
import { pinLoginEmail, pinPassword } from '../lib/pin'

type Mode = 'signin' | 'signup' | 'reset' | 'worker'
const LAST_WORKER = 'ullara_last_worker'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  )
}

export function AuthPage() {
  const t = useT()
  const [mode, setMode] = useState<Mode>(() => {
    try {
      return localStorage.getItem(LAST_WORKER) ? 'worker' : 'signin'
    } catch {
      return 'signin'
    }
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [coCode, setCoCode] = useState('')
  const [workerId, setWorkerId] = useState('')
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [google, setGoogle] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null)

  useEffect(() => {
    authProviders().then((p) => setGoogle(p.google))
    try {
      const last = JSON.parse(localStorage.getItem(LAST_WORKER) ?? 'null') as { code: string; id: string } | null
      if (last) {
        setCoCode(last.code)
        setWorkerId(last.id)
      }
    } catch {
      /* ignore */
    }
  }, [])

  async function withGoogle() {
    setMsg(null)
    // The browser leaves for Google here; nothing is disabled, so Back returns to a working screen.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/' },
    })
    if (error) setMsg({ tone: 'bad', text: friendly(error).text })
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      if (mode === 'worker') {
        const code = coCode.trim().toUpperCase()
        const no = Number(workerId.trim())
        if (!/^[A-Z0-9]{6}$/.test(code) || !Number.isInteger(no) || no < 1 || !/^\d{6}$/.test(pin)) {
          throw new Error('WORKER_WRONG')
        }
        const { error } = await supabase.auth.signInWithPassword({ email: pinLoginEmail(code, no), password: pinPassword(code, no, pin) })
        if (error) throw new Error(/invalid login credentials/i.test(error.message) ? 'WORKER_WRONG' : error.message)
        try {
          localStorage.setItem(LAST_WORKER, JSON.stringify({ code, id: String(no) }))
        } catch {
          /* ignore */
        }
      } else if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + '/' + window.location.hash },
        })
        if (error) throw error
        if (!data.session) setMsg({ tone: 'ok', text: t('auth.confirmSent', { email }) })
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
        if (error) throw error
        setMsg({ tone: 'ok', text: t('auth.resetSent', { email }) })
      }
    } catch (err) {
      const text = err instanceof Error && err.message === 'WORKER_WRONG' ? t('auth.workerWrong') : friendly(err).text
      setMsg({ tone: 'bad', text })
    } finally {
      setBusy(false)
    }
  }

  const tab = (m: Mode, label: string) => (
    <button type="button" role="tab" aria-selected={mode === m || (m === 'signin' && mode === 'reset')} onClick={() => { setMode(m); setMsg(null) }}>
      {label}
    </button>
  )

  return (
    <div className="center-page">
      <div className="row between"><Brand sub={t('auth.tagline')} /><LangSwitch /></div>
      <form className="panel" onSubmit={submit}>
        <div className="seg" role="tablist" aria-label="Account">
          {tab('signin', t('auth.signIn'))}
          {tab('signup', t('auth.create'))}
          {tab('worker', t('auth.worker'))}
        </div>

        {mode === 'worker' ? (
          <>
            <div className="row">
              <label className="field">
                {t('auth.coCode')}
                <input id="auth-co" className="mono code-input" autoCapitalize="characters" autoComplete="organization" maxLength={6} required
                  value={coCode} onChange={(e) => setCoCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} />
              </label>
              <label className="field">
                {t('auth.workerId')}
                <input id="auth-wid" className="mono" inputMode="numeric" autoComplete="username" maxLength={6} required
                  value={workerId} onChange={(e) => setWorkerId(e.target.value.replace(/\D/g, ''))} />
              </label>
            </div>
            <label className="field">
              {t('auth.pin')}
              <input id="auth-pin" className="mono code-input otp" type="password" inputMode="numeric" autoComplete="current-password"
                maxLength={6} required value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} />
            </label>
            <p className="small muted">{t('auth.workerHint')}</p>
          </>
        ) : (
          <>
            {google && mode !== 'reset' && (
              <>
                <button type="button" className="btn big google-btn" onClick={withGoogle} disabled={busy}>
                  <GoogleIcon /> {t('auth.google')}
                </button>
                <div className="or-line"><span>{t('auth.or')}</span></div>
              </>
            )}
            <label className="field">
              {t('auth.email')}
              <input id="auth-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            {mode !== 'reset' && (
              <label className="field">
                {t('auth.password')}
                <input
                  id="auth-password"
                  type="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  minLength={8}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            )}
          </>
        )}

        {msg && <Note tone={msg.tone}>{msg.text}</Note>}
        <button className="btn primary big" disabled={busy}>
          {busy ? t('pleaseWait') : mode === 'signup' ? t('auth.create') : mode === 'reset' ? t('auth.sendReset') : t('auth.signIn')}
        </button>
        {mode === 'signin' && (
          <button type="button" className="linkish" onClick={() => setMode('reset')}>{t('auth.forgot')}</button>
        )}
        {mode === 'reset' && (
          <button type="button" className="linkish" onClick={() => setMode('signin')}>{t('auth.back')}</button>
        )}
        {mode === 'signup' && <p className="small muted">{t('auth.afterCreate')}</p>}
        {(mode === 'signin' || mode === 'signup') && <p className="small muted">{t('auth.googleNote')}</p>}
      </form>
      <p className="small muted legal-links">
        <a href="/privacy.html">Privacy Policy</a> · <a href="/terms.html">Terms of Service</a>
      </p>
    </div>
  )
}
