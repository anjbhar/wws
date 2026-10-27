// Focused engine review: art-selected contact probes, real walking/scrolling,
// gate movement frames and scoped preservation. No expected-passage formula.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/anjan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,process.env.EDO_REVIEW_OUT||'docs/art/edo-street-v5-synchronized'),backup=path.join(root,'docs/maps/backups/before-edo-street-v5');
fs.mkdirSync(out,{recursive:true});
const freezeFrame=require('./lib/edo-capture.cjs');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const data=n=>read(path.join(root,'data',n+'.json')),old=n=>read(path.join(backup,'data',n+'.json'));
const m=data('Map003'),c=data('Map001'),sets=data('Tilesets');
assert.deepEqual({...m,note:''},{...old('Map003'),note:''});
const ec=old('Map001');for(const x of [11,13])for(const y of [12,13])ec.data[(15+y)*25+x]=512;
ec.events[8]=null;ec.events[9]=null;ec.note=c.note;assert.deepEqual(c,ec,'Only gate jamb collision, two obsolete exit events and canopy note change');
const es=old('Tilesets');es[m.tilesetId].tilesetNames[5]='EdoStreet_B-v5';es[m.tilesetId].tilesetNames[6]='EdoStreet_C-v5';es[m.tilesetId].tilesetNames[7]='EdoStreet_D-v5';es[m.tilesetId].note=sets[m.tilesetId].note;
es[c.tilesetId].tilesetNames[7]='EdoCourtyard_D-v5';assert.deepEqual(sets,es,'Other tileset fields and flags unchanged');
for(const n of ['Map002','Actors','System','MapInfos'])assert(fs.readFileSync(path.join(root,'data',n+'.json')).equals(fs.readFileSync(path.join(backup,'data',n+'.json'))));
assert.deepEqual([m.width,m.height],[42,15]);assert.equal(m.encounterList.length,0);assert.equal(m.events.filter(Boolean).length,2);
for(const map of [m,c])for(const e of map.events.filter(Boolean))for(const p of e.pages)for(const cmd of p.list)if(cmd.code===201){const [mode,id,x,y]=cmd.parameters;assert.equal(mode,0);const t=data('Map'+String(id).padStart(3,'0'));assert(x>=0&&x<t.width&&y>=0&&y<t.height);}
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.woff':'font/woff','.ogg':'audio/ogg','.css':'text/css'};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(file,(e,b)=>{if(e)res.writeHead(404).end();else{res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(b);}});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});page.setDefaultTimeout(60000);
  const errors=[],failed=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)failed.push([r.status(),r.url()]);});
  const result={scope:'Actual engine captures, normal player speed, art-selected contact probes; no transfer event suppression',preservation:true,contacts:[],captures:[],transfers:[],walking:[]};
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(()=>window.SceneManager&&SceneManager._scene instanceof Scene_Title);
  await page.evaluate(()=>{DataManager.setupNewGame();SceneManager.goto(Scene_Map);});
  const ready=async()=>page.waitForFunction(()=>SceneManager._scene instanceof Scene_Map&&SceneManager._scene.isReady()&&SceneManager._scene._fadeDuration===0&&SceneManager._scene._spriteset._tilemap._bitmaps.every(b=>!b||b.isReady())&&SceneManager._scene._spriteset._tilemap.children.filter(s=>s._wwsGateCanopy).every(s=>s.bitmap.isReady()));
  const frames=async(n=8)=>page.evaluate(n=>new Promise(r=>{let i=0;function tick(){if(++i>=n)r();else requestAnimationFrame(tick);}requestAnimationFrame(tick);}),n);
  const state=async()=>page.evaluate(()=>{const ss=SceneManager._scene._spriteset,canopy=ss._tilemap.children.find(s=>s._wwsGateCanopy),player=ss._characterSprites.find(s=>s._character===$gamePlayer);return {map:$gameMap.mapId(),x:$gamePlayer.x,y:$gamePlayer.y,realX:$gamePlayer._realX,realY:$gamePlayer._realY,direction:$gamePlayer.direction(),pattern:$gamePlayer.pattern(),moving:$gamePlayer.isMoving(),playerOpacity:player.opacity,playerVisible:player.visible,canopyOpacity:canopy?.opacity,legacyGhost:!!ss._tilemap.children.find(s=>s._wwsGateCue),viewport:[Graphics.width,Graphics.height],display:[$gameMap.displayX(),$gameMap.displayY()]};});
  const capture=async(name)=>{
   const frozen=await freezeFrame(page);
   const s=await state();assert.deepEqual(s.viewport,[1280,720]);assert.equal(s.playerOpacity,255);assert(s.playerVisible);assert.equal(s.legacyGhost,false);
   assert.equal(frozen.displayed.direction,s.direction);assert.equal(frozen.displayed.pattern,s.pattern);
   assert.deepEqual(frozen.displayed.screen,frozen.displayed.expectedScreen);
   fs.writeFileSync(path.join(out,name+'-source-frame-documentation.png'),Buffer.from(frozen.sourceFrame.split(',')[1],'base64'));
   delete frozen.sourceFrame;
   await page.screenshot({path:path.join(out,name+'.png')});result.captures.push({name,...s,...frozen,method:'Actual engine canvas, frozen after completed update/render; source-frame file is documentation'});
   await page.evaluate(()=>SceneManager.resume());return s;
  };
  const step=async d=>{await page.evaluate(d=>$gamePlayer.moveStraight(d),d);await page.waitForFunction(()=>!$gamePlayer.isMoving());};
  const route=async(x,y)=>{
   const p=await page.evaluate(([tx,ty])=>{const q=[[$gamePlayer.x,$gamePlayer.y,[]]],seen=new Set();for(let i=0;i<q.length;i++){const [x,y,p]=q[i];if(x===tx&&y===ty)return p;for(const d of [2,4,6,8]){const nx=$gameMap.roundXWithDirection(x,d),ny=$gameMap.roundYWithDirection(y,d),k=nx+','+ny;if(!seen.has(k)&&$gamePlayer.canPass(x,y,d)){seen.add(k);q.push([nx,ny,p.concat(d)]);}}}throw Error('No route to '+tx+','+ty);},[x,y]);
   for(const d of p)await step(d);result.walking.push({target:[x,y],steps:p.length,method:'Engine moveStraight on canPass route, speed4'});
  };
  const contact=async(name,x,y,d,allowed)=>{
   await route(x,y);const before=await state();const can=await page.evaluate(d=>$gamePlayer.canPass($gamePlayer.x,$gamePlayer.y,d),d);assert.equal(can,allowed,name);
   await step(d);const after=await state();if(!allowed)assert.deepEqual([after.x,after.y],[before.x,before.y],name+' actual movement blocked');
   result.contacts.push({name,from:[x,y],direction:d,allowed,after:[after.x,after.y]});
  };
  const awaitMap=async id=>{await page.waitForFunction(id=>$gameMap.mapId()===id&&!$gamePlayer.isTransferring(),id);await ready();};
  const leaveCourtyard=async()=>{await route(12,12);await step(2);await awaitMap(3);const s=await state();assert.deepEqual([s.x,s.y,s.direction],[38,3,4]);result.transfers.push({event:[1,10],arrival:[3,s.x,s.y,s.direction]});};
  await ready();await frames();console.log('Courtyard ready');
  if(process.env.EDO_SYNC_ONLY){
   await leaveCourtyard();
   for(const [name,x] of [['home foundation',6],['home-tea fence',12],['tea-shop foundation',16],['merchant foundation',26],['dojo wall',34]]){
    await contact(name,x,x===34?3:4,8,false);await capture(name.replaceAll(' ','-')+'-contact-native');
   }
   await contact('drainage edge',16,11,2,false);await capture('drainage-contact-native');
   fs.writeFileSync(path.join(out,'engine-checks.json'),JSON.stringify(result,null,2)+'\n');return;
  }
  await route(12,11);await frames();await capture('courtyard-gate-approach-native');
  await page.evaluate(()=>$gamePlayer.moveStraight(2));
  await page.waitForFunction(()=>$gamePlayer._realY>11.3&&$gamePlayer._realY<11.8,{},{polling:'raf'});
  const half=await capture('courtyard-gate-half-step-native');assert(half.moving);assert(half.canopyOpacity<=80);
  await page.waitForFunction(()=>!$gamePlayer.isMoving());await leaveCourtyard();await frames();await capture('street-arrival-native');
  for(const x of [38,39]){
   await route(x,3);await step(8);await awaitMap(1);
   const s=await state();assert.deepEqual([s.x,s.y,s.direction],[12,12,8]);assert.equal(s.canopyOpacity,48);assert.equal(s.playerOpacity,255);assert.equal(s.legacyGhost,false);
   result.transfers.push({event:[3,x===38?1:2],arrival:[1,s.x,s.y,s.direction]});
   await frames();await capture('courtyard-arrival-'+x+'-native');
   if(x===38){
    await contact('left jamb from opening',12,12,4,false);await contact('right jamb from opening',12,12,6,false);await capture('courtyard-jamb-contact-native');
    await contact('left jamb from yard',11,11,2,false);await contact('right jamb from yard',13,11,2,false);
    await route(12,10);await frames(12);const restored=await capture('courtyard-canopy-restored-native');assert.equal(restored.canopyOpacity,255);
   }
   await leaveCourtyard();
  }
  console.log('Gate movements passed');
  await contact('clear forecourt west',34,3,4,true);
  await contact('dojo return',32,3,4,false);await capture('dojo-return-contact-native');
  await contact('dojo wall',34,3,8,false);await capture('dojo-wall-contact-native');
  await contact('east boundary',40,7,6,false);await capture('street-east-contact-native');
  await route(38,7);
  // Sustained real key input demonstrates horizontal scrolling and the west
  // closure. Mid-walk frames preserve the actual walk pattern and camera.
  await page.keyboard.down('ArrowLeft');
  await page.waitForFunction(()=>$gamePlayer._realX<26&&$gamePlayer._realX>24,{},{polling:'raf'});await capture('street-middle-walking-native');
  await page.waitForFunction(()=>$gamePlayer._realX<13&&$gamePlayer._realX>11,{},{polling:'raf'});await capture('street-west-walking-native');
  await page.waitForFunction(()=>$gamePlayer.x===1&&!$gamePlayer.isMoving());await page.keyboard.up('ArrowLeft');
  result.walking.push({from:[38,7],to:[1,7],method:'Continuous ArrowLeft keyboard input, normal speed, stopped by visible west barrier'});
  await frames();await capture('street-west-contact-native');
  for(const [name,x] of [['home foundation',6],['home-tea fence',12],['tea-shop foundation',16],['merchant foundation',26]]){
   await contact(name,x,4,8,false);await capture(name.replaceAll(' ','-')+'-contact-native');
  }
  await contact('walkable north apron',16,5,8,true);
  await contact('drainage edge',16,11,2,false);await capture('drainage-contact-native');
  result.reachability=await page.evaluate(()=>{const q=[[38,3]],seen=new Set(['38,3']);for(let i=0;i<q.length;i++)for(const d of [2,4,6,8]){const [x,y]=q[i],nx=$gameMap.roundXWithDirection(x,d),ny=$gameMap.roundYWithDirection(y,d),k=nx+','+ny;if(!seen.has(k)&&$gamePlayer.canPass(x,y,d)){seen.add(k);q.push([nx,ny]);}}return seen.size;});
  assert.equal(result.reachability,331);assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  result.errors=errors;result.failedRequests=failed;
  fs.writeFileSync(path.join(out,'engine-checks.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({contacts:result.contacts.length,transfers:result.transfers.length,frames:result.captures.length,reachable:result.reachability,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
