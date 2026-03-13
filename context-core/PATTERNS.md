# KEY PATTERNS

## Navigation on deployed sites
window.dispatchEvent(new CustomEvent('iam_navigate', { detail: { page: 'slug' } }))
NEVER use router.push on deployed sites

## Auth refresh before every Supabase request (client components)
const raw = localStorage.getItem('iam_client_session')
const stored = JSON.parse(raw)
const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'apikey': supabaseAnonKey },
  body: JSON.stringify({ refresh_token: stored.refresh_token }),
})
const { access_token } = await res.json()

## Supabase client in components — useMemo REQUIRED
const client = useMemo(() => createClient(url, key, {
  auth: { persistSession: false },
  global: { headers: { Authorization: `Bearer ${accessToken}` } }
}), [url, key, accessToken])
// Without useMemo: render loop + thousands of GoTrueClient instances

## Color tokens — copy exactly
function buildTokens(darkBg, lightBg) {
  return {
    dark:  { bg: darkBg, text: '#ffffff', textSecondary: 'rgba(255,255,255,0.6)',
             cardBg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
    light: { bg: lightBg, text: '#0a0a0a', textSecondary: 'rgba(0,0,0,0.6)',
             cardBg: 'rgba(0,0,0,0.03)', border: 'rgba(0,0,0,0.08)' },
  }
}

## Dashboard section navigation
window.__pendingDashboardSection = sectionId  // before navigate
window.__activeDashboardSection = sectionId   // on section change

## Deploy after changes
git add [files] && git commit -m "type: description" && git push origin main

## Git divergence fix (if needed)
git stash && git pull origin main
