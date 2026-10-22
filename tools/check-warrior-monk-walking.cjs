const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/anjan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/art/warrior-monks/overworld');
const reloadOnly=process.argv.includes('--reload-only');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const before=read('docs/art/warrior-monks/overworld/Map001-before.json'),map=read('data/Map001.json');
const monks=map.events.filter(e=>e&&e.note.startsWith('wws:warrior-monk-'));
assert.equal(monks.length,2);
const stripped=structuredClone(map);stripped.events=stripped.events.slice(0,before.events.length);
assert.deepEqual(stripped,before,'Existing geometry and all earlier events preserved');
const beforeSystem=read('docs/art/warrior-monks/overworld/System-before.json'),system=read('data/System.json');
assert.equal(system.versionId,beforeSystem.versionId+1);
assert.deepEqual({...system,versionId:null},{...beforeSystem,versionId:null});
const exportRecords=read('docs/art/warrior-monks/overworld/walking-export.json');
for(const record of exportRecords){
 assert.equal(record.frames.length,12);assert.equal(record.frames[1].bodyHeightPixels,67);
 for(const f of record.frames) assert(f.bodyHeightPixels>=63&&f.bodyHeightPixels<=72);
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
  await page.goto('http://127.0.0.1:8166/');
  await page.waitForFunction(()=>window.SceneManager&&SceneManager._scene instanceof Scene_Title);
  await page.evaluate(()=>{DataManager.setupNewGame();SceneManager.goto(Scene_Map)});
  async function ready(){await page.waitForFunction(()=>!SceneManager.isSceneChanging()&&SceneManager._scene instanceof Scene_Map&&SceneManager._scene.isReady()&&SceneManager._scene._fadeDuration===0&&SceneManager._scene._spriteset._characterSprites.every(s=>!s.bitmap||s.bitmap.isReady()));}
  await ready();await page.evaluate(()=>SceneManager._scene._mapNameWindow.close());
  await page.screenshot({path:path.join(out,'initial-in-game.png')});
  const report=await page.evaluate(()=>{
   const events=$gameMap.events().filter(e=>e.event().note.startsWith('wws:warrior-monk-'));
   const sprites=SceneManager._scene._spriteset._characterSprites.filter(s=>events.includes(s._character));
   const q=[[$gamePlayer.x,$gamePlayer.y]],seen=new Set([q[0].join(',')]);
   for(let i=0;i<q.length;i++) for(const d of [2,4,6,8]){const [x,y]=q[i],nx=$gameMap.roundXWithDirection(x,d),ny=$gameMap.roundYWithDirection(y,d);if(!seen.has(nx+','+ny)&&$gamePlayer.canPass(x,y,d)){seen.add(nx+','+ny);q.push([nx,ny]);}}
   return {sprites:sprites.map(s=>({name:s._character.characterName(),position:[s._character.x,s._character.y],frame:[s.patternWidth(),s.patternHeight()],scale:[s.scale.x,s.scale.y],anchor:[s.anchor.x,s.anchor.y]})),reachable:[...seen]};
  });
  assert.equal(report.sprites.length,2);
  for(const s of report.sprites){assert.deepEqual(s.frame,[64,112]);assert.deepEqual(s.scale,[1,1]);assert.deepEqual(s.anchor,[.5,1]);const [x,y]=s.position;assert(report.reachable.includes(`${x},${y+1}`));assert(!report.reachable.includes(`${x},${y}`));}
  // Physical keyboard navigation to the space directly in front of each monk.
  for(const target of (reloadOnly?[]:[[8,10],[10,10]])){
   const route=await page.evaluate(([tx,ty])=>{const q=[[$gamePlayer.x,$gamePlayer.y,[]]],seen=new Set;for(let i=0;i<q.length;i++){const [x,y,p]=q[i];if(x===tx&&y===ty)return p;for(const d of [2,4,6,8]){const nx=$gameMap.roundXWithDirection(x,d),ny=$gameMap.roundYWithDirection(y,d);if(!seen.has(nx+','+ny)&&$gamePlayer.canPass(x,y,d)){seen.add(nx+','+ny);q.push([nx,ny,p.concat([[nx,ny,d]])]);}}}throw Error('No route')},target);
   for(const [x,y,d] of route){
    const key={2:'ArrowDown',4:'ArrowLeft',6:'ArrowRight',8:'ArrowUp'}[d];
    await page.waitForFunction(()=>$gamePlayer.canMove()&&!$gamePlayer.isMoving());
    const frame=await page.evaluate(()=>Graphics.frameCount);
    await page.keyboard.down(key);
    try{await page.waitForFunction(f=>Graphics.frameCount>f+2,frame);}finally{await page.keyboard.up(key);}
    await page.waitForFunction(()=>!$gamePlayer.isMoving());
    const actual=await page.evaluate(()=>[$gamePlayer.x,$gamePlayer.y]);
    if(actual[0]!==x||actual[1]!==y){await page.screenshot({path:path.join(out,'route-diagnostic.png')});throw Error(`Keyboard step expected ${x},${y}, got ${actual}`);}
   }
  }
  // Review frames explicitly; these diagnostic facing changes are not movement.
  for(const d of [2,4,6,8])for(const pattern of [0,1,2]){
   if(reloadOnly){assert(fs.existsSync(path.join(out,`frame-${d}-${pattern}.png`)));continue;}
   await page.evaluate(({d,pattern})=>{for(const e of $gameMap.events().filter(e=>e.event().note.startsWith('wws:warrior-monk-'))){e.setDirection(d);e._pattern=pattern;e._animationCount=0;}},{d,pattern});
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   await page.screenshot({path:path.join(out,`frame-${d}-${pattern}.png`),clip:{x:360,y:340,width:260,height:150}});
  }
  // Simulate a pre-update loaded map and use MZ's standard version reload.
  await page.evaluate(oldVersion=>{
   $gameSystem._versionId=oldVersion;
   for(const e of $gameMap.events().filter(e=>e.event().note.startsWith('wws:warrior-monk-')))delete $gameMap._events[e.eventId()];
   Scene_Load.prototype.reloadMapIfUpdated.call({});SceneManager.goto(Scene_Map);
  },beforeSystem.versionId);
  await ready();
  assert.equal(await page.evaluate(()=>$gameMap.events().filter(e=>e.event().note.startsWith('wws:warrior-monk-')).length),2);
  await page.evaluate(()=>{$gamePlayer.locate(12,11);$gamePlayer.setDirection(8);SceneManager._scene._mapNameWindow.close();});
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await page.screenshot({path:path.join(out,'courtyard-in-game.png')});
  assert.deepEqual(errors,[]);
  report.errors=errors;report.keyboardApproaches=reloadOnly?'both passed in preceding full run before reload assertion':'both passed';report.legacyMapReload='passed';report.directionFrameViews=12;
  fs.writeFileSync(path.join(out,'browser-check.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({...report,reachable:report.reachable.length}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
