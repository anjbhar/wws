// Remove courtyard clutter and the stock shed while retaining the home and NPC.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),file=path.join(root,'data/Map001.json');
const m=JSON.parse(fs.readFileSync(file,'utf8'));
if(m.note.includes('wws:dojo-courtyard-v1')){require('./check-dojo-courtyard.cjs');return;}
assert.equal(m.width,25);assert.equal(m.height,19);
const backup=path.join(root,'docs/maps/backups/before-courtyard-cleanup');
fs.mkdirSync(backup,{recursive:true});
if(!fs.existsSync(path.join(backup,'Map001.json')))fs.copyFileSync(file,path.join(backup,'Map001.json'));
const before=structuredClone(m);
const at=(x,y,z)=>(z*m.height+y)*m.width+x;
// Village E-sheet furniture, supplies and disconnected fence sections; keep lanterns.
let removed=0;
for(let y=0;y<m.height;y++)for(let x=0;x<m.width;x++)for(let z=1;z<=3;z++) {
    const i=at(x,y,z),t=m.data[i];
    if(t>=768&&t<1024&&![778,786].includes(t)){m.data[i]=0;removed++;}
}
// Complete stock shed: roof, walls, door, upper layers and shadow bits.
for(let y=3;y<=6;y++)for(let x=17;x<=21;x++)for(let z=1;z<=4;z++)m.data[at(x,y,z)]=0;
for(const e of m.events)if(e&&e.name==='Storage shed')m.events[e.id]=null;
// Grass replaces only the shed's approach; the main courtyard path stays intact.
for(let y=6;y<=8;y++)for(let x=19;x<=20;x++)m.data[at(x,y,0)]=2816;
const core=fs.readFileSync(path.join(root,'js/rmmz_core.js'),'utf8');
const table=JSON.parse(core.match(/Tilemap\.FLOOR_AUTOTILE_TABLE = (\[[\s\S]*?\]);/)[1]);
for(let y=0;y<m.height;y++)for(let x=0;x<m.width;x++) {
    const t=m.data[at(x,y,0)],kind=Math.floor((t-2048)/48);
    if(![16,17].includes(kind))continue;
    const same=(xx,yy)=>xx<0||yy<0||xx>=m.width||yy>=m.height||Math.floor((m.data[at(xx,yy,0)]-2048)/48)===kind;
    const n=same(x,y-1),s=same(x,y+1),w=same(x-1,y),e=same(x+1,y);
    const q=[
        w&&n?(same(x-1,y-1)?[2,4]:[2,0]):!w&&n?[0,4]:w&&!n?[2,2]:[0,2],
        e&&n?(same(x+1,y-1)?[1,4]:[3,0]):!e&&n?[3,4]:e&&!n?[1,2]:[3,2],
        w&&s?(same(x-1,y+1)?[2,3]:[2,1]):!w&&s?[0,3]:w&&!s?[2,5]:[0,5],
        e&&s?(same(x+1,y+1)?[1,3]:[3,1]):!e&&s?[3,3]:e&&!s?[1,5]:[3,5]
    ];
    const shape=table.findIndex(a=>JSON.stringify(a)===JSON.stringify(q));
    assert(shape>=0,'Valid terrain join');m.data[at(x,y,0)]=2048+kind*48+shape;
}
const marker='wws:clean-courtyard-v1';
if(!m.note.includes(marker))m.note+='\n'+marker+': shed and loose furniture/supplies/fence fragments removed; lanterns retained.';
assert.deepEqual(m.events.filter(Boolean),before.events.filter(e=>e&&e.name!=='Storage shed'),'Other events preserved');
for(let y=3;y<=6;y++)for(let x=3;x<=8;x++)for(let z=1;z<=4;z++)
    assert.equal(m.data[at(x,y,z)],before.data[at(x,y,z)],'Samurai home preserved');
assert.equal(m.data.length,m.width*m.height*6);
fs.writeFileSync(file,JSON.stringify(m)+'\n');
console.log(JSON.stringify({removedPropTiles:removed,shed:'removed',shedEvent:'removed',home:'preserved',lanterns:'preserved',otherEvents:'preserved'}));
