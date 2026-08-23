// Usage: node scripts/ws-shot.mjs <view> [sub] [outdir]   (dev harness screenshots, 1440 + 390)
import puppeteer from 'puppeteer-core';
const [view='overview', sub='', out='/private/tmp/claude-501/-Users-gustavhemmingsson-vaults/819b3b94-545f-4f24-b31c-09021d13f818/scratchpad/shots'] = process.argv.slice(2);
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
for (const [w,h,m] of [[1440,900,false],[390,844,true]]) {
  const p=await b.newPage(); await p.setViewport({width:w,height:h,deviceScaleFactor:1,isMobile:m,hasTouch:m});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e.message).slice(0,140))); p.on('console',x=>{if(x.type()==='error')errs.push(x.text().slice(0,140))});
  await p.goto(`http://localhost:3777/dev-ws?view=${view}${sub?`&sub=${sub}`:''}`,{waitUntil:'networkidle0',timeout:60000});
  await new Promise(r=>setTimeout(r,1500));
  const mtr=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth,h:document.documentElement.scrollHeight}));
  const f=`${out}/ws-${view}${sub?'-'+sub:''}-${w}.png`; await p.screenshot({path:f,fullPage:true});
  console.log(view, sub, w, 'overflow:'+(mtr.sw>mtr.iw), 'h:'+mtr.h, 'errors:'+errs.length, errs.slice(0,3).join(' | '), f);
  await p.close();
}
await b.close();
