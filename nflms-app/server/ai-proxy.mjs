// Minimal Claude API proxy for the NFLMS Assistant.
// Keeps ANTHROPIC_API_KEY on the server; the browser talks to this instead of api.anthropic.com.
//
//   ANTHROPIC_API_KEY=sk-ant-... node server/ai-proxy.mjs          (port 8787)
//   PORT=9000 ALLOW_ORIGIN=https://bazar.example.gov.bd node server/ai-proxy.mjs
//
// Then set the proxy URL in the assistant's settings (⚙) or VITE_AI_PROXY_URL at build time.
import http from 'node:http'

const PORT = Number(process.env.PORT ?? 8787)
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN ?? '*'
const UPSTREAM = 'https://api.anthropic.com'
const KEY = process.env.ANTHROPIC_API_KEY
if (!KEY) { console.error('ANTHROPIC_API_KEY is not set'); process.exit(1) }

const cors = res => {
  res.setHeader('Access-Control-Allow-Origin', ALLOW_ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'content-type, anthropic-version, anthropic-beta, x-api-key, anthropic-dangerous-direct-browser-access, x-stainless-arch, x-stainless-lang, x-stainless-os, x-stainless-package-version, x-stainless-runtime, x-stainless-runtime-version, x-stainless-retry-count, x-stainless-timeout, x-stainless-helper-method')
}

http.createServer(async (req, res) => {
  cors(res)
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end() }
  if (req.method !== 'POST' || !req.url?.startsWith('/v1/messages')) { res.writeHead(404); return res.end('Not found') }
  const chunks = []
  for await (const c of req) chunks.push(c)
  try {
    const upstream = await fetch(UPSTREAM + req.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': KEY,
        'anthropic-version': req.headers['anthropic-version'] ?? '2023-06-01',
        ...(req.headers['anthropic-beta'] ? { 'anthropic-beta': req.headers['anthropic-beta'] } : {}),
      },
      body: Buffer.concat(chunks),
    })
    res.writeHead(upstream.status, { 'content-type': upstream.headers.get('content-type') ?? 'application/json' })
    if (!upstream.body) return res.end()
    for await (const chunk of upstream.body) res.write(chunk) // streams SSE through unchanged
    res.end()
  } catch (e) {
    res.writeHead(502, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ type: 'error', error: { type: 'proxy_error', message: String(e) } }))
  }
}).listen(PORT, () => console.log(`NFLMS AI proxy → ${UPSTREAM} on http://localhost:${PORT}`))
