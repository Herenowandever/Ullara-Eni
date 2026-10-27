import { useState, type FormEvent } from 'react'
import { supabase, PROFILE_COLS, type Profile, type Shift, type Role, type Office } from '../../supabase'
import { useMember } from '../../lib/session'
import { useAsync, must } from '../../lib/useAsync'
import { friendly } from '../../lib/errors'
import { Avatar, Loading, Note, copyText } from '../../components/ui'
import { randomPin, weakPin } from '../../lib/pin'

export function TeamPage() {
  const { company, userId, refresh } = useMember()
  const { data, loading, error, reload } = useAsync(async () => {
    const [people, shifts, offices] = await Promise.all([
      supabase.from('profiles').select(PROFILE_COLS).order('full_name'),
      supabase.from('shifts').select('id, company_id, name, start_time, end_time, grace_minutes').order('start_time'),
      supabase.from('offices').select('id, company_id, name, lat, lng, radius_m').order('name'),
    ])
    return { people: must(people) as Profile[], shifts: must(shifts) as Shift[], offices: must(offices) as Office[] }
  }, [])
  const [copied, setCopied] = useState<string | null>(null)
  const [codeMsg, setCodeMsg] = useState<string | null>(null)
  const [confirmNew, setConfirmNew] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const link = `${window.location.origin}/#/join?code=${company.join_code}`

  async function copy(what: string, text: string) {
    setCopied((await copyText(text)) ? what : null)
    setTimeout(() => setCopied(null), 2000)
  }

  async function newCode() {
    const { error } = await supabase.rpc('regenerate_join_code')
    setConfirmNew(false)
    if (error) setCodeMsg(friendly(error).text)
    else {
      setCodeMsg('New code created. The old code no longer works.')
      await refresh()
    }
  }

  return (
    <div className="stack">
      <section className="panel">
        <h2>Invite your team</h2>
        <p className="small muted">New employees create an account and enter this code. Share the link and the code fills in by itself.</p>
        <div className="invite">
          <div className="code num">{company.join_code}</div>
          <div className="row">
            <button className="btn" onClick={() => copy('code', company.join_code)}>{copied === 'code' ? 'Copied' : 'Copy code'}</button>
            <button className="btn" onClick={() => copy('link', link)}>{copied === 'link' ? 'Copied' : 'Copy invite link'}</button>
          </div>
        </div>
        <div className="small muted break">{link}</div>
        <p className="small muted">
          Workers without email: open their row below and tap <strong>Set up app login</strong>. They sign in with company code{' '}
          <span className="mono">{company.login_code}</span>, their worker ID and a PIN.
        </p>
        {!confirmNew ? (
          <button className="linkish" onClick={() => setConfirmNew(true)}>Create a new code</button>
        ) : (
          <Note tone="bad">
            Anyone with the old code won't be able to join. <button className="btn" onClick={newCode}>Create new code</button>{' '}
            <button className="btn" onClick={() => setConfirmNew(false)}>Cancel</button>
          </Note>
        )}
        {codeMsg && <Note tone="ok">{codeMsg}</Note>}
      </section>

      <PendingRequests onChange={reload} requireApproval={company.require_approval} />

      <section className="panel">
        <h2>People</h2>
        {notice && <Note tone="ok">{notice}</Note>}
        {loading && !data ? <Loading /> : error ? <Note tone="bad">{friendly(error).text}</Note> : (
          <div className="people">
            {data!.people.filter((p) => p.active).map((p) => (
              <MemberRow key={p.id} p={p} shifts={data!.shifts} offices={data!.offices} isMe={p.id === userId} onSaved={reload}
                onRemoved={(text) => { setNotice(text); reload() }} />
            ))}
          </div>
        )}
      </section>

      {data && data.people.some((p) => !p.active && p.approved) && (
        <section className="panel">
          <details>
            <summary className="removed-summary">Removed people ({data.people.filter((p) => !p.active && p.approved).length})</summary>
            <p className="small muted">Their past attendance stays in reports and wage sheets. Restore someone to bring them back.</p>
            <div className="people">
              {data.people.filter((p) => !p.active && p.approved).map((p) => <RemovedRow key={p.id} p={p} onRestored={reload} />)}
            </div>
          </details>
        </section>
      )}

      {data && <AddWorker shifts={data.shifts} offices={data.offices} onAdded={reload} />}
    </div>
  )
}

