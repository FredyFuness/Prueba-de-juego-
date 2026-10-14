const puppeteer=require('puppeteer-core');
const assert=require('node:assert/strict');
const executable='/usr/bin/google-chrome';
(async()=>{
  const browser=await puppeteer.launch({
    headless:true,executablePath:executable,
    args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
  });
  try{
    const page=await browser.newPage();
    await page.setViewport({width:844,height:390,deviceScaleFactor:2,isMobile:true,hasTouch:true});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle2',timeout:45000});
    await page.waitForSelector('#start-button');
    await page.waitForFunction(()=>document.querySelector('canvas#game-canvas')?.width>0,{timeout:25000});
    assert(await page.$('#start-button'),'Start button not found');
    await page.screenshot({path:'/tmp/nocturne-intro.png'});
    await page.click('#start-button');
    await page.waitForFunction(()=>document.querySelector('#hud')&&!document.querySelector('#hud').classList.contains('hidden'),{timeout:12000});
    await page.waitForSelector('[data-action="dodge"]');
    await page.screenshot({path:'/tmp/nocturne-gameplay.png'});
    const state=await page.evaluate(()=>{
      const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}};
      return {
        canvas:rect(document.querySelector('canvas#game-canvas')),
        mission:rect(document.querySelector('.mission-panel')),
        joystick:rect(document.querySelector('#joystick')),
        controls:rect(document.querySelector('.touch-actions')),
        gameTitle:document.title,
        health:document.querySelector('#health-value').textContent
      };
    });
    console.log('Browser gameplay check:',JSON.stringify(state));
    assert(Number(state.health)>0,'Character HUD health missing');
    assert(errors.length===0,'Uncaught browser exceptions: '+errors.join('; '));
    console.log('✓ Headless Chrome: render, title screen, game start, mobile controls and HUD OK');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
