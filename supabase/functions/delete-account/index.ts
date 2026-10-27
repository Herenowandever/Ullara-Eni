// Ullara-Eni: deletes the signed-in person's own account.
// The database function prepare_account_deletion (run as the person) checks it's allowed and tidies up
// their profile; then this function removes their login with the secret key.
// Deploy with "Verify JWT" off: this function checks the caller itself.

import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

function firstKey(envName: string): string | undefined {
  try {
    const keys = JSON.parse(Deno.env.get(envName) ?? '{}') as Record<string, string>
    return keys.default ?? Object.values(keys)[0]
  } catch {
    return undefined
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'BAD_REQUEST' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const publicKey = req.headers.get('apikey') ?? firstKey('SUPABASE_PUBLISHABLE_KEYS') ?? Deno.env.get('SUPABASE_ANON_KEY')
  const secretKey = firstKey('SUPABASE_SECRET_KEYS') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const auth = req.headers.get('Authorization') ?? ''
  if (!publicKey || !secretKey) return json({ error: 'SERVER_NOT_CONFIGURED' }, 500)
  if (!auth.startsWith('Bearer ')) return json({ error: 'NOT_SIGNED_IN' }, 401)

  let body: { confirm?: string } = {}
  try {
    body = await req.json()
  } catch {
    /* empty body */
  }
  if (body.confirm !== 'DELETE') return json({ error: 'NOT_CONFIRMED' }, 400)

  const asCaller = createClient(url, publicKey, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: who, error: whoErr } = await asCaller.auth.getUser(auth.slice(7))
  if (whoErr || !who?.user) return json({ error: 'NOT_SIGNED_IN' }, 401)

  const { data: outcome, error: prepErr } = await asCaller.rpc('prepare_account_deletion')
  if (prepErr) return json({ error: prepErr.message }, 403)

  const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { error: delErr } = await admin.auth.admin.deleteUser(who.user.id)
  if (delErr) return json({ error: `AUTH: ${delErr.message}` }, 500)

  return json({ ok: true, outcome })
})
