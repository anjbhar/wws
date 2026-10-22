if(JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname,'../data/Map001.json'))).note.includes('wws:dojo-courtyard-v7')) { require('./verify-courtyard-v7.cjs'); return; }
if(JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname,'../data/Map001.json'))).note.includes('wws:dojo-courtyard-v6')) { require('./verify-courtyard-v6.cjs'); return; }
const path=require('node:path'),fs=require('node:fs');
const {chromium}=require('C:/Users/anjan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8166/');
 await page.waitForFunction(()=>window.SceneManager&&SceneManager._scene instanceof Scene_Title,{timeout:30000});
 await page.evaluate(()=>{DataManager.setupNewGame();SceneManager.goto(Scene_Map)});
 await page.waitForFunction(()=>SceneManager._scene instanceof Scene_Map&&SceneManager._scene.isReady());
 await page.waitForTimeout(1000);
 const result=await page.evaluate(()=>({map:$gameMap.mapId(),tilesets:$gameMap.tileset().tilesetNames,characters:$gameMap.events().map(e=>e.characterName()).filter(Boolean),spawn:[$gamePlayer.x,$gamePlayer.y],loaded:SceneManager._scene._spriteset._tilemap._bitmaps.every(b=>!b||b.isReady())}));
 await page.screenshot({path:path.join(__dirname,'../docs/maps/courtyard-in-game.png')});
 await page.evaluate(()=>{$gamePlayer.locate(11,4);$gameMap.setDisplayPos(0,0)});
 await page.waitForTimeout(300);
 await page.screenshot({path:path.join(__dirname,'../docs/maps/courtyard-dojo-layering.png')});
 await page.evaluate(()=>{$gamePlayer.locate(11,16);$gameMap.setDisplayPos(0,4)});
 await page.waitForTimeout(300);
 await page.screenshot({path:path.join(__dirname,'../docs/maps/courtyard-gate-layering.png')});
 result.errors=errors;fs.writeFileSync(path.join(__dirname,'../docs/maps/courtyard-browser-check.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify(result));await browser.close();if(errors.length||!result.loaded)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
