import type { ReactNode } from 'react'
import { useSession } from '../lib/session'
import { useT, LangSwitch } from '../lib/i18n'
import type { Role } from '../supabase'

const NAV: Record<Role, string[]> = {
  employee: ['/', '/history', '/account'],
  supervisor: ['/', '/crew', '/history', '/account'],
  admin: ['/', '/crew', '/admin', '/admin/team', '/admin/shifts', '/admin/offices', '/admin/reports', '/admin/activity', '/admin/settings', '/account'],
}

const LABEL: Record<string, string> = {
  '/': 'nav.clock',
  '/history': 'nav.history',
  '/crew': 'nav.crew',
  '/admin': 'nav.attendance',
  '/admin/team': 'nav.team',
  '/admin/shifts': 'nav.shifts',
  '/admin/offices': 'nav.offices',
  '/admin/reports': 'nav.reports',
  '/admin/activity': 'nav.activity',
  '/admin/settings': 'nav.company',
  '/account': 'nav.account',
}

export function Brand({ sub }: { sub?: string }) {
  return (
    <div className="brand">
      <div className="brand-mark" aria-hidden="true" />
      <div>
        <div className="brand-name">Ullara-Eni</div>
        {sub && <div className="brand-sub">{sub}</div>}
      </div>
    </div>
  )
}

export function Layout({ path, children }: { path: string; children: ReactNode }) {
  const { profile, company, signOut } = useSession()
  const t = useT()
  const nav = NAV[profile?.role ?? 'employee']
  const active = (p: string) => (p === '/' || p === '/admin' ? path === p : path.startsWith(p))

  return (
    <div className="shell">
      <header className="topbar">
        <Brand sub={company?.name} />
        <div className="row">
          <a className="small who who-link" href="#/account">{profile?.full_name}</a>
          <LangSwitch />
          <button className="btn ghost" onClick={signOut}>{t('signOut')}</button>
        </div>
      </header>
      <nav className="nav" aria-label="Main">
        {nav.map((p) => (
          <a key={p} href={`#${p}`} aria-current={active(p) ? 'page' : undefined}>
            {t(LABEL[p])}
          </a>
        ))}
      </nav>
      <main className="page">{children}</main>
    </div>
  )
}
