// Usage: node scripts/ws-shot-theme.mjs <view> <theme:dark|light> [sub] [outdir]
import puppeteer from 'puppeteer-core';
const [view = 'agents', theme = 'dark', sub = '', out = '/private/tmp/claude-501/-Users-gustavhemmingsson-vaults/819b3b94-545f-4f24-b31c-09021d13f818/scratchpad/shots'] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
if (theme === 'light') {
  await p.evaluateOnNewDocument(() => { try { window.localStorage.setItem('apiclaw-theme', 'light'); } catch {} });
}
const errs = [];
p.on('pageerror', e => errs.push(String(e.message).slice(0, 140)));
p.on('console', x => { if (x.type() === 'error') errs.push(x.text().slice(0, 140)); });
await p.goto(`http://localhost:3777/dev-ws?view=${view}${sub ? `&sub=${sub}` : ''}`, { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise(r => setTimeout(r, 1500));
const f = `${out}/ws-${view}${sub ? '-' + sub : ''}-${theme}.png`;
await p.screenshot({ path: f, fullPage: true });
console.log(view, sub, theme, 'errors:' + errs.length, errs.slice(0, 3).join(' | '), f);
await p.close();
await b.close();
