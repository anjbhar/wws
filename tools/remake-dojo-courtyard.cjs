// Only previously generated art. Ground stays transparent until we generate it.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
if(JSON.parse(fs.readFileSync(path.join(root,'data/Map001.json'),'utf8')).note.includes('wws:dojo-courtyard-v5')) {
    require('./finish-dojo-courtyard.cjs');return;
}
const read=n=>JSON.parse(fs.readFileSync(path.join(root,'data',n+'.json'),'utf8'));
const write=(n,v)=>fs.writeFileSync(path.join(root,'data',n+'.json'),JSON.stringify(v)+'\n');
const m=read('Map001'),home=fs.existsSync(path.join(root,'data/Map002.json'))?read('Map002'):null,sets=read('Tilesets'),system=read('System'),infos=read('MapInfos');
const backup=path.join(root,'docs/maps/backups/before-generated-only-courtyard');
fs.mkdirSync(backup,{recursive:true});
for(const n of ['Map001','Map002','Tilesets','System','MapInfos']) {
    const dest=path.join(backup,n+'.json');
    const source=path.join(root,'data',n+'.json');
    if(fs.existsSync(source)&&!fs.existsSync(dest))fs.copyFileSync(source,dest);
}
const set=sets.find(t=>t&&t.name==='Dojo Compound');
if(!set)throw Error('Dojo tileset missing');
// Unload every stock sheet from this map. D contains generated building/wall/bamboo.
set.tilesetNames=['','','','','','','','EdoRedWoodExterior_D-v3',''];
set.flags=Array(8192).fill(16);
const BLOCK=512,FLOOR=513; // Existing fully transparent cells; collision only.
set.flags[BLOCK]=15;set.flags[FLOOR]=0;
const W=25,H=19;
m.width=W;m.height=H;m.tilesetId=set.id;m.displayName='Dojo Courtyard';
m.note='wws:dojo-courtyard-v4\nGenerated art only: original 6x4 building, wall and bamboo. No ground art generated yet; transparent ground and boundary collision cells only. No stock map tiles or new scenery.';
m.data=Array(W*H*6).fill(0);m.encounterList=[];
const put=(x,y,z,t)=>{m.data[(z*H+y)*W+x]=t;};
const d=(x,y)=>512+y*8+x;
for(let y=0;y<H;y++)for(let x=0;x<W;x++)put(x,y,0,x===0||x===W-1||y===0||y===H-1?BLOCK:FLOOR);
// Keep the generated building at its original dimensions, without repeating windows.
for(let y=0;y<4;y++)for(let x=0;x<6;x++) {
    const t=d(x,y+1),door=y===3&&[2,3].includes(x);
    set.flags[t]=y<2?16:door?0:15;put(9+x,y,2,t);
    if(y<2)put(9+x,y,1,BLOCK);
}
for(const [left,right] of [[1,8],[15,23]])for(let x=left;x<=right;x++)for(let y=0;y<3;y++) {
    const t=d((x-left)%3,8+y);set.flags[t]=y===0?16:15;
    put(x,1+y,2,t);if(y===0)put(x,1+y,1,BLOCK);
}
// Offset a continuous backing wall beneath the facade. The generated panel's
// transparent outer edges and the building's side margins need an overlap;
// otherwise they expose black slits when no terrain is present underneath.
for(let x=1;x<=23;x++)for(let y=2;y<=3;y++)put(x,y,1,d((x+1)%3,7+y));
// No walkable pockets behind the wall.
for(let x=1;x<W-1;x++)if(x<9||x>14)put(x,0,0,BLOCK);
for(const bx of [1,22])for(let y=0;y<4;y++)for(let x=0;x<2;x++) {
    const t=d(4+x,8+y);set.flags[t]=y<3?16:15;put(bx+x,1+y,3,t);
}
for(const [name,x] of [['Enter home',11],['Enter home — right door',12]]) {
    const e=m.events.find(e=>e&&e.name===name);e.x=x;e.y=3;
}
const samurai=m.events.find(e=>e&&e.note==='wws:samurai-sparring');samurai.x=12;samurai.y=9;
const shinsengumi=m.events.find(e=>e&&e.note==='wws:shinsengumi-npc');shinsengumi.x=16;shinsengumi.y=10;
// The fabricated gate is gone; leave its old event slot empty to preserve other IDs.
for(let i=0;i<m.events.length;i++)if(m.events[i]&&['Dojo gate','Southern path'].includes(m.events[i].name))m.events[i]=null;
if(home)home.events.find(e=>e&&e.name==='Return to courtyard').pages[0].list.find(c=>c.code===201).parameters=[0,1,12,4,2,0];
system.startMapId=1;system.startX=12;system.startY=12;
infos[1]={...infos[1],name:'Dojo Courtyard',scrollX:600,scrollY:456};
write('Map001',m);if(home)write('Map002',home);write('Tilesets',sets);write('System',system);write('MapInfos',infos);
require('./check-dojo-courtyard.cjs');
