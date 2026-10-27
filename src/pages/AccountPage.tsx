import { useState } from 'react'
import { supabase } from '../supabase'
import { useMember } from '../lib/session'
import { useAsync, must } from '../lib/useAsync'
import { useT } from '../lib/i18n'
import { friendly } from '../lib/errors'
import { Loading, Note } from '../components/ui'

interface Preview {
  outcome: 'deactivated' | 'company_removed' | 'request_removed' | 'no_profile' | 'last_admin' | 'pin_account'
  company_name: string | null
  others: number
}

export function AccountPage() {
  const { session, profile, company, signOut } = useMember()
  const t = useT()
  const user = session!.user
  const pin = profile.pin_login || user.user_metadata?.pin_login === true
  const provider = pin ? 'pin' : user.app_metadata?.provider === 'google' ? 'google' : 'email'

  const [open, setOpen] = useState(false)
  const [sure, setSure] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const { data: preview, loading } = useAsync(async () => {
    const rows = must(await supabase.rpc('account_deletion_preview')) as Preview[]
    return rows[0]
  }, [])

  async function signOutEverywhere() {
    await supabase.auth.signOut({ scope: 'global' })
    window.location.hash = '/'
  }

  async function del() {
    setBusy(true)
    setErr(null)
    const { error } = await supabase.functions.invoke('delete-account', { body: { confirm: 'DELETE' } })
    if (error) {
      let code = error.message
      try {
        const ctx = (error as { context?: Response }).context
        if (ctx) code = ((await ctx.json()) as { error?: string }).error ?? code
      } catch {
        /* keep message */
      }
      setBusy(false)
      setErr(code === 'LAST_ADMIN' || code === 'PIN_ACCOUNT' ? t(`acc.del.${code.toLowerCase()}`, { company: company.name }) : friendly(new Error(code)).text)
      return
    }
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
    try {
      sessionStorage.setItem('ullara_notice', t('acc.del.done'))
    } catch {
      /* ignore */
    }
    window.location.hash = '/'
    window.location.reload()
  }

  const blocked = preview && (preview.outcome === 'last_admin' || preview.outcome === 'pin_account')
  const outcomeText = preview ? t(`acc.del.${preview.outcome}`, { company: preview.company_name ?? company.name }) : ''

  return (
    <div className="stack">
      <section className="panel">
        <h2>{t('acc.title')}</h2>
        <dl className="acc-list">
          <dt>{t('acc.name')}</dt><dd>{profile.full_name}</dd>
          <dt>{t('acc.method')}</dt><dd>{t(`acc.m.${provider}`)}</dd>
          {provider === 'pin'
            ? <><dt>{t('auth.workerId')}</dt><dd className="mono">{profile.employee_no ?? '—'} · {company.login_code}</dd></>
            : <><dt>{t('acc.email')}</dt><dd className="break">{user.email}</dd></>}
          <dt>{t('acc.company')}</dt><dd>{company.name}</dd>
          <dt>{t('acc.role')}</dt><dd>{t(`acc.r.${profile.role}`)}</dd>
        </dl>
        <div className="row">
          <button className="btn primary" onClick={signOut}>{t('acc.signOut')}</button>
          <button className="btn" onClick={signOutEverywhere}>{t('acc.signOutAll')}</button>
        </div>
        <p className="small muted">{t('acc.signOutHint')}</p>
      </section>

      <section className="panel danger-zone">
        <h2>{t('acc.delTitle')}</h2>
        {loading && !preview ? <Loading label={t('loading')} /> : blocked ? (
          <Note tone="info">{outcomeText}</Note>
        ) : !open ? (
          <div><button className="btn danger" onClick={() => setOpen(true)}>{t('acc.delStart')}</button></div>
        ) : (
          <>
            <Note tone="bad">{outcomeText}</Note>
            <label className="check">
              <input id="del-sure" type="checkbox" checked={sure} onChange={(e) => setSure(e.target.checked)} />
              {t('acc.del.check')}
            </label>
            <div className="row">
              <button className="btn danger" disabled={!sure || busy} onClick={del}>{busy ? t('acc.del.busy') : t('acc.del.confirm')}</button>
              <button className="btn" disabled={busy} onClick={() => { setOpen(false); setSure(false) }}>{t('cancel')}</button>
            </div>
          </>
        )}
        {err && <Note tone="bad">{err}</Note>}
      </section>
    </div>
  )
}
