const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/anjan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/battles/legendary-ronin');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.css':'text/css','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wasm':'application/wasm'};
(async()=>{
 const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=path.resolve(root,'.'+decodeURIComponent(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(data);});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
 try{
  fs.mkdirSync(out,{recursive:true});
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],failed=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
  await page.goto('http://127.0.0.1:'+server.address().port+'/');
  await page.waitForFunction(()=>window.SceneManager&&SceneManager._scene instanceof Scene_Title);
  await page.evaluate(()=>{Graphics._app.ticker.stop();SceneManager.isGameActive=()=>true;DataManager.setupNewGame();SceneManager.goto(Scene_Map);});
  const wait=async(predicate,arg)=>page.waitForFunction(({source,arg})=>{
   const condition=eval('('+source+')');
   for(let n=0;n<12;n++){if(condition(arg))return true;SceneManager.updateMain();}
   return condition(arg);
  },{source:predicate.toString(),arg},{polling:50,timeout:30000}).catch(async e=>{
   console.error(JSON.stringify(await page.evaluate(()=>({scene:SceneManager._scene?.constructor.name,phase:BattleManager._phase,
    duel:BattleManager._wwsDuel?.mode,message:$gameMessage.allText(),choice:SceneManager._scene._choiceListWindow?.active,
    eventIndex:$gameMap._interpreter._index,error:Graphics._errorPrinter?.innerHTML}))));
   console.error(JSON.stringify({errors,failed}));
   await page.screenshot({path:path.join(out,'failure.png')});throw e;
  });
  const mapReady=()=>wait(()=>SceneManager._scene instanceof Scene_Map&&SceneManager._scene.isStarted()&&SceneManager._scene.isReady()&&SceneManager._scene._fadeDuration===0&&!$gameMap.isEventRunning());
  const shot=async name=>{await page.evaluate(()=>Graphics._app.render());await page.screenshot({path:path.join(out,name+'.png'),timeout:60000});};
  const message=()=>wait(()=>SceneManager._scene._messageWindow?.pause||SceneManager._scene._choiceListWindow?.active);
  const dismiss=()=>page.evaluate(()=>{const w=SceneManager._scene._messageWindow;w.pause=false;w._textState=null;w.terminateMessage();$gameMessage.clear();});
  const choose=async index=>{await page.evaluate(i=>{const w=SceneManager._scene._choiceListWindow;w.select(i);w.processOk();},index);};
  await mapReady();
  const reach=await page.evaluate(()=>{
   const event=$gameMap.events().find(e=>e.event().note==='wws:legendary-ronin');
   const q=[[$gamePlayer.x,$gamePlayer.y]],seen=new Set(q.map(p=>p.join(',')));
   for(let i=0;i<q.length;i++)for(const d of [2,4,6,8]){
    const [x,y]=q[i],nx=$gameMap.roundXWithDirection(x,d),ny=$gameMap.roundYWithDirection(y,d),key=nx+','+ny;
    if(!seen.has(key)&&$gamePlayer.canPass(x,y,d)){seen.add(key);q.push([nx,ny]);}
   }
   if(!seen.has(event.x+','+(event.y+1)))throw Error('Ronin unreachable');
   $gamePlayer.locate(event.x,event.y+1);$gamePlayer.setDirection(8);
   SceneManager._scene._mapNameWindow.close();
   return {eventId:event.eventId(),position:[event.x,event.y],reachable:true};
  });
  await wait(()=>SceneManager._scene._spriteset._characterSprites.every(s=>s.bitmap?.isReady()));
  await shot('courtyard');
  const talk=()=>page.evaluate(()=>$gamePlayer.checkEventTriggerThere([0]));
  await talk();await message();await shot('dialogue');
  await dismiss();
  await wait(()=>SceneManager._scene._choiceListWindow?.active);
  await choose(1);await message();await dismiss();await mapReady();
  await talk();await message();await dismiss();
  await wait(()=>SceneManager._scene._choiceListWindow?.active);await choose(0);
  await wait(()=>{
   if(!(SceneManager._scene instanceof Scene_Battle))return false;
   if(BattleManager._wwsDuel?.mode==='stance'&&SceneManager._scene._duelCards?.active&&SceneManager._scene._fadeDuration===0)return true;
   const w=SceneManager._scene._messageWindow;
   if(w?.pause){w.pause=false;w._textState=null;w.terminateMessage();}
   return false;
  });
  await wait(()=>SceneManager._scene._spriteset._enemySprites.every(s=>s.bitmap?.isReady()));
  const battle=await page.evaluate(()=>{
   const enemy=$gameTroop.members()[0],sprite=SceneManager._scene._spriteset._enemySprites[0];
   return {name:enemy.name(),hp:enemy.mhp,sprite:sprite.bitmap._url,scale:sprite.scale.x,
    sparring:BattleManager._wwsDuel.sparring,party:$gameParty.battleMembers().map(a=>a.name())};
  });
  assert.equal(battle.name,'Legendary Ronin');assert.equal(battle.hp,1400);assert(battle.sparring);
  assert(battle.sprite.includes('StrawHatRonin-v2'));assert.equal(battle.scale,1);assert.equal(battle.party.length,1);
  await shot('boss-opening');
  await page.evaluate(()=>{
   window.roninHits=[];
   const invoke=BattleManager.invokeAction;
   BattleManager.invokeAction=function(subject,target){
    const strike=this._wwsDuel?.twoSwordStrike,defense=this._wwsDuel?.defense;
    const hp=target.hp;
    const result=invoke.call(this,subject,target);
    if(WwsDuelRules.hasTwoSwordAttack(subject))window.roninHits.push({strike,defense,damage:hp-target.hp,stance:subject._wws.stance,time:performance.now()});
    return result;
   };
  });
  await page.evaluate(()=>BattleManager.wwsChooseStance('Chudan'));
  await wait(()=>BattleManager._wwsDuel?.mode==='action'&&SceneManager._scene._duelCards?.active);
  const twoSword=await page.evaluate(()=>({stance:$gameTroop.members()[0]._wws.stance,hits:window.roninHits,
   stances:WwsDuelRules.availableStances($gameTroop.members()[0])}));
  assert.equal(twoSword.stance,'Two Sword');assert.deepEqual(twoSword.stances,['Two Sword']);
  assert.deepEqual(twoSword.hits.map(h=>h.strike),[1,2]);
  await page.evaluate(()=>BattleManager.wwsChooseAction('Quick Cut'));
  await wait(()=>BattleManager._wwsDuel.mode==='target'&&SceneManager._scene._duelTargets?.visible&&SceneManager._scene._duelTargets?._markers?.visible);
  await shot('body-targets');
  await page.evaluate(()=>{BattleManager.wwsCancelTarget();SceneManager._scene._duelCards.callHandler('cancel');});
  await message();await dismiss();await mapReady();
  const recovered=await page.evaluate(()=>$gameParty.members().every(a=>a.hp===a.mhp&&a.mp===a.mmp));
  assert(recovered);assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  const result={...reach,battle,twoSword,decline:true,escape:true,recovered,errors,failed};
  fs.writeFileSync(path.join(out,'browser-check.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
