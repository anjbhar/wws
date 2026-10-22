const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const {chromium}=require('C:/Users/anjan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/art/overworld-larger-v1');
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const replacements={'$Samurai-v2':'$Samurai-v3','$SamuraiInstructor-v2':'$SamuraiInstructor-v3','$Shinsengumi-v1':'$Shinsengumi-v2'};
const before=read('docs/art/overworld-larger-v1/backup/Map001.json'),map=read('data/Map001.json');
for(const e of before.events) if(e) for(const p of e.pages) p.image.characterName=replacements[p.image.characterName]||p.image.characterName;
assert.deepEqual(map,before,'Only event graphic names may change');
const actors=read('docs/art/overworld-larger-v1/backup/Actors.json');
for(const a of actors) if(a) a.characterName=replacements[a.characterName]||a.characterName;
assert.deepEqual(read('data/Actors.json'),actors,'Only actor graphic names may change');
const context=vm.createContext({ImageManager:{loadCharacter:name=>name}});
vm.runInContext(fs.readFileSync(path.join(root,'js/plugins/WWS_OverworldCharacters.js'),'utf8'),context);
for(const [old,name] of Object.entries(replacements)) assert.equal(context.ImageManager.loadCharacter(old),name);
assert.equal(context.ImageManager.loadCharacter('Actor1'),'Actor1');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader']});
 try {
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400) errors.push(`${r.status()} ${r.url()}`)});
  await page.goto('http://127.0.0.1:8166/');
  await page.waitForFunction(()=>window.SceneManager&&SceneManager._scene instanceof Scene_Title);
  await page.evaluate(()=>{DataManager.setupNewGame();SceneManager.goto(Scene_Map)});
  await page.waitForFunction(()=>SceneManager._scene instanceof Scene_Map&&SceneManager._scene.isReady()&&SceneManager._scene._fadeDuration===0&&SceneManager._scene._spriteset._characterSprites.every(s=>!s.bitmap||s.bitmap.isReady()));
  await page.evaluate(()=>SceneManager._scene._mapNameWindow.close());
  await page.screenshot({path:path.join(out,'courtyard-in-game.png')});
  const original=await page.evaluate(()=>[$gamePlayer.x,$gamePlayer.y]);
  for(const key of ['ArrowRight','ArrowDown','ArrowLeft','ArrowUp']) {
   const start=await page.evaluate(()=>[$gamePlayer.x,$gamePlayer.y]);
   await page.keyboard.down(key);
   await page.waitForFunction(([x,y])=>$gamePlayer.x!==x||$gamePlayer.y!==y,start);
   await page.keyboard.up(key);
   await page.waitForFunction(()=>!$gamePlayer.isMoving());
  }
  assert.deepEqual(await page.evaluate(()=>[$gamePlayer.x,$gamePlayer.y]),original);
  for(const direction of [2,4,6,8]) for(const pattern of [0,1,2]) {
   await page.evaluate(({direction,pattern})=>{
    for(const c of [$gamePlayer,...$gameMap.events().filter(e=>e.characterName())]) {c.setDirection(direction);c._pattern=pattern;c._animationCount=0;}
   },{direction,pattern});
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   await page.screenshot({path:path.join(out,`frames-${direction}-${pattern}.png`)});
  }
  const result=await page.evaluate(async()=>{
   const oldNames=['$Samurai-v2','$SamuraiInstructor-v2','$Shinsengumi-v1'];
   const legacy=oldNames.map(n=>ImageManager.loadCharacter(n));
   await Promise.all(legacy.map(b=>new Promise(r=>b.addLoadListener(r))));
   const sprites=SceneManager._scene._spriteset._characterSprites.filter(s=>['$Samurai-v3','$SamuraiInstructor-v3','$Shinsengumi-v2'].includes(s._character.characterName()));
   return {legacySizes:legacy.map(b=>[b.width,b.height]),sprites:sprites.map(s=>({name:s._character.characterName(),frame:[s.patternWidth(),s.patternHeight()],scale:[s.scale.x,s.scale.y],anchor:[s.anchor.x,s.anchor.y]}))};
  });
  for(const size of result.legacySizes) assert.deepEqual(size,[192,352]);
  for(const s of result.sprites){assert.deepEqual(s.frame,[64,88]);assert.deepEqual(s.scale,[1,1]);assert.deepEqual(s.anchor,[.5,1]);}
  await page.evaluate(()=>{$gamePlayer.locate(12,5);$gamePlayer.setDirection(8);$gamePlayer._pattern=1});
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await page.screenshot({path:path.join(out,'doorway-in-game.png')});
  assert.deepEqual(errors,[]);result.errors=errors;result.keyboardMovement='four-direction loop passed';
  fs.writeFileSync(path.join(out,'browser-check.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result));
 } finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
