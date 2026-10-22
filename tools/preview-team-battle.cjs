const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/anjan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/battles/monk-group');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.css':'text/css','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wasm':'application/wasm'};
(async()=>{
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/\/$/,'/index.html'));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(data);});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
 let page,errors=[];
 try{
  page=await browser.newPage({viewport:{width:1280,height:720}});page.setDefaultTimeout(30000);
  page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});fs.mkdirSync(out,{recursive:true});
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(()=>window.SceneManager&&SceneManager._scene instanceof Scene_Title);
  // Step the real MZ simulation between inputs and render only screenshots.
  // This avoids software-WebGL frame throttling in headless Windows tests.
  await page.evaluate(()=>{Graphics._app.ticker.stop();SceneManager.isGameActive=()=>true;DataManager.setupNewGame();SceneManager.goto(Scene_Map);});
  const wait=async(predicate,arg)=>page.waitForFunction(({source,arg})=>{
   const condition=eval('('+source+')');
   for(let frame=0;frame<12;frame++){if(condition(arg))return true;SceneManager.updateMain();}
   return condition(arg);
  },{source:predicate.toString(),arg},{polling:50});
  const mapReady=async()=>wait(()=>SceneManager._scene instanceof Scene_Map&&SceneManager._scene.isStarted()&&SceneManager._scene.isReady()&&SceneManager._scene._fadeDuration===0&&!$gameMap.isEventRunning());
  await mapReady();
  const frames=async()=>page.evaluate(()=>{for(let frame=0;frame<4;frame++)SceneManager.updateMain();});
  const choose=async(index)=>{await page.evaluate(i=>{const w=SceneManager._scene._duelCards;w.select(i);w.processOk();},index);await frames();};
  const mode=async(value)=>wait(m=>BattleManager._wwsDuel?.mode===m&&SceneManager._scene._duelCards?._mode===m&&SceneManager._scene._duelCards.active,value);
  const shot=async(name)=>{await page.evaluate(()=>Graphics._app.render());return page.screenshot({path:path.join(out,name+'.png'),timeout:60000});};
  const talk=async()=>{
   await page.evaluate(()=>{$gamePlayer.locate(10,10);$gamePlayer.setDirection(8);$gamePlayer.checkEventTriggerThere([0]);});
   await wait(()=>SceneManager._scene instanceof Scene_Battle&&SceneManager._scene.isStarted()&&SceneManager._scene.isReady()&&SceneManager._scene._fadeDuration===0);
   await wait(()=>{
    if(BattleManager._wwsDuel?.mode==='openingDialogue')return true;
    if($gameMessage.isBusy()){const w=SceneManager._scene._messageWindow;w.pause=false;w._textState=null;w.terminateMessage();$gameMessage.clear();}
    return false;
   });
   await page.evaluate(()=>{const w=SceneManager._scene._messageWindow;w.pause=false;w._textState=null;w.terminateMessage();$gameMessage.clear();});
   await mode('stance');
  };
  await talk();
  assert.equal(await page.evaluate(()=>$gameParty.battleMembers().length),3);
  const opening=[];
  for(let i=0;i<3;i++){
   await mode('stance');opening.push(await page.evaluate(()=>WwsDuelRules.actor().name()));await choose(i%3);
  }
  assert.equal(new Set(opening).size,3);
  await page.evaluate(()=>{
   window.teamHits=[];const invoke=BattleManager.invokeAction;
   BattleManager.invokeAction=function(subject,target){window.teamHits.push({actor:subject.isActor(),source:subject.name(),target:target.name(),legal:WwsDuelRules.legalTargets(subject).includes(target)});return invoke.call(this,subject,target);};
  });
  let actions=0,flankShot=false,centerShot=false,bodyShot=false;const menus=[],turns=new Set();
  while(true){
   await wait(()=>BattleManager._wwsDuel.mode==='finished'||(BattleManager._wwsDuel.mode==='action'&&SceneManager._scene._duelCards.active&&SceneManager._scene._duelCards.visible));
   if(await page.evaluate(()=>BattleManager._wwsDuel.mode==='finished'))break;
   if(++actions>100)throw Error('Team battle did not finish');
   turns.add(await page.evaluate(()=>WwsDuelRules.actor().name()));
   await choose(actions<=3?0:1);
   const targetMode=await page.evaluate(()=>BattleManager._wwsDuel.mode);
   if(targetMode==='opponent'){
    await mode('opponent');
    const menu=await page.evaluate(()=>({name:WwsDuelRules.actor().name(),lane:WwsDuelRules.lane(WwsDuelRules.actor()),options:SceneManager._scene._duelCards._list.map(c=>c.ext),legal:WwsDuelRules.legalTargets().map(b=>b.index())}));
    assert.deepEqual(menu.options,menu.legal);menus.push(menu);
    if(menu.lane===1&&!centerShot){await shot('team-battle-3v3');await shot('team-formation-3v3-preview');centerShot=true;}
    if(menu.lane!==1&&!flankShot){assert.equal(menu.options.length,2);await shot('team-battle-flank-targets');flankShot=true;}
    await choose(0);
   }
   await mode('target');if(!bodyShot){await shot('team-battle-body-targets');bodyShot=true;}
   await choose(1);
  }
  assert.equal(turns.size,3);assert(centerShot&&flankShot&&bodyShot);
  const hits=await page.evaluate(()=>window.teamHits);assert(hits.length>0&&hits.every(h=>h.legal));
  assert(hits.some(h=>!h.actor),'Enemy AI must take real turns');
  assert(await page.evaluate(()=>$gameTroop.members().every(b=>b.isDead())));
  const returnToMap=async()=>{
   await wait(()=>{
    if(SceneManager._scene instanceof Scene_Map&&!$gameMap.isEventRunning())return true;
    if($gameMessage.isBusy()){const w=SceneManager._scene._messageWindow;w.pause=false;w._textState=null;w.terminateMessage();$gameMessage.clear();}
    return false;
   });await mapReady();
   assert.equal(await page.evaluate(()=>$gameParty.members().length),1);
  };
  await returnToMap();
  await talk();await page.evaluate(()=>SceneManager._scene._duelCards.processCancel());await returnToMap();
  assert.deepEqual(errors,[]);
  const report={actualBattle:'3 vs 3',simulationClock:'real MZ frames stepped between inputs',opening,actions,turns:[...turns],menus,hits,victory:true,escape:true,partyRestored:true,errors};
  fs.writeFileSync(path.join(out,'team-battle-check.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }catch(e){console.log({errors,state:await page.evaluate(()=>({scene:SceneManager._scene?.constructor.name,mode:BattleManager._wwsDuel?.mode,phase:BattleManager._phase,frame:Graphics.frameCount,stopped:SceneManager._stopped,active:SceneManager.isGameActive(),busy:BattleManager.isBusy(),sceneBusy:SceneManager._scene.isBusy(),log:{wait:BattleManager._logWindow._waitCount,mode:BattleManager._logWindow._waitMode,methods:BattleManager._logWindow._methods},sprites:SceneManager._scene._spriteset.battlerSprites().map(s=>({name:s._battler?.name(),moving:s._movementDuration,effect:s._effectDuration})),feedback:{motion:WwsDuelFeedback.motionFrames,stop:WwsDuelFeedback.hitStop},subject:BattleManager._subject?.name(),message:$gameMessage.allText(),error:Graphics._errorPrinter?.textContent}))});if(page)await page.screenshot({path:path.join(out,'team-battle-failure.png')});throw e;}
 finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
