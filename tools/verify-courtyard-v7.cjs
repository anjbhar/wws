// Actual MZ rendering + physical keyboard routes. Static regression commands are
// separately recorded in courtyard-v7-checks/regressions.txt.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const pkg=process.env.NODE_PATH||'C:/Users/anjan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {chromium}=require(path.join(pkg,'playwright'));
const R=path.resolve(__dirname,'..'),O=path.join(R,'docs/maps/courtyard-v7-checks');fs.mkdirSync(O,{recursive:true});
const read=p=>JSON.parse(fs.readFileSync(path.join(R,p)));
const m=read('data/Map001.json'),old=read('docs/maps/backups/before-courtyard-v7/data/Map001.json');
for(const tag of ['wws:samurai-sparring','wws:shinsengumi-npc'])assert.deepEqual(m.events.find(e=>e&&e.note===tag),old.events.find(e=>e&&e.note===tag));
for(const p of ['img/tilesets/EdoRedWoodExterior_D-v4.png',...fs.readdirSync(path.join(R,'img/characters')).filter(n=>n.endsWith('.png')).map(n=>'img/characters/'+n)]){
 const b=path.join(R,'docs/maps/backups/before-courtyard-v7',p.replace('img/',''));
 assert(fs.readFileSync(path.join(R,p)).equals(fs.readFileSync(b)),p+' unchanged');
}
for(const n of read('data/Tilesets.json')[m.tilesetId].tilesetNames.filter(Boolean))assert(n.startsWith('Edo')&&fs.existsSync(path.join(R,'img/tilesets',n+'.png')));
for(const e of m.events.filter(Boolean))for(const p of e.pages)for(const c of p.list)if(c.code===201)assert(fs.existsSync(path.join(R,'data/Map'+String(c.parameters[1]).padStart(3,'0')+'.json')));
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--disable-background-timer-throttling','--disable-renderer-backgrounding']});const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.env.WWS_URL||'http://127.0.0.1:8166/');
 await page.waitForFunction(()=>window.SceneManager&&SceneManager._scene instanceof Scene_Title);
 await page.evaluate(()=>{DataManager.setupNewGame();SceneManager.goto(Scene_Map)});
 await page.waitForFunction(()=>SceneManager._scene instanceof Scene_Map&&SceneManager._scene.isReady()&&SceneManager._scene._fadeDuration===0&&SceneManager._scene._spriteset._tilemap._bitmaps.every(b=>!b||b.isReady()));
 await page.evaluate(()=>SceneManager._scene._mapNameWindow.close());
 async function settle(){const f=await page.evaluate(()=>Graphics.frameCount);await page.waitForFunction(f=>{const s=SceneManager._scene._spriteset?._characterSprites?.find(s=>s._character===$gamePlayer);return Graphics.frameCount>f+2&&$gamePlayer.canMove()&&!$gamePlayer.isMoving()&&s&&s.x===$gamePlayer.screenX()&&s.y===$gamePlayer.screenY()},f);}
 async function tap(key){
  const f=await page.evaluate(()=>Graphics.frameCount);await page.keyboard.down(key);
  try {await page.waitForFunction(f=>Graphics.frameCount>f+2,f);}finally{await page.keyboard.up(key);}
  await page.waitForFunction(f=>Graphics.frameCount>f+4,f);
 }
 await settle();await page.screenshot({path:path.join(R,'docs/maps/courtyard-in-game.png')});
 const result={initial:await page.evaluate(()=>({position:[$gamePlayer.x,$gamePlayer.y],facing:$gamePlayer.direction(),viewport:[Graphics.width,Graphics.height]})),routes:[],views:[],interactions:[]};
 assert.deepEqual(result.initial,{position:[12,11],facing:8,viewport:[1280,720]});
 const graph=await page.evaluate(()=>{const queue=[[$gamePlayer.x,$gamePlayer.y]],seen=new Set([queue[0].join(',')]);for(let i=0;i<queue.length;i++)for(const d of [2,4,6,8]){const [x,y]=queue[i],nx=$gameMap.roundXWithDirection(x,d),ny=$gameMap.roundYWithDirection(y,d);if(!seen.has(nx+','+ny)&&$gamePlayer.canPass(x,y,d)){seen.add(nx+','+ny);queue.push([nx,ny])}}return [...seen]});
 result.reachable=graph.length;assert(graph.length>180);fs.writeFileSync(path.join(O,'reachable.json'),JSON.stringify(graph));
 async function walk(x,y){assert(graph.includes(x+','+y),'Reachable review target '+[x,y]);
 const route=await page.evaluate(([tx,ty])=>{const q=[[$gamePlayer.x,$gamePlayer.y,[]]],seen=new Set;for(let i=0;i<q.length;i++){const [x,y,p]=q[i];if(x===tx&&y===ty)return p;for(const d of [2,4,6,8]){const nx=$gameMap.roundXWithDirection(x,d),ny=$gameMap.roundYWithDirection(y,d);if(!seen.has(nx+','+ny)&&$gamePlayer.canPass(x,y,d)){seen.add(nx+','+ny);q.push([nx,ny,p.concat([[nx,ny,d]])])}}}throw Error('No route')},[x,y]);
 for(const [nx,ny,d]of route){const key={2:'ArrowDown',4:'ArrowLeft',6:'ArrowRight',8:'ArrowUp'}[d];
  for(let attempt=0;attempt<3;attempt++){
   await settle();await tap(key);await settle();
   if(await page.evaluate(([x,y])=>$gamePlayer.x===x&&$gamePlayer.y===y,[nx,ny]))break;
  }
  const pos=await page.evaluate(()=>[$gamePlayer.x,$gamePlayer.y]);
  if(pos[0]!==nx||pos[1]!==ny){await page.screenshot({path:path.join(O,'route-failure.png')});throw Error('Input step expected '+[nx,ny]+' got '+pos+' towards '+[x,y]);}
 }
 result.routes.push({to:[x,y],steps:route.length,input:'physical browser keyboard'});
 }
 async function face(d){const key={2:'ArrowDown',4:'ArrowLeft',6:'ArrowRight',8:'ArrowUp'}[d];
 // Direction only is a review camera operation, recorded separately from routes.
 await page.evaluate(d=>$gamePlayer.setDirection(d),d);await settle();}
 async function capture(name,x,y,d){console.log('Walking capture',name,x,y);await walk(x,y);await face(d);await page.screenshot({path:path.join(O,name+'.png')});result.views.push({name,position:[x,y],reachable:true,inputRoute:true});fs.writeFileSync(path.join(O,'progress.json'),JSON.stringify(result,null,2));}
 async function interact(name,x,y,d){console.log('Walking interaction',name,x,y);await walk(x,y);await face(d);await tap('Enter');await page.waitForFunction(()=>$gameMessage.isBusy());
 result.interactions.push({name,text:await page.evaluate(()=>$gameMessage.allText())});
 await page.waitForFunction(()=>SceneManager._scene._messageWindow.pause||SceneManager._scene._choiceListWindow.active);await page.screenshot({path:path.join(O,name+'.png')});
 for(let i=0;i<20;i++){
  if(await page.evaluate(()=>!$gameMessage.isBusy()&&!$gameMap.isEventRunning()))break;
  await page.waitForFunction(()=>!$gameMessage.isBusy()&&!$gameMap.isEventRunning()||SceneManager._scene._messageWindow.pause||SceneManager._scene._choiceListWindow.active);
  if(await page.evaluate(()=>!$gameMessage.isBusy()&&!$gameMap.isEventRunning()))break;
  if(await page.evaluate(()=>SceneManager._scene._choiceListWindow.active)){
   if(await page.evaluate(()=>SceneManager._scene._choiceListWindow.index()!==1))await tap('ArrowDown');
   await tap('Enter');
  } else {await tap('Enter');}
  await page.evaluate(()=>new Promise(resolve=>{const f=Graphics.frameCount;function tick(){if(Graphics.frameCount>f+12)resolve();else requestAnimationFrame(tick)}tick()}));
 }
 await page.waitForFunction(()=>!$gameMessage.isBusy()&&!$gameMap.isEventRunning());await settle();
 }
 await interact('masanori-action',12,10,8);await interact('shinsengumi-action',16,11,8);
 await interact('closed-dojo',12,4,8);await capture('veranda-center',12,4,8);await capture('veranda-west',10,4,8);await capture('veranda-east',14,4,8);
 const views={
  'dojo-below':[12,5,8],'dojo-west':[8,3,6],'dojo-east':[16,3,4],
  'rack-above':[2,6,2],'rack-below':[2,8,8],'rack-west':[1,7,6],'rack-east':[4,7,4],
  'dummy-above':[2,9,2],'dummy-below':[2,11,8],'dummy-west':[1,10,6],'dummy-east':[3,10,4],
  'lantern-above':[22,7,2],'lantern-below':[22,9,8],'lantern-west':[21,8,6],'lantern-east':[23,8,4],
  'basin-above':[22,9,2],'basin-below':[22,11,8],'basin-west':[21,10,6],'basin-east':[23,10,4],
  'bamboo-west-above':[2,4,2],'bamboo-west-below':[2,6,8],'bamboo-west-west':[1,5,6],'bamboo-west-east':[4,5,4],
  'bamboo-east-above':[22,5,2],'bamboo-east-below':[22,7,8],'bamboo-east-west':[20,6,6],'bamboo-east-east':[23,6,4],
  'northwest-inside':[1,3,4],'northeast-inside':[23,3,6],'southwest-inside':[1,11,2],'southeast-inside':[23,11,2],
  'gate-north':[12,11,2],'gate-under':[12,12,2],'gate-south':[12,13,8],'gate-west':[11,13,6],'gate-east':[13,13,4],
  'west-roof':[1,8,4],'east-roof':[23,9,6]
 };
 for(const [name,[x,y,d]]of Object.entries(views))await capture(name,x,y,d);
 await interact('southern-boundary',12,13,2);
 // Loading old geometry: retain reachable old positions; recover out-of-range
 // positions to the closest connected cell. Saved files are never overwritten.
 result.compatibility=[];
 for(const p of [[12,12],[12,18],[0,18],[12,3]]){
  await page.evaluate(p=>{const contents=DataManager.makeSaveContents();delete contents.system._wwsCourtyardRevision;contents.player.locate(...p);DataManager.extractSaveContents(contents);SceneManager.goto(Scene_Map)},p);
  await page.waitForFunction(()=>SceneManager._scene instanceof Scene_Map&&SceneManager._scene.isReady()&&!$gamePlayer._wwsCourtyardNeedsReload&&$gameSystem._wwsCourtyardRevision===7);
  await settle();const c=await page.evaluate(()=>$gamePlayer._wwsCourtyardRecovery);assert(graph.includes(c.to.join(',')));result.compatibility.push(c);
 }
 // Decode the actual local save without modifying or publishing its contents.
 const save=path.join(R,'save/file0.rmmzsave');if(fs.existsSync(save)){
  result.localSave=await page.evaluate(async zip=>{const json=await StorageManager.zipToJson(zip),o=JsonEx.parse(json);return {mapId:o.map.mapId(),position:[o.player.x,o.player.y],mapHeight:o.map.height(),revision:o.system._wwsCourtyardRevision||null}},fs.readFileSync(save,'utf8'));
 }
 result.diagnostics={inaccessible:['North exterior/rear-wall cells; exterior of side walls; south wall outside gate. No teleported playable evidence.'],sorting:'Human inspection of actual engine contact sheets is required.'};
 result.errors=errors;assert.deepEqual(errors,[]);fs.writeFileSync(path.join(O,'results.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify({reachable:graph.length,walkedSteps:result.routes.reduce((s,r)=>s+r.steps,0),views:result.views.length,interactions:result.interactions,compatibility:result.compatibility,localSave:result.localSave,errors}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
