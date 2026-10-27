// Read-only map review. Writes evidence under docs/maps/starter-map-audit only.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const { chromium } = require('C:/Users/anjan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'docs/maps',process.env.WWS_JOINS_ONLY==='1'?'courtyard-v8-joins':'courtyard-v8-checks');
const assert = require('node:assert/strict');
const before = JSON.parse(fs.readFileSync(path.join(root,'docs/maps/backups/before-courtyard-v8/Map001.json')));
const beforeSets = JSON.parse(fs.readFileSync(path.join(root,'docs/maps/backups/before-courtyard-v8/Tilesets.json')));
const after = JSON.parse(fs.readFileSync(path.join(root,'data/Map001.json')));
assert.deepEqual({...after,data:null},{...before,data:null},'All map metadata/events unchanged');
assert(fs.readFileSync(path.join(root,'data/System.json')).equals(fs.readFileSync(path.join(root,'docs/maps/backups/before-courtyard-v8/System.json'))));
fs.mkdirSync(out, { recursive: true });
const types = {'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.woff':'font/woff','.ogg':'audio/ogg','.mp3':'audio/mpeg','.css':'text/css'};
const server = http.createServer((req,res) => {
    const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname === '/' ? '/index.html' : new URL(req.url,'http://localhost').pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (err, data) => { if(err) res.writeHead(404).end(); else {res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');res.end(data);} });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    console.log('Server ready',server.address().port);
    const browser = await chromium.launch({headless:true,args:['--use-angle=swiftshader']});
    console.log('Browser ready');
    try {
        const page = await browser.newPage({viewport:{width:1280,height:720}});
        const errors=[], failed=[];
        page.on('pageerror',e=>errors.push(String(e)));
        page.on('response',r=>{if(r.status()>=400)failed.push({url:r.url(),status:r.status()});});
        await page.goto(`http://127.0.0.1:${server.address().port}/`);
        console.log('Page loaded');
        await page.waitForFunction(()=>window.SceneManager && SceneManager._scene instanceof Scene_Title);
        console.log('Title ready');
        await page.evaluate(()=>{DataManager.setupNewGame();SceneManager.goto(Scene_Map);});
        await page.waitForFunction(()=>SceneManager._scene instanceof Scene_Map && SceneManager._scene.isReady() && SceneManager._scene._fadeDuration===0 && SceneManager._scene._spriteset._tilemap._bitmaps.every(b=>!b||b.isReady()));
        console.log('Map ready');
        await page.evaluate(()=>SceneManager._scene._mapNameWindow.close());
        const passage=await page.evaluate(([old,sets])=>{
            const snapshot=()=>{const a=[];for(let y=0;y<$gameMap.height();y++)for(let x=0;x<$gameMap.width();x++)for(const d of [2,4,6,8])a.push($gameMap.isPassable(x,y,d));return a;};
            const current=snapshot(),savedMap=$dataMap,savedSets=$dataTilesets,savedGameMap=$gameMap;
            $dataMap=old;$dataTilesets=sets;$gameMap=new Game_Map();$gameMap.setup(1);
            const previous=snapshot();$dataMap=savedMap;$dataTilesets=savedSets;$gameMap=savedGameMap;
            return {count:current.length,differences:current.flatMap((v,i)=>v===previous[i]?[]:[i])};
        },[before,beforeSets]);
        assert.deepEqual(passage.differences,[],'Directional collision preserved');
        await page.evaluate(()=>new Promise(resolve=>{let n=0;function tick(){if(++n>12)resolve();else requestAnimationFrame(tick);}tick();}));
        await page.screenshot({path:path.join(out,'initial.png')});
        if(process.env.WWS_INITIAL_ONLY==='1')return;
        const result = await page.evaluate(()=>{
            const q=[[$gamePlayer.x,$gamePlayer.y]], seen=new Set([q[0].join(',')]);
            for(let i=0;i<q.length;i++)for(const d of [2,4,6,8]){
                const [x,y]=q[i],nx=$gameMap.roundXWithDirection(x,d),ny=$gameMap.roundYWithDirection(y,d);
                if(!seen.has(nx+','+ny)&&$gamePlayer.canPass(x,y,d)){seen.add(nx+','+ny);q.push([nx,ny]);}
            }
            return {spawn:[$gamePlayer.x,$gamePlayer.y],facing:$gamePlayer.direction(),size:[$gameMap.width(),$gameMap.height()],viewport:[Graphics.width,Graphics.height],display:[$gameMap.displayX(),$gameMap.displayY()],reachable:[...seen],events:$gameMap.events().map(e=>({id:e.eventId(),name:e.event().name,x:e.x,y:e.y,trigger:e._trigger,priority:e._priorityType,approaches:[2,4,6,8].map(d=>{const x=e.x+(d===6?-1:d===4?1:0),y=e.y+(d===2?-1:d===8?1:0);return {x,y,facing:d,reachable:seen.has(x+','+y)};})}))};
        });
        result.passage=passage;result.eventsExact=true;result.diagnosticViews=[];
        const normalSpeed=await page.evaluate(()=>$gamePlayer.moveSpeed());
        for(const [name,x,y,d] of [['door-left',11,4,8],['door-right',12,4,8],['veranda-west',10,4,8],['veranda-east',14,4,8],['dojo-west',8,3,6],['dojo-east',16,3,4],['northwest',1,3,4],['northeast',23,3,6],['southwest',1,11,2],['southeast',23,11,2],['bamboo-west-below',2,6,8],['bamboo-west-east',4,5,4],['bamboo-east-below',22,7,8],['rack-above',2,6,2],['rack-below',2,8,8],['dummy-above',2,9,2],['dummy-below',2,11,8],['lantern-above',22,7,2],['lantern-below',22,9,8],['basin-above',22,9,2],['basin-below',22,11,8],['gate-under',12,12,2],['gate-outside',12,13,2],['gate-west',11,13,8],['gate-east',13,13,8]]){
            if(process.env.WWS_JOINS_ONLY==='1'&&!['door-left','door-right','veranda-west','veranda-east','dojo-west','dojo-east'].includes(name))continue;
            if(!result.reachable.includes(x+','+y))continue;
            const route=await page.evaluate(([tx,ty])=>{const q=[[$gamePlayer.x,$gamePlayer.y,[]]],seen=new Set();for(let i=0;i<q.length;i++){const [x,y,p]=q[i];if(x===tx&&y===ty)return p;for(const d of [2,4,6,8]){const nx=$gameMap.roundXWithDirection(x,d),ny=$gameMap.roundYWithDirection(y,d),k=nx+','+ny;if(!seen.has(k)&&$gamePlayer.canPass(x,y,d)){seen.add(k);q.push([nx,ny,p.concat([d])]);}}}throw Error('No route');},[x,y]);
            await page.evaluate(()=>$gamePlayer.setMoveSpeed(6));
            for(const step of route){await page.evaluate(d=>$gamePlayer.moveStraight(d),step);await page.waitForFunction(()=>!$gamePlayer.isMoving());}
            await page.evaluate(s=>$gamePlayer.setMoveSpeed(s),normalSpeed);
            assert.deepEqual(await page.evaluate(()=>[$gamePlayer.x,$gamePlayer.y]),[x,y]);
            await page.evaluate(d=>$gamePlayer.setDirection(d),d);
            await page.evaluate(()=>new Promise(resolve=>{let n=0;function tick(){if(++n>8)resolve();else requestAnimationFrame(tick);}tick();}));
            await page.screenshot({path:path.join(out,name+'.png')});
            result.diagnosticViews.push({name,position:[x,y],steps:route.length,method:'Engine moveStraight along canPass route; no teleport'});
        }
        result.doorProbes=[];
        for(const x of [10,11,12,13,14]){
            result.doorProbes.push(await page.evaluate(x=>{
                $gamePlayer.locate(x,4);$gamePlayer.setDirection(8);$gamePlayer.checkEventTriggerThere([0]);
                const starting=$gameMap.events().filter(e=>e.isStarting()).map(e=>e.eventId());
                $gameMap.events().forEach(e=>e.clearStartingFlag());
                return {position:[x,4],starting};
            },x));
        }
        result.errors=errors;result.failedRequests=failed;
        assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
        fs.writeFileSync(path.join(out,'engine-review.json'),JSON.stringify(result,null,2)+'\n');
        console.log(JSON.stringify({spawn:result.spawn,reachable:result.reachable.length,doorProbes:result.doorProbes,errors,failed}));
    } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
