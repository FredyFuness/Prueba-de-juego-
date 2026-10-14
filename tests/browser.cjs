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
    const errors=[],consoleErrors=[],failedRequests=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
    page.on('requestfailed',r=>failedRequests.push(r.url()+': '+r.failure()?.errorText));
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle2',timeout:45000});
    await page.waitForSelector('#start-button');
    await page.waitForFunction(()=>document.querySelector('canvas#game-canvas')?.width>0,{timeout:25000});
    assert(await page.$('#start-button'),'Start button not found');
    await page.waitForFunction(()=>window.__nocturneModelStatus!==undefined,{timeout:30000});
    const actorStatus=await page.evaluate(()=>window.__nocturneModelStatus);
    console.log('3D actor loading:',JSON.stringify(actorStatus));
    assert(actorStatus.loaded===true,'Skinned glTF character did not load: '+JSON.stringify(actorStatus));
    assert(actorStatus.characters===6,'Expected player + five enemies to use animated mesh: '+JSON.stringify(actorStatus));
    assert(actorStatus.asset==='soldier.glb','High-quality soldier model was not selected: '+JSON.stringify(actorStatus));
    assert(actorStatus.animations.some(s=>/idle/i.test(s)),'Animation set missing Idle clip');
    assert(actorStatus.animations.some(s=>/walk/i.test(s)),'Animation set missing Walk clip');
    assert(actorStatus.animations.some(s=>/run/i.test(s)),'Animation set missing Run clip');
    await page.screenshot({path:'/tmp/nocturne-intro.png'});
    await page.click('#start-button');
    await new Promise(resolve=>setTimeout(resolve,1000));
    const diagnostics=await page.evaluate(()=>({
      webgl2:!!document.createElement('canvas').getContext('webgl2'),
      startupStack:window.__nocturneStartupError||'',
      error:document.querySelector('#load-error')?.textContent,
      errorHidden:document.querySelector('#load-error')?.classList.contains('hidden'),
      hudHidden:document.querySelector('#hud')?.classList.contains('hidden'),
      startHidden:document.querySelector('#start-screen')?.classList.contains('hidden')
    }));
    console.log('Debug browser startup:',JSON.stringify({diagnostics,errors,consoleErrors,failedRequests}));
    assert(!diagnostics.startupStack,'Game startup failed: '+diagnostics.startupStack);
    await page.waitForFunction(()=>document.querySelector('#hud')&&!document.querySelector('#hud').classList.contains('hidden'),{timeout:15000});
    await page.waitForSelector('[data-action="dodge"]');
    const missionCollapsed=await page.evaluate(()=>({
      hidden:getComputedStyle(document.querySelector('#mission-panel')).display==='none',
      toggle:getComputedStyle(document.querySelector('#mission-toggle')).display!=='none',
      progress:document.querySelector('#quick-progress')?.textContent
    }));
    assert(missionCollapsed.hidden,'Phone mission panel should start collapsed');
    assert(missionCollapsed.toggle,'Mobile mission toggle should be visible');
    assert(missionCollapsed.progress.includes('0/3'),'Compact mission status was not populated');
    await page.click('#mission-toggle');
    assert(await page.evaluate(()=>document.querySelector('#mission-panel').classList.contains('expanded')),'Tapping objectives did not expand mission');
    await page.click('#mission-toggle');
    assert(await page.evaluate(()=>!document.querySelector('#mission-panel').classList.contains('expanded')),'Tapping objectives did not collapse mission');
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
    const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))
       * Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
    assert(overlap(state.mission,state.joystick)<25,'Mobile HUD is overlapping left joystick');
    assert(overlap(state.controls,state.mission)<25,'Mobile HUD is overlapping right buttons');
    await page.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
    await new Promise(resolve=>setTimeout(resolve,800));
    await page.screenshot({path:'/tmp/nocturne-portrait.png'});
    const phone=await page.evaluate(()=>{
      const controls=document.querySelector('.touch-actions').getBoundingClientRect();
      const joystick=document.querySelector('#joystick').getBoundingClientRect();
      return {controls:{x:controls.x,w:controls.width},joystick:{x:joystick.x,w:joystick.width}};
    });
    assert(phone.joystick.x+phone.joystick.w<phone.controls.x,'Portrait controls overlap');
    assert(errors.length===0,'Uncaught browser exceptions: '+errors.join('; '));
    console.log('✓ Headless Chrome: render, title screen, game start, mobile controls and HUD OK');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