function MemberRow({ p, shifts, offices, isMe, onSaved, onRemoved }: {
  p: Profile; shifts: Shift[]; offices: Office[]; isMe: boolean; onSaved: () => void; onRemoved: (text: string) => void
}) {
  const [name, setName] = useState(p.full_name)
  const [shift, setShift] = useState(p.shift_id ?? '')
  const [site, setSite] = useState(p.office_id ?? '')
  const [role, setRole] = useState<Role>(p.role)
  const [title, setTitle] = useState(p.job_title ?? '')
  const [wage, setWage] = useState(p.daily_wage != null ? String(p.daily_wage) : '')
  const [ot, setOt] = useState(p.ot_hourly_rate != null ? String(p.ot_hourly_rate) : '')
  const [payType, setPayType] = useState<'daily' | 'monthly'>(p.pay_type ?? 'daily')
  const [salary, setSalary] = useState(p.monthly_salary != null ? String(p.monthly_salary) : '')
  const active = p.active
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null)
  const num = (v: string) => (v.trim() === '' ? null : Number(v))
  const dirty =
    name !== p.full_name || shift !== (p.shift_id ?? '') || site !== (p.office_id ?? '') || role !== p.role ||
    title !== (p.job_title ?? '') || num(wage) !== p.daily_wage || num(ot) !== p.ot_hourly_rate || active !== p.active ||
    payType !== (p.pay_type ?? 'daily') || num(salary) !== p.monthly_salary

  async function save() {
    setMsg(null)
    if ([wage, ot, salary].some((v) => (num(v) ?? 0) < 0 || Number.isNaN(num(v)))) {
      setMsg({ tone: 'bad', text: 'Wages must be numbers of 0 or more.' })
      return
    }
    const { error } = await supabase.rpc('update_member', {
      p_member: p.id, p_role: role, p_shift: shift || null, p_job_title: title, p_active: active,
      p_office: site || null, p_daily_wage: num(wage), p_ot_rate: num(ot), p_full_name: name,
      p_pay_type: payType, p_monthly_salary: num(salary),
    })
    if (error) setMsg({ tone: 'bad', text: friendly(error).text })
    else {
      setMsg({ tone: 'ok', text: 'Saved.' })
      onSaved()
    }
  }

  async function remove() {
    setRemoving(true)
    setMsg(null)
    const { data: res, error } = await supabase.rpc('remove_member', { p_member: p.id })
    setRemoving(false)
    setConfirmRemove(false)
    if (error) setMsg({ tone: 'bad', text: friendly(error).text })
    else onRemoved(res === 'deleted' ? `${p.full_name} was deleted.` : `${p.full_name} was removed. Find them under Removed people to bring them back.`)
  }

  const siteName = offices.find((o) => o.id === p.office_id)?.name
  return (
    <div className={`member ${active ? '' : 'inactive'}`}>
      <div className="person">
        <Avatar name={p.full_name} />
        <div className="minw0">
          <div>
            {p.full_name}
            {isMe && <span className="muted small"> · you</span>}
            {!p.has_login && <span className="muted small"> · no app login</span>}
            {p.pin_login && <span className="muted small"> · PIN login</span>}
            {p.role !== 'employee' && <span className="muted small"> · {p.role}</span>}
            {!p.active && <span className="muted small"> · deactivated</span>}
          </div>
          <div className="meta">
            {[p.employee_no != null ? `ID ${p.employee_no}` : null, p.job_title, siteName,
              p.pay_type === 'monthly'
                ? (p.monthly_salary != null ? `₹${Number(p.monthly_salary).toLocaleString('en-IN')}/month` : 'salary not set')
                : (p.daily_wage != null ? `₹${p.daily_wage}/day` : null)].filter(Boolean).join(' · ') || 'No details yet'}
          </div>
        </div>
      </div>
      <details className="member-details">
        <summary>Edit</summary>
        <div className="member-edit">
          {(!p.has_login || p.pin_login) && <label className="field">Name<input id={`name-${p.id}`} value={name} onChange={(e) => setName(e.target.value)} /></label>}
          <label className="field">Job title<input id={`title-${p.id}`} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          <label className="field">Site
            <select id={`site-${p.id}`} value={site} onChange={(e) => setSite(e.target.value)}>
              <option value="">No site</option>
              {offices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </label>
          <label className="field">Shift
            <select id={`shift-${p.id}`} value={shift} onChange={(e) => setShift(e.target.value)}>
              <option value="">No shift</option>
              {shifts.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)})</option>)}
            </select>
          </label>
          <label className="field">Role
            <select id={`role-${p.id}`} value={role} disabled={isMe || !p.has_login} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="employee">Employee</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label className="field">Paid
            <select id={`pt-${p.id}`} value={payType} onChange={(e) => setPayType(e.target.value as 'daily' | 'monthly')}>
              <option value="daily">Daily wage</option>
              <option value="monthly">Monthly salary</option>
            </select>
          </label>
          {payType === 'daily' ? (
            <label className="field">Daily wage (₹)<input id={`wage-${p.id}`} inputMode="decimal" value={wage} placeholder="e.g. 800" onChange={(e) => setWage(e.target.value)} /></label>
          ) : (
            <label className="field">Monthly salary (₹)<input id={`salary-${p.id}`} inputMode="decimal" value={salary} placeholder="e.g. 25000" onChange={(e) => setSalary(e.target.value)} /></label>
          )}
          <label className="field">Overtime ₹/hour<input id={`ot-${p.id}`} inputMode="decimal" value={ot} placeholder="Auto" onChange={(e) => setOt(e.target.value)} /></label>
          <button className="btn primary" disabled={!dirty} onClick={save}>Save</button>
        </div>
        {role === 'supervisor' && <p className="small muted">Supervisors mark attendance for everyone at their site. Pick a site above.</p>}
        <p className="small muted">Overtime left blank uses the company overtime rule from Company settings. Monthly salary is paid per day as salary ÷ days in the month, including weekly offs and holidays.</p>
      </details>
      {!isMe && p.active && (!p.has_login || p.pin_login) && <PinLogin p={p} onDone={onSaved} />}
      {!isMe && !confirmRemove && (
        <button className="btn ghost small-btn remove-btn" onClick={() => setConfirmRemove(true)}>Remove</button>
      )}
      {confirmRemove && (
        <div className="msg bad">
          Remove {p.full_name} from your team? They won't appear in Crew or be able to clock in. Their past attendance stays in
          your reports.
          <div className="row">
            <button className="btn" onClick={remove} disabled={removing}>{removing ? 'Removing…' : 'Remove'}</button>
            <button className="btn" onClick={() => setConfirmRemove(false)}>Keep</button>
          </div>
        </div>
      )}
      {msg && <Note tone={msg.tone}>{msg.text}</Note>}
    </div>
  )
}

