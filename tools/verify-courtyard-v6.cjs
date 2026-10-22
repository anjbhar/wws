const path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/anjan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const R=path.resolve(__dirname,'..'),out=path.join(R,'docs/maps/courtyard-v6-checks');fs.mkdirSync(out,{recursive:true});
const read=n=>JSON.parse(fs.readFileSync(path.join(R,'data',n+'.json')));
const map=read('Map001'),before=JSON.parse(fs.readFileSync(path.join(R,'docs/maps/backups/before-courtyard-v6/Map001.json')));
for(const tag of ['wws:samurai-sparring','wws:shinsengumi-npc'])assert.deepEqual(map.events.find(e=>e&&e.note===tag),before.events.find(e=>e&&e.note===tag),'Complete preserved event '+tag);
for(const e of map.events.filter(Boolean))for(const p of e.pages)for(const c of p.list)if(c.code===201){const f=path.join(R,'data/Map'+String(c.parameters[1]).padStart(3,'0')+'.json');assert(fs.existsSync(f),'Transfer target exists');}
for(const n of read('Tilesets')[map.tilesetId].tilesetNames.filter(Boolean))assert(n.startsWith('Edo')&&fs.existsSync(path.join(R,'img/tilesets',n+'.png')));
for(let y=0;y<4;y++)for(let x=0;x<6;x++)assert.equal(map.data[(2*map.height+y)*map.width+9+x],512+(y+1)*8+x);
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8166/');
 await page.waitForFunction(()=>window.SceneManager&&SceneManager._scene instanceof Scene_Title);
 await page.evaluate(()=>{DataManager.setupNewGame();SceneManager.goto(Scene_Map)});
 await page.waitForFunction(()=>SceneManager._scene instanceof Scene_Map&&SceneManager._scene.isReady());
 await page.waitForFunction(()=>SceneManager._scene._fadeDuration===0,{timeout:30000});
 // Let the map name fade before recording the genuine starting camera.
 await page.evaluate(()=>SceneManager._scene._mapNameWindow.close());await page.waitForTimeout(300);
 await page.screenshot({path:path.join(R,'docs/maps/courtyard-in-game.png')});
 const result=await page.evaluate(()=>{
  const initial={position:[$gamePlayer.x,$gamePlayer.y],facing:$gamePlayer.direction(),camera:[$gameMap.displayX(),$gameMap.displayY()],viewport:[Graphics.width,Graphics.height],loaded:SceneManager._scene._spriteset._tilemap._bitmaps.every(b=>!b||b.isReady())};
  const origin=[$gamePlayer.x,$gamePlayer.y],queue=[origin],seen=new Set([origin.join(',')]);
  for(let i=0;i<queue.length;i++)for(const d of [2,4,6,8]){
   const [x,y]=queue[i];$gamePlayer.locate(x,y);
   const nx=$gameMap.roundXWithDirection(x,d),ny=$gameMap.roundYWithDirection(y,d),key=nx+','+ny;
   if(!seen.has(key)&&$gamePlayer.canPass(x,y,d)){seen.add(key);queue.push([nx,ny]);}
  }
  $gamePlayer.locate(...origin);
  const checks={};for(const p of [[11,4],[12,4],[12,8],[12,10],[16,11],[12,13],[11,13],[4,7],[2,10],[22,9],[20,8],[2,6],[4,5],[5,5],[2,4],[3,4],[21,5],[22,5]])checks[p.join(',')]=seen.has(p.join(','));
  const bases={};for(const p of [[4,6],[5,6],[2,9],[22,8],[20,7],[2,5],[3,5],[21,6],[22,6],[10,14],[13,14],[0,7],[1,7],[23,7],[24,7]])bases[p.join(',')]=seen.has(p.join(','));
  return {initial,reachable:seen.size,checks,bases,events:$gameMap.events().map(e=>({id:e.eventId(),name:e.event().name,position:[e.x,e.y]}))};
 });
 assert.deepEqual(result.initial.position,[12,7]);assert.equal(result.initial.facing,8);assert.deepEqual(result.initial.viewport,[1280,720]);assert(result.initial.loaded);
 console.log(JSON.stringify(result));assert(result.reachable>=150,'Broad connected yard');for(const [p,v]of Object.entries(result.checks))assert(v,'Reachable '+p);for(const [p,v]of Object.entries(result.bases))assert(!v,'Solid visible base '+p);
 // Actual MZ screenshots from above/below/beside each tall assembly.
 const views={
  'veranda-foot':[11,4,8], 'dojo-below':[12,5,8], 'dojo-beside':[8,3,6],
  'rack-above':[4,5,2], 'rack-below':[4,7,8], 'rack-beside':[6,6,4],
  'dummy-above':[2,8,2], 'dummy-below':[2,10,8], 'dummy-beside':[3,9,4],
  'lantern-above':[20,6,2], 'lantern-below':[20,8,8], 'lantern-beside':[19,7,6],
  'bamboo-west-above':[2,4,2], 'bamboo-west-below':[2,6,8], 'bamboo-west-beside':[4,5,4],
  'bamboo-east-above':[22,5,2], 'bamboo-east-below':[22,7,8], 'bamboo-east-beside':[20,6,6],
  'gate-above':[12,11,2], 'gate-under':[12,12,2], 'gate-below':[12,13,8], 'gate-beside':[14,11,4],
  'west-roof':[2,7,4], 'east-roof':[22,9,6], 'basin-above':[22,7,2], 'basin-below':[22,9,8], 'basin-beside':[21,8,6]
 };
 for(const [name,[x,y,d]] of Object.entries(views)){
  await page.evaluate(([x,y,d])=>{$gamePlayer.locate(x,y);$gamePlayer.setDirection(d)},[x,y,d]);await page.waitForTimeout(100);
  await page.screenshot({path:path.join(out,name+'.png')});
 }
 // Trigger both closed sill and southern action interactions in-engine.
 result.interactions=[];
 for(const [name,x,y,d]of [['closed-dojo',11,4,8],['southern-boundary',12,13,2]]){
  await page.evaluate(([x,y,d])=>{$gamePlayer.locate(x,y);$gamePlayer.setDirection(d);$gamePlayer.checkEventTriggerThere([0]);$gameMap.setupStartingEvent()},[x,y,d]);
  await page.waitForTimeout(150);
  const text=await page.evaluate(()=>$gameMessage.allText());assert(text.length>0,name+' interaction');result.interactions.push({name,text});
  await page.screenshot({path:path.join(out,name+'.png')});
  await page.evaluate(()=>{$gameMessage.clear();$gameMap._interpreter.clear()});
 }
 result.errors=errors;assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
