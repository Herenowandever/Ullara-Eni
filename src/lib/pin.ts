// Worker sign-in with Company code + Worker ID + PIN.
// These must match supabase/functions/worker-login/index.ts and the database function pin_login_email.

export function pinLoginEmail(loginCode: string, employeeNo: number) {
  return `w${employeeNo}.${loginCode.trim().toLowerCase()}@pin.ullara-eni.app`
}

export function pinPassword(loginCode: string, employeeNo: number, pin: string) {
  return `ullara-eni-pin:${loginCode.trim().toUpperCase()}:${employeeNo}:${pin}`
}

/** Rejects PINs that are too easy to guess, like 000000 or 123456. */
export function weakPin(pin: string) {
  if (!/^\d{6}$/.test(pin)) return true
  if (/^(\d)\1{5}$/.test(pin)) return true
  return '0123456789012345'.includes(pin) || '9876543210987654'.includes(pin)
}

export function randomPin() {
  for (;;) {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    const pin = String(buf[0] % 1_000_000).padStart(6, '0')
    if (!weakPin(pin)) return pin
  }
}
