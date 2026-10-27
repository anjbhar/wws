const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/anjan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/party');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.css':'text/css','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wasm':'application/wasm'};
(async()=>{
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/\/$/,'/index.html'));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(data);});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
 let page;const errors=[],checks=[];
 try{
  fs.mkdirSync(out,{recursive:true});page=await browser.newPage({viewport:{width:1280,height:720}});page.setDefaultTimeout(30000);
  page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://127.0.0.1:'+server.address().port+'/');
  await page.waitForFunction(()=>window.SceneManager&&SceneManager._scene instanceof Scene_Title);
  await page.evaluate(()=>{Graphics._app.ticker.stop();SceneManager.isGameActive=()=>true;DataManager.setupNewGame();SceneManager.goto(Scene_Map);});
  const wait=async(predicate,arg)=>page.waitForFunction(({source,arg})=>{
   const condition=eval('('+source+')');
   for(let frame=0;frame<12;frame++){if(condition(arg))return true;SceneManager.updateMain();}return condition(arg);
  },{source:predicate.toString(),arg},{polling:50});
  const frames=async(count=4)=>page.evaluate(n=>{for(let i=0;i<n;i++)SceneManager.updateMain();},count);
  const key=async(name)=>{await page.keyboard.down(name);await frames(1);await page.keyboard.up(name);await frames(1);};
  const shot=async(name)=>{await frames();await page.evaluate(()=>Graphics._app.render());await page.screenshot({path:path.join(out,name+'.png')});};
  const ready=()=>wait(()=>SceneManager._scene instanceof Scene_WwsParty&&SceneManager._scene.isStarted()&&SceneManager._scene.isReady()&&ImageManager.isReady());
  const state=()=>page.evaluate(()=>({active:$gameParty.wwsFormation().map(a=>a.actorId()),roster:$gameParty._actors.slice(),source:SceneManager._scene._sourceId,focus:SceneManager._scene._focus===SceneManager._scene._slots?'active':'reserves',selected:SceneManager._scene._details._actor?.actorId()}));
  const click=async(list,index)=>{
   const p=await page.evaluate(({list,index})=>{
    const w=SceneManager._scene[list],r=w.itemRect(index),canvas=document.querySelector('canvas').getBoundingClientRect();
    return {x:canvas.left+(w.x+w.padding+r.x+r.width/2-w.origin.x)*canvas.width/Graphics.width,y:canvas.top+(w.y+w.padding+r.y+r.height/2-w.origin.y)*canvas.height/Graphics.height};
   },{list,index});
   await page.mouse.move(p.x,p.y);await page.mouse.down();await frames(1);await page.mouse.up();await frames(2);
  };
  await wait(()=>SceneManager._scene instanceof Scene_Map&&SceneManager._scene.isStarted()&&SceneManager._scene.isReady());
  await page.evaluate(()=>SceneManager.push(Scene_Menu));
  await wait(()=>SceneManager._scene instanceof Scene_Menu&&SceneManager._scene.isStarted());
  const menu=await page.evaluate(()=>SceneManager._scene._commandWindow._list.map(c=>({name:c.name,symbol:c.symbol,enabled:c.enabled})));
  assert(menu.some(c=>c.symbol==='wwsParty'&&c.name==='Party'&&c.enabled));
  assert(!menu.some(c=>c.symbol==='formation'));
  await page.evaluate(()=>{const w=SceneManager._scene._commandWindow;w.selectSymbol('wwsParty');w.processOk();});await ready();
  assert.deepEqual((await state()).active,[1]);assert.equal((await state()).selected,1);
  await shot('hayato-only');
  await key('Enter');assert.equal((await state()).source,1);
  await key('ArrowRight');await key('Enter');assert.deepEqual((await state()).active,[1]);
  await key('Escape');assert.equal((await state()).source,null);
  await key('Escape');await wait(()=>SceneManager._scene instanceof Scene_Menu&&SceneManager._scene.isStarted());
  checks.push('One-actor menu access, empty positions, keyboard cancellation and return');
  // Roster fixtures live only in memory: the new-game database and save files stay untouched.
  await page.evaluate(()=>{for(const id of [9,10,2])$gameParty.addActor(id);$gameParty.setWwsFormation([1,9,10]);SceneManager.push(Scene_WwsParty);});await ready();
  await click('_slots',2);assert.equal((await state()).selected,10);assert.equal((await state()).source,10);
  await shot('three-active');
  await click('_slots',1);assert.deepEqual((await state()).active,[10,9,1]);assert.equal((await state()).source,null);
  await click('_slots',0);assert.equal((await state()).source,9);
  await click('_reserves',0);assert.deepEqual((await state()).active,[10,2,1]);assert.equal((await state()).source,null);
  assert.deepEqual((await state()).roster.slice().sort((a,b)=>a-b),[1,2,9,10]);
  await shot('reserve-swap');
  const save=await page.evaluate(()=>{const restored=JsonEx.parse(JsonEx.stringify($gameParty));return restored.wwsFormation().map(a=>a.actorId());});
  assert.deepEqual(save,[10,2,1]);
  await key('ArrowUp');assert.equal((await state()).focus,'active');
  await key('Tab');assert.equal((await state()).focus,'reserves');
  await key('Tab');assert.equal((await state()).focus,'active');
  checks.push('Mouse active swaps, reserve swaps, roster preservation, engine save round-trip and keyboard pane navigation');
  await page.evaluate(()=>{$gameSystem.disableFormation();SceneManager._scene.refreshScreen();});
  const locked=await state();await click('_slots',1);assert.deepEqual((await state()).active,locked.active);assert.equal((await state()).source,null);
  await shot('formation-locked');
  await page.evaluate(()=>{$gameSystem.enableFormation();for(const id of [3,4,5,6,7,8])$gameParty.addActor(id);SceneManager._scene.refreshScreen();});
  await key('Tab');
  for(let i=0;i<6;i++)await key('ArrowRight');
  assert.equal((await state()).selected,8);
  await frames(20);await shot('reserve-scroll');
  await key('Enter');assert.equal((await state()).source,8);
  await key('Tab');await key('Enter');assert((await state()).active.includes(8));
  checks.push('Formation lock, scrolling beyond six reserves and promoting a scrolled reserve');
  await key('Escape');await wait(()=>SceneManager._scene instanceof Scene_Menu&&SceneManager._scene.isStarted());
  // Reopening restores formation, and the menu item still works with many companions.
  await page.evaluate(()=>{const w=SceneManager._scene._commandWindow;w.selectSymbol('wwsParty');w.processOk();});await ready();
  assert((await state()).active.includes(8));
  await page.evaluate(()=>SceneManager._scene.back());await wait(()=>SceneManager._scene instanceof Scene_Menu&&SceneManager._scene.isStarted());
  // Screen fits the game's existing CSS-scaled smaller window; pointer coordinates track the canvas.
  await page.setViewportSize({width:960,height:540});
  await page.evaluate(()=>{for(const id of $gameParty._actors.slice())if(id!==1)$gameParty.removeActor(id);SceneManager.push(Scene_WwsParty);});await ready();
  const bounds=await page.evaluate(()=>{const r=document.querySelector('canvas').getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom};});
  assert(bounds.left>=-1&&bounds.top>=-1&&bounds.right<=961&&bounds.bottom<=541,'The full Party screen must fit inside the smaller viewport');
  await shot('small-window');
  await click('_slots',1);assert.equal((await state()).source,1);
  await key('Escape');await key('Escape');await wait(()=>SceneManager._scene instanceof Scene_Menu&&SceneManager._scene.isStarted());
  assert.equal(await page.evaluate(()=>Graphics._wwsPartyFit),false);
  assert.deepEqual(errors,[]);
  const report={checks,saveRoundTrip:save,smallWindow:'960 × 540',runtimeErrors:errors};
  fs.writeFileSync(path.join(out,'party-screen-check.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }catch(e){
  console.error({failure:String(e),errors,state:page?await page.evaluate(()=>({scene:SceneManager._scene?.constructor.name,error:Graphics._errorPrinter?.textContent})):null});
  if(page)await page.screenshot({path:path.join(out,'failure.png')});throw e;
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
