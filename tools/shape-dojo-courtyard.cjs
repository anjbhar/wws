// Build the walkable counterpart of the practice fight background.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=n=>JSON.parse(fs.readFileSync(path.join(root,'data',n+'.json'),'utf8'));
const write=(n,v)=>fs.writeFileSync(path.join(root,'data',n+'.json'),JSON.stringify(v)+'\n');
const m=read('Map001'),sets=read('Tilesets'),home=read('Map002');
const marker='wws:dojo-courtyard-v1';
const revision='wws:dojo-courtyard-v2';
if(m.note.includes(revision)){require('./check-dojo-courtyard.cjs');return;}
assert.equal(m.width,25);assert.equal(m.height,19);
const backup=path.join(root,'docs/maps/backups/before-dojo-layering-v2');
fs.mkdirSync(backup,{recursive:true});
for(const name of ['Map001','Map002','Tilesets']) {
    const dest=path.join(backup,name+'.json');
    if(!fs.existsSync(dest))fs.copyFileSync(path.join(root,'data',name+'.json'),dest);
}
const npc=structuredClone(m.events.find(e=>e&&e.note==='wws:samurai-sparring'));
assert(npc);const set=sets[m.tilesetId];
set.tilesetNames[7]='EdoRedWoodExterior_D-v3';
assert(fs.existsSync(path.join(root,'img/tilesets/EdoRedWoodExterior_D-v3.png')));
const at=(x,y,z)=>(z*m.height+y)*m.width+x;
const put=(x,y,z,t)=>{m.data[at(x,y,z)]=t;};
const d=(x,y)=>512+y*8+x;
m.data.fill(0);
// A broad earthen practice floor with narrow planting beds around its perimeter.
for(let y=0;y<19;y++)for(let x=0;x<25;x++) {
    const edge=x===0||x===24||y===0||y===18;
    const yard=x>=3&&x<=21&&y>=3&&y<=17 || x>=2&&x<=22&&y>=7&&y<=15;
    put(x,y,0,edge?3008:yard?2864:2816);
}
const core=fs.readFileSync(path.join(root,'js/rmmz_core.js'),'utf8');
const table=JSON.parse(core.match(/Tilemap\.FLOOR_AUTOTILE_TABLE = (\[[\s\S]*?\]);/)[1]);
for(let y=0;y<19;y++)for(let x=0;x<25;x++) {
    const kind=Math.floor((m.data[at(x,y,0)]-2048)/48);
    const same=(xx,yy)=>xx<0||yy<0||xx>=25||yy>=19||Math.floor((m.data[at(xx,yy,0)]-2048)/48)===kind;
    const n=same(x,y-1),s=same(x,y+1),w=same(x-1,y),e=same(x+1,y);
    const q=[w&&n?(same(x-1,y-1)?[2,4]:[2,0]):!w&&n?[0,4]:w&&!n?[2,2]:[0,2],
        e&&n?(same(x+1,y-1)?[1,4]:[3,0]):!e&&n?[3,4]:e&&!n?[1,2]:[3,2],
        w&&s?(same(x-1,y+1)?[2,3]:[2,1]):!w&&s?[0,3]:w&&!s?[2,5]:[0,5],
        e&&s?(same(x+1,y+1)?[1,3]:[3,1]):!e&&s?[3,3]:e&&!s?[1,5]:[3,5]];
    const shape=table.findIndex(a=>JSON.stringify(a)===JSON.stringify(q));
    assert(shape>=0);put(x,y,0,2048+kind*48+shape);
}
set.flags[512]=15;
// Center the existing small building; retain its native sprite dimensions.
for(let y=0;y<4;y++)for(let x=0;x<6;x++) {
    const t=d(x,y+1),door=y===3&&[2,3].includes(x);
    set.flags[t]=y<2?16:door?0:15;
    put(9+x,y,2,t);if(y<2)put(9+x,y,1,512);
}
// Continuous low wall wings share the building's ground line.
for(const [left,right] of [[1,8],[15,23]])for(let x=left;x<=right;x++)for(let y=0;y<3;y++) {
    const t=d((x-left)%3,8+y);set.flags[t]=y===0?16:15;
    put(x,1+y,2,t);if(y===0)put(x,1+y,1,512);
}
// Continue plaster/plinth behind the house's transparent side margins so the
// perimeter reads as one enclosure rather than leaving narrow grass gaps.
for(let x=9;x<=14;x++)for(let y=2;y<=3;y++)put(x,y,1,d((x-1)%3,8+y-1));
// Bamboo roots stand one row in front of the wall, in the planting beds.
// The upper three rows overlap the wall; the complete base stays on the ground.
for(const bx of [1,22])for(let y=0;y<4;y++)for(let x=0;x<2;x++) {
    const t=d(4+x,8+y);set.flags[t]=y<3?16:15;put(bx+x,1+y,3,t);
}
function tree(x,y,z=2){for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++) {
    const t=176+yy*8+xx;set.flags[t]=yy===0?16:15;put(x+xx,y+yy,z,t);
}}
// The north hedge supplies a clean backdrop. Extra tiled treetops here produced
// distracting repeated silhouettes and dark gaps immediately behind the roof.
// No foreground tree overlaps either bamboo cluster's base.
for(const [x,y] of [[1,13],[22,13]])tree(x,y);
// Sparse rocks/shrubs stay in the planting beds, clear of the fighting floor.
for(const [x,y,t] of [[1,9,159],[23,9,159],[1,11,154],[23,11,154],[2,16,154],[22,16,154]]) {
    set.flags[t]=15;put(x,y,2,t);
}
// Keep the paired lanterns, just outside the central sparring space.
for(const x of [7,17]){put(x,7,2,778);put(x,8,2,786);}
const left=m.events.find(e=>e&&e.name==='Enter home');
const right=m.events.find(e=>e&&e.name==='Enter home — right door');
assert(left&&right);left.x=11;left.y=3;right.x=12;right.y=3;
const exit=home.events.find(e=>e&&e.name==='Return to courtyard').pages[0].list.find(c=>c.code===201);
exit.parameters=[0,1,12,4,2,0];
assert.deepEqual(m.events.find(e=>e&&e.note==='wws:samurai-sparring'),npc);
m.note=marker+'\n'+revision+': north-edge building (9,0), 6x4; entrances (11,3)/(12,3); grounded bamboo; clean north hedge.';
write('Map001',m);write('Map002',home);write('Tilesets',sets);
require('./check-dojo-courtyard.cjs');
