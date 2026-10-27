// Turns database and device error codes into sentences people can act on, in the chosen language.
import { has, tr } from './i18n'

export interface Friendly {
  text: string
  suggestQr?: boolean
}

const QR_HELPS = new Set(['OUTSIDE_ZONE', 'WEAK_GPS', 'GEO_DENIED', 'GEO_FAILED', 'NO_GEO', 'NO_LOCATION'])
const ALIASES: Record<string, string> = { NO_GEO: 'GEO_FAILED', NO_LOCATION: 'GEO_FAILED', 'Invalid login credentials': 'LOGIN' }

// Admin-only codes that only appear in English admin screens.
const ENGLISH_ONLY: Record<string, string> = {
  BAD_REQUEST: 'That request was not valid. Reload the page and try again.',
  BAD_ROLE: 'Choose admin, supervisor or employee.',
  NOT_FOUND: 'That item no longer exists. Reload the page.',
  TOO_MANY: 'Select up to 200 people at a time.',
  MFA_REQUIRED: 'Enter the code from your authenticator app first. Sign out and back in if you are not asked for it.',
  BAD_PERIOD: 'Choose a period of up to two months.',
  CANNOT_REMOVE_SELF: "You can't remove yourself. Ask another admin to do it.",
  CAMERA_DENIED: 'Ullara-Eni needs the camera. Allow camera access in your browser settings.',
}

export function friendly(err: unknown): Friendly {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === 'object' && err && 'message' in err
        ? String((err as { message: unknown }).message)
        : String(err)
  const [first, ...parts] = raw.split('|')
  const code = ALIASES[first.trim()] ?? first.trim()
  const key = `err.${code}`
  if (has(key)) {
    const vars: Record<string, string> = {}
    parts.forEach((p, i) => (vars[String(i)] = p))
    return { text: tr(key, vars), suggestQr: QR_HELPS.has(first.trim()) }
  }
  if (ENGLISH_ONLY[code]) return { text: ENGLISH_ONLY[code] }
  if (/^(Load failed|Failed to fetch|NetworkError|Network request failed)/i.test(raw.trim())) {
    return { text: tr('err.OFFLINE') }
  }
  if (/column .* does not exist|function .* does not exist|Could not find the function/i.test(raw)) {
    return { text: 'The database needs an update. Run the newest file in supabase/migrations in the Supabase SQL editor, then reload.' }
  }
  return { text: raw || tr('err.GENERIC') }
}
