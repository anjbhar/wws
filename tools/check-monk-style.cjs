const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const {chromium}=require('C:/Users/anjan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),relative='docs/art/warrior-monks/style-v2',out=path.join(root,relative);
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const before=read(relative+'/backup/Map001.json'),map=read('data/Map001.json');
for(const e of before.events)if(e&&e.note.startsWith('wws:warrior-monk-'))for(const p of e.pages)p.image.characterName=p.image.characterName.replace('-v1','-v2');
assert.deepEqual(map,before,'Only monk graphic names change; terrain, event behavior, positions preserved');
const oldSystem=read(relative+'/backup/System.json'),system=read('data/System.json');
assert.equal(system.versionId,oldSystem.versionId+1);
assert.deepEqual({...system,versionId:null},{...oldSystem,versionId:null});
const aliases=vm.createContext({ImageManager:{loadCharacter:n=>n}});
vm.runInContext(fs.readFileSync(path.join(root,'js/plugins/WWS_OverworldCharacters.js'),'utf8'),aliases);
for(const v of ['Masked','Unmasked'])assert.equal(aliases.ImageManager.loadCharacter(`$WarriorMonk-${v}-v1`),`$WarriorMonk-${v}-v2`);
const exported=read(relative+'/walking/walking-export.json');
for(const record of exported){assert.equal(record.frames.length,12);for(const f of record.frames){assert(f.bodyHeightPixels>=63&&f.bodyHeightPixels<=72);if(f.column===1)assert.equal(f.bodyHeightPixels,67);}}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
  await page.goto('http://127.0.0.1:8166/');
  await page.waitForFunction(()=>window.SceneManager&&SceneManager._scene instanceof Scene_Title);
  await page.evaluate(()=>{DataManager.setupNewGame();SceneManager.goto(Scene_Map)});
  async function ready(){await page.waitForFunction(()=>!SceneManager.isSceneChanging()&&SceneManager._scene instanceof Scene_Map&&SceneManager._scene.isReady()&&SceneManager._scene._fadeDuration===0&&SceneManager._scene._spriteset._characterSprites.every(s=>!s.bitmap||s.bitmap.isReady()),null,{timeout:30000});}
  await ready();
  await page.evaluate(()=>{$gamePlayer.locate(12,11);$gamePlayer.setDirection(8);SceneManager._scene._mapNameWindow.close();});
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await page.screenshot({path:path.join(out,'courtyard-in-game.png')});
  const frames=[];
  for(const direction of [2,4,6,8])for(const pattern of [0,1,2]){
   await page.evaluate(({direction,pattern})=>{for(const e of $gameMap.events().filter(e=>e.event().note.startsWith('wws:warrior-monk-'))){e.setDirection(direction);e._pattern=pattern;e._animationCount=0;}},{direction,pattern});
   await page.waitForFunction(({direction,pattern})=>SceneManager._scene._spriteset._characterSprites.filter(s=>s._character.event?.()?.note?.startsWith('wws:warrior-monk-')).every(s=>s._frame.x===pattern*64&&s._frame.y===(direction-2)/2*112),{direction,pattern},{timeout:5000});
   await page.screenshot({path:path.join(out,`walking/frame-${direction}-${pattern}.png`),clip:{x:360,y:340,width:260,height:150}});
   frames.push([direction,pattern]);
  }
  await page.evaluate(oldVersion=>{$gameSystem._versionId=oldVersion;for(const e of $gameMap.events().filter(e=>e.event().note.startsWith('wws:warrior-monk-')))e.setImage(e.characterName().replace('-v2','-v1'),0);Scene_Load.prototype.reloadMapIfUpdated.call({});SceneManager.goto(Scene_Map);},oldSystem.versionId);
  await ready();
  const sprites=await page.evaluate(()=>SceneManager._scene._spriteset._characterSprites.filter(s=>s._character.event?.()?.note?.startsWith('wws:warrior-monk-')).map(s=>({name:s._character.characterName(),frame:[s.patternWidth(),s.patternHeight()],scale:[s.scale.x,s.scale.y],position:[s._character.x,s._character.y]})));
  assert.equal(sprites.length,2);
  for(const s of sprites){assert(s.name.endsWith('-v2'));assert.deepEqual(s.frame,[64,112]);assert.deepEqual(s.scale,[1,1]);}
  assert.deepEqual(sprites.map(s=>s.position),[[8,9],[10,9]]);assert.deepEqual(errors,[]);
  const report={sprites,frames:frames.length,legacyMapReload:'passed',oldBitmapAliases:'passed',errors};
  fs.writeFileSync(path.join(out,'browser-check.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
