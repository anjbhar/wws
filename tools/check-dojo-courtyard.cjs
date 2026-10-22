const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
if(JSON.parse(fs.readFileSync(path.join(root,'data/Map001.json'),'utf8')).note.includes('wws:dojo-courtyard-v7')) { require('./verify-courtyard-v7.cjs');return; }
if(JSON.parse(fs.readFileSync(path.join(root,'data/Map001.json'),'utf8')).note.includes('wws:dojo-courtyard-v6')) {
    require('./verify-courtyard-v6.cjs');return;
}
if(JSON.parse(fs.readFileSync(path.join(root,'data/Map001.json'),'utf8')).note.includes('wws:dojo-courtyard-v5')) {
    require('./check-finished-courtyard.cjs');return;
}
const read=n=>JSON.parse(fs.readFileSync(path.join(root,'data',n+'.json'),'utf8'));
const m=read('Map001'),sets=read('Tilesets'),system=read('System'),home=fs.existsSync(path.join(root,'data/Map002.json'))?read('Map002'):null,set=sets[m.tilesetId];
assert(m.note.includes('wws:dojo-courtyard-v4'));
assert.deepEqual([m.width,m.height],[25,19]);assert.equal(m.data.length,25*19*6);
assert.deepEqual(set.tilesetNames,['','','','','','','','EdoRedWoodExterior_D-v3','']);
// Only the exported building, wall, bamboo and two transparent collision cells.
const allowed=new Set([0,512,513]);
for(let y=1;y<=4;y++)for(let x=0;x<6;x++)allowed.add(512+y*8+x);
for(let y=8;y<=10;y++)for(let x=0;x<3;x++)allowed.add(512+y*8+x);
for(let y=8;y<=11;y++)for(let x=4;x<6;x++)allowed.add(512+y*8+x);
for(const t of m.data)assert(allowed.has(t),'No stock or ungenerated tile: '+t);
for(let x=1;x<=23;x++)for(let y=2;y<=3;y++)
    assert.equal(m.data[(m.height+y)*m.width+x],512+(7+y)*8+(x+1)%3,'Continuous overlapping wall backing');
function passage(map,x,y,bit=15){for(let z=3;z>=0;z--){
    const f=sets[map.tilesetId].flags[map.data[(z*map.height+y)*map.width+x]];
    if(f&16)continue;if(!(f&bit))return true;if((f&bit)===bit)return false;
}return false;}
const blocked=new Set(m.events.filter(e=>e&&e.pages[0].priorityType===1&&!e.pages[0].through).map(e=>e.x+','+e.y));
assert(passage(m,system.startX,system.startY));
const q=[[system.startX,system.startY]],seen=new Set(q.map(p=>p.join(',')));
for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy,b,r] of [[0,1,1,8],[-1,0,2,4],[1,0,4,2],[0,-1,8,1]]) {
    const nx=x+dx,ny=y+dy,key=nx+','+ny;
    if(nx<0||ny<0||nx>=m.width||ny>=m.height||seen.has(key)||blocked.has(key))continue;
    if(passage(m,x,y,b)&&passage(m,nx,ny,r)){seen.add(key);q.push([nx,ny]);}
}}
for(const p of [[11,3],[12,3],[12,4],[12,10],[16,11],[12,17]])assert(seen.has(p.join(',')),'Reachable '+p);
const before=JSON.parse(fs.readFileSync(path.join(root,'docs/maps/backups/before-generated-only-courtyard/Map001.json'),'utf8'));
for(const tag of ['wws:samurai-sparring','wws:shinsengumi-npc']) {
    const old=before.events.find(e=>e&&e.note===tag),now=m.events.find(e=>e&&e.note===tag);
    assert.equal(now.id,old.id);assert.deepEqual(now.pages,old.pages);
}
for(const [name,x] of [['Enter home',11],['Enter home — right door',12]]) {
    const e=m.events.find(e=>e&&e.name===name);assert.deepEqual([e.x,e.y],[x,3]);
    assert.deepEqual(e.pages[0].list.find(c=>c.code===201).parameters,[0,2,8,9,8,0]);
}
if(home){assert(passage(home,8,9));
assert.deepEqual(home.events.find(e=>e&&e.name==='Return to courtyard').pages[0].list.find(c=>c.code===201).parameters,[0,1,12,4,2,0]);}
for(let x=0;x<m.width;x++)assert(!passage(m,x,0)&&!passage(m,x,18));
for(let y=0;y<m.height;y++)assert(!passage(m,0,y)&&!passage(m,24,y));
assert(!m.events.some(e=>e&&e.name==='Dojo gate'));
console.log('PASS: generated assets only, overlapping wall joins, original-size building and reachable NPCs'+(home?', working interior transfers':''));
