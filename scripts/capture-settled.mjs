/**
 * Headless Chrome CDP capture after campus boot settles.
 * Usage: node scripts/capture-settled.mjs [url] [out.png]
 */
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createConnection } from 'node:net'

const url = process.argv[2] || 'http://127.0.0.1:5190/?quality=hero'
const out = resolve(process.argv[3] || '.verify-shots/campus-overview-settled.png')
const chromeCandidates = [
  `${process.env['ProgramFiles']}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env['ProgramFiles(x86)']}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
]
const chrome = chromeCandidates.find((p) => existsSync(p))
if (!chrome) throw new Error('Chrome not found')

mkdirSync(dirname(out), { recursive: true })
const profile = resolve('.verify-shots/cdp-settle-profile')
const port = 9333

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function waitPort(p, ms = 15000) {
  const start = Date.now()
  while (Date.now() - start < ms) {
    const ok = await new Promise((resolveOk) => {
      const s = createConnection({ host: '127.0.0.1', port: p }, () => {
        s.end()
        resolveOk(true)
      })
      s.on('error', () => resolveOk(false))
    })
    if (ok) return
    await sleep(200)
  }
  throw new Error(`CDP port ${p} not ready`)
}

const proc = spawn(
  chrome,
  [
    '--headless=new',
    '--enable-gpu',
    '--ignore-gpu-blocklist',
    '--use-angle=d3d11',
    '--enable-webgl',
    '--hide-scrollbars',
    `--window-size=1600,900`,
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${port}`,
    '--disable-background-networking',
    '--disable-extensions',
    url,
  ],
  { stdio: 'ignore', detached: false },
)

try {
  await waitPort(port)
  await sleep(1500)
  const tabs = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json())
  const page = tabs.find((t) => t.type === 'page' && /5190|localhost|127\.0\.0\.1/.test(t.url)) || tabs.find((t) => t.type === 'page')
  if (!page?.webSocketDebuggerUrl) throw new Error(`No page tab: ${JSON.stringify(tabs)}`)

  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolveWs, reject) => {
    ws.addEventListener('open', () => resolveWs(undefined), { once: true })
    ws.addEventListener('error', (e) => reject(e), { once: true })
  })

  let id = 0
  const pending = new Map()
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(String(ev.data))
    if (msg.id && pending.has(msg.id)) {
      const { resolve: res, reject: rej } = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.error) rej(new Error(JSON.stringify(msg.error)))
      else res(msg.result)
    }
  })

  function send(method, params = {}) {
    const msgId = ++id
    return new Promise((res, rej) => {
      pending.set(msgId, { resolve: res, reject: rej })
      ws.send(JSON.stringify({ id: msgId, method, params }))
    })
  }

  await send('Runtime.enable')
  await send('Page.enable')

  // Wait until boot enter button visible OR boot overlay gone / campus ready console.
  const deadline = Date.now() + 180_000
  let ready = false
  while (Date.now() < deadline) {
    const evalResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const enter = document.querySelector('#boot-enter-btn');
        const boot = document.querySelector('#boot');
        const label = document.querySelector('#boot-label')?.textContent || '';
        const canvas = document.querySelector('canvas');
        return {
          enterVisible: !!(enter && !enter.hidden),
          bootGone: !boot,
          label,
          hasCanvas: !!canvas,
          readyFlag: !!(window.__CAMPUS_READY__),
        };
      })()`,
      returnByValue: true,
    })
    const st = evalResult?.result?.value
    console.log('[capture]', st)
    if (
      st?.hasCanvas &&
      (st?.enterVisible || st?.readyFlag || /100%|Campus ready/i.test(st?.label || ''))
    ) {
      ready = true
      break
    }
    await sleep(2000)
  }
  if (!ready) console.warn('[capture] timed out waiting for boot; shooting anyway')

  // Click enter if present, then settle for shadows/GTAO
  await send('Runtime.evaluate', {
    expression: `(() => {
      const enter = document.querySelector('#boot-enter-btn');
      if (enter && !enter.hidden) enter.click();
      return true;
    })()`,
    returnByValue: true,
  })
  await sleep(3500)

  const diag = await send('Runtime.evaluate', {
    expression: `(() => {
      const canvas = document.querySelector('canvas');
      const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
      return {
        ready: !!window.__CAMPUS_READY__,
        webgl: !!gl,
        renderer: gl?.getParameter(gl.RENDERER) || null,
        vendor: gl?.getParameter(gl.VENDOR) || null,
      };
    })()`,
    returnByValue: true,
  })
  console.log('[capture] diag', diag?.result?.value)

  const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true })
  writeFileSync(out, Buffer.from(shot.data, 'base64'))
  console.log('[capture] wrote', out, 'bytes', Buffer.from(shot.data, 'base64').length)
  ws.close()
} finally {
  try {
    proc.kill()
  } catch {}
}
