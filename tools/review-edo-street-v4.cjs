// Focused, one-time native engine review for the street/courtyard revision.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/anjan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/art/edo-street-v4'),backup=path.join(root,'docs/maps/backups/before-edo-street-v4');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const m=read(path.join(root,'data/Map003.json')),c=read(path.join(root,'data/Map001.json')),sets=read(path.join(root,'data/Tilesets.json'));
const oldM=read(path.join(backup,'Map003.json')),oldC=read(path.join(backup,'Map001.json')),oldS=read(path.join(backup,'Tilesets.json'));
const expectedC=structuredClone(oldC);for(const id of [8,9,10]){expectedC.events[id].y=13;expectedC.events[id].pages[0].list[0].parameters=[0,3,38,3,4,0];}
assert.deepEqual(c,expectedC,'Only courtyard gate event edits');
const expectedM=structuredClone(oldM);expectedM.note=m.note;for(const e of expectedM.events)if(e)e.pages[0].list[0].parameters=[0,1,12,12,8,0];
assert.deepEqual(m,expectedM,'Only street note and destinations changed; layout/event structure retained');
const expectedS=structuredClone(oldS);expectedS[m.tilesetId]=sets[m.tilesetId];assert.deepEqual(sets,expectedS);
for(const n of ['MapInfos','System','Actors','Map002'])assert(fs.readFileSync(path.join(root,'data',n+'.json')).equals(fs.readFileSync(path.join(backup,n+'.json'))),n+' unchanged');
assert.deepEqual([m.width,m.height],[42,15]);assert.equal(m.encounterList.length,0);assert.equal(m.events.filter(Boolean).length,2);
for(const map of [m,c])for(const e of map.events.filter(Boolean))for(const p of e.pages)for(const cmd of p.list)if(cmd.code===201){const [mode,id,x,y]=cmd.parameters;assert.equal(mode,0);const target=read(path.join(root,`data/Map${String(id).padStart(3,'0')}.json`));assert(x>=0&&x<target.width&&y>=0&&y<target.height);}
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.woff':'font/woff','.ogg':'audio/ogg','.css':'text/css'};
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(file,(err,b)=>{if(err)res.writeHead(404).end();else{res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(b);}});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});page.setDefaultTimeout(60000);
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(()=>window.SceneManager&&SceneManager._scene instanceof Scene_Title);
  await page.evaluate(()=>{DataManager.setupNewGame();SceneManager.goto(Scene_Map);});
  const ready=async()=>page.waitForFunction(()=>SceneManager._scene instanceof Scene_Map&&SceneManager._scene.isReady()&&SceneManager._scene._fadeDuration===0&&SceneManager._scene._spriteset._tilemap._bitmaps.every(b=>!b||b.isReady()));
  await ready();
  const transfer=async(id,x,y,d)=>{await page.evaluate(([id,x,y,d])=>$gamePlayer.reserveTransfer(id,x,y,d,2),[id,x,y,d]);await page.waitForFunction(id=>$gameMap.mapId()===id&&!$gamePlayer.isTransferring(),id);await ready();};
  const settle=async()=>page.evaluate(()=>new Promise(r=>{let n=0;function tick(){if(++n>8)r();else requestAnimationFrame(tick);}tick();}));
  const capture=async(name)=>{await page.evaluate(()=>SceneManager._scene._mapNameWindow.close());await settle();await page.evaluate(()=>SceneManager.stop());await page.screenshot({path:path.join(out,name+'.png')});await page.evaluate(()=>SceneManager.resume());};
  const result={scope:'Native 1280x720 engine review; real player sprite and gate cue',preservation:true,transfers:[]};
  await transfer(3,38,3,4);
  result.street=await page.evaluate(()=>{
   const checks=[];for(let y=0;y<15;y++)for(let x=0;x<42;x++)for(const d of [2,4,6,8]){const expected=(x>=1&&x<=40&&y>=4&&y<=11)||(x>=32&&x<=40&&y===3)||([38,39].includes(x)&&y===2);if($gameMap.isPassable(x,y,d)!==expected)checks.push([x,y,d]);}
   const q=[[38,3]],seen=new Set(['38,3']);for(let i=0;i<q.length;i++)for(const d of [2,4,6,8]){const [x,y]=q[i],nx=$gameMap.roundXWithDirection(x,d),ny=$gameMap.roundYWithDirection(y,d),key=nx+','+ny;if(!seen.has(key)&&$gamePlayer.canPass(x,y,d)){seen.add(key);q.push([nx,ny]);}}
   return {passageMismatches:checks,reachable:seen.size,viewport:[Graphics.width,Graphics.height],actor:$gameParty.leader().characterName(),dimensions:[$gameMap.width(),$gameMap.height()],gateApproaches:[[38,2],[39,2],[32,3],[40,3]].map(p=>seen.has(p.join(',')))};
  });
  assert.deepEqual(result.street.passageMismatches,[]);assert.deepEqual(result.street.viewport,[1280,720]);assert(result.street.gateApproaches.every(Boolean));assert.equal(result.street.reachable,331);
  await capture('street-east-native');
  for(const [name,x,y,d] of [['street-west-native',8,7,4],['street-middle-native',23,7,4],['dojo-wall-contact-native',34,3,8]]){await page.evaluate(([x,y,d])=>{$gamePlayer.locate(x,y);$gamePlayer.setDirection(d);$gamePlayer.center(x,y);},[x,y,d]);await capture(name);}
  if(process.env.WWS_VISUAL_ONLY){result.transfers=read(path.join(out,'engine-checks.json')).transfers;result.transferEvidence='Retained from completed unchanged-data movement check';}
  if(!process.env.WWS_VISUAL_ONLY){
  for(const x of [11,12,13]){
   await transfer(1,x,12,2);await page.evaluate(()=>$gamePlayer.moveStraight(2));
   await page.waitForFunction(()=>$gameMap.mapId()===3&&!$gamePlayer.isTransferring());await ready();
   const pos=await page.evaluate(()=>[$gameMap.mapId(),$gamePlayer.x,$gamePlayer.y,$gamePlayer.direction()]);assert.deepEqual(pos,[3,38,3,4]);result.transfers.push({from:[1,x,13],arrival:pos});
  }
  for(const x of [38,39]){
   await page.evaluate(x=>{$gamePlayer.locate(x,3);$gamePlayer.moveStraight(8);},x);
   await page.waitForFunction(()=>$gameMap.mapId()===1&&!$gamePlayer.isTransferring());await ready();
   const pos=await page.evaluate(()=>[$gameMap.mapId(),$gamePlayer.x,$gamePlayer.y,$gamePlayer.direction()]);assert.deepEqual(pos,[1,12,12,8]);result.transfers.push({from:[3,x,2],arrival:pos});
   if(x===38)await capture('courtyard-arrival-native');
   await transfer(3,38,3,4);
  }
  await transfer(1,12,11,2);await capture('courtyard-gate-inside-native');
  }
  // Exit event is deliberately held only for this contact portrait so the
  // actual engine can draw the player at the trigger before changing maps.
  await transfer(3,38,3,8);await page.evaluate(()=>{$gameMap.events().forEach(e=>e._trigger=0);$gamePlayer.moveStraight(8);});
  await page.waitForFunction(()=>!$gamePlayer.isMoving());await capture('street-gate-threshold-native');
  assert.deepEqual(errors,[]);result.errors=errors;
  fs.writeFileSync(path.join(out,'engine-checks.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