function AddWorker({ shifts, offices, onAdded }: { shifts: Shift[]; offices: Office[]; onAdded: () => void }) {
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [site, setSite] = useState(offices[0]?.id ?? '')
  const [shift, setShift] = useState(shifts[0]?.id ?? '')
  const [wage, setWage] = useState('')
  const [ot, setOt] = useState('')
  const [msg, setMsg] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const w = wage.trim() ? Number(wage) : null
    const o = ot.trim() ? Number(ot) : null
    if ((w != null && (Number.isNaN(w) || w < 0)) || (o != null && (Number.isNaN(o) || o < 0))) {
      setMsg({ tone: 'bad', text: 'Wages must be numbers of 0 or more.' })
      return
    }
    const { error } = await supabase.rpc('add_worker', {
      p_full_name: name, p_job_title: title, p_shift: shift || null, p_office: site || null, p_daily_wage: w, p_ot_rate: o,
    })
    if (error) setMsg({ tone: 'bad', text: friendly(error).text })
    else {
      setMsg({ tone: 'ok', text: `${name} added. To let them use the app themselves, open their row above and tap Set up app login.` })
      setName('')
      setTitle('')
      onAdded()
    }
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h2>Add a worker</h2>
      <p className="small muted">For labourers and staff without email. Their supervisor can mark them in with a group photo, or you can give them their own app login with a worker ID and PIN from their row above.</p>
      <div className="row">
        <label className="field">Full name<input id="aw-name" required value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="field">Job title<input id="aw-title" value={title} placeholder="Mason, helper…" onChange={(e) => setTitle(e.target.value)} /></label>
      </div>
      <div className="row">
        <label className="field">Site
          <select id="aw-site" value={site} onChange={(e) => setSite(e.target.value)}>
            <option value="">No site</option>
            {offices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </label>
        <label className="field">Shift
          <select id="aw-shift" value={shift} onChange={(e) => setShift(e.target.value)}>
            <option value="">No shift</option>
            {shifts.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="field">Daily wage (₹)<input id="aw-wage" inputMode="decimal" value={wage} placeholder="e.g. 800" onChange={(e) => setWage(e.target.value)} /></label>
        <label className="field">Overtime ₹/hour<input id="aw-ot" inputMode="decimal" value={ot} placeholder="Auto" onChange={(e) => setOt(e.target.value)} /></label>
      </div>
      {msg && <Note tone={msg.tone}>{msg.text}</Note>}
      <div><button className="btn primary">Add worker</button></div>
    </form>
  )
}

function RemovedRow({ p, onRestored }: { p: Profile; onRestored: () => void }) {
  const [err, setErr] = useState<string | null>(null)
  async function restore() {
    const { error } = await supabase.rpc('restore_member', { p_member: p.id })
    if (error) setErr(friendly(error).text)
    else onRestored()
  }
  return (
    <div className="member inactive">
      <div className="person office-like">
        <Avatar name={p.full_name} />
        <div className="minw0">
          <div>{p.full_name}{!p.has_login && <span className="muted small"> · no phone</span>}</div>
          <div className="meta">{p.job_title || ''}</div>
        </div>
        <button className="btn small-btn" onClick={restore}>Restore</button>
      </div>
      {err && <Note tone="bad">{err}</Note>}
    </div>
  )
}

interface Pending {
  id: string
  full_name: string
  email: string | null
  requested_at: string
}

function PendingRequests({ onChange, requireApproval }: { onChange: () => void; requireApproval: boolean }) {
  const { data, error, reload } = useAsync(async () => must(await supabase.rpc('pending_members')) as Pending[], [])
  const [msg, setMsg] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  async function act(p: Pending, approve: boolean) {
    setBusy(p.id)
    setMsg(null)
    const { error: e } = await supabase.rpc(approve ? 'approve_member' : 'reject_member', { p_member: p.id })
    setBusy(null)
    if (e) setMsg({ tone: 'bad', text: friendly(e).text })
    else {
      setMsg({ tone: 'ok', text: approve ? `${p.full_name} can now use Ullara-Eni. Set their site, shift and pay below.` : `Request from ${p.full_name} turned down.` })
      reload()
      onChange()
    }
  }

  if (error) return <Note tone="bad">{friendly(error).text}</Note>
  if (!data || (data.length === 0 && !msg)) return null
  return (
    <section className="panel pending-panel">
      <h2>Waiting for approval{data.length ? ` (${data.length})` : ''}</h2>
      {data.length > 0 && (
        <p className="small muted">These people joined with your company code. Approve only people you know work for you.</p>
      )}
      {data.map((p) => (
        <div key={p.id} className="pending-row">
          <Avatar name={p.full_name} />
          <div className="minw0">
            <div>{p.full_name}</div>
            <div className="meta break">{p.email ?? ''}</div>
          </div>
          <div className="row end">
            <button className="btn primary small-btn" disabled={busy === p.id} onClick={() => act(p, true)}>Approve</button>
            <button className="btn ghost small-btn" disabled={busy === p.id} onClick={() => act(p, false)}>Turn down</button>
          </div>
        </div>
      ))}
      {msg && <Note tone={msg.tone}>{msg.text}</Note>}
      {!requireApproval && <p className="small muted">Approval is switched off in Company settings, so new people join straight away.</p>}
    </section>
  )
}

/** Admin sets up or resets a worker's Company code + Worker ID + PIN login. */
function PinLogin({ p, onDone }: { p: Profile; onDone: () => void }) {
  const { company } = useMember()
  const [open, setOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [card, setCard] = useState<{ code: string; id: number; pin: string } | null>(null)
  const [copied, setCopied] = useState(false)

  function start() {
    setPin(randomPin())
    setErr(null)
    setCard(null)
    setOpen(true)
  }

  async function save() {
    if (weakPin(pin)) return setErr('Use 6 digits that are hard to guess, not 000000 or 123456.')
    setBusy(true)
    setErr(null)
    const { data, error } = await supabase.functions.invoke('worker-login', { body: { member_id: p.id, pin } })
    setBusy(false)
    if (error) {
      let code = error.message
      try {
        const ctx = (error as { context?: Response }).context
        if (ctx) code = ((await ctx.json()) as { error?: string }).error ?? code
      } catch {
        /* keep message */
      }
      const known: Record<string, string> = {
        WEAK_PIN: 'Use 6 digits that are hard to guess, not 000000 or 123456.',
        NOT_ACTIVE: 'This person is removed or waiting for approval.',
        HAS_OWN_LOGIN: 'This person signs in with their own email or Google, so they don\'t need a PIN.',
      }
      setErr(known[code] ?? friendly(new Error(code)).text)
      return
    }
    const d = data as { employee_no: number; login_code: string }
    setCard({ code: d.login_code ?? company.login_code, id: d.employee_no, pin })
    setOpen(false)
    onDone()
  }

  async function copy() {
    if (!card) return
    const text = `Ullara-Eni sign-in for ${p.full_name}\nOpen: ${window.location.origin}\nTap "Worker"\nCompany code: ${card.code}\nWorker ID: ${card.id}\nPIN: ${card.pin}`
    setCopied(await copyText(text))
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="pin-area">
      {!open && !card && (
        <button className="btn small-btn" onClick={start}>{p.pin_login ? 'Reset PIN' : 'Set up app login (no email)'}</button>
      )}
      {open && (
        <div className="pin-panel">
          <div className="small">
            {p.pin_login
              ? `Choose a new PIN for ${p.full_name}. Their old PIN stops working.`
              : `${p.full_name} will sign in with your company code, a worker ID and this PIN. No email or Google account needed.`}
          </div>
          <div className="row">
            <label className="field">6-digit PIN
              <input id={`pin-${p.id}`} className="mono code-input" inputMode="numeric" maxLength={6} value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} />
            </label>
            <button className="btn ghost small-btn" type="button" onClick={() => setPin(randomPin())}>New random PIN</button>
          </div>
          {err && <Note tone="bad">{err}</Note>}
          <div className="row">
            <button className="btn primary" disabled={busy || pin.length !== 6} onClick={save}>{busy ? 'Saving…' : p.pin_login ? 'Save new PIN' : 'Create login'}</button>
            <button className="btn" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
      {card && (
        <div className="login-card">
          <strong>Give these to {p.full_name}</strong>
          <dl>
            <dt>Company code</dt><dd>{card.code}</dd>
            <dt>Worker ID</dt><dd>{card.id}</dd>
            <dt>PIN</dt><dd>{card.pin}</dd>
          </dl>
          <p className="small">On the sign-in screen they tap <strong>Worker</strong> and enter these. You won't be able to see this PIN again; use Reset PIN if it's forgotten.</p>
          <div className="row">
            <button className="btn" onClick={copy}>{copied ? 'Copied' : 'Copy to send on WhatsApp'}</button>
            <button className="btn ghost" onClick={() => setCard(null)}>Done</button>
          </div>
        </div>
      )}
    </div>
  )
}
