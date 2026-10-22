const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const R=path.resolve(__dirname,'..'),read=n=>JSON.parse(fs.readFileSync(path.join(R,'data',n+'.json'))),write=(n,v)=>fs.writeFileSync(path.join(R,'data',n+'.json'),JSON.stringify(v)+'\n');
const backup=path.join(R,'docs/maps/backups/before-courtyard-v7/data');
for(const n of ['Map001','Tilesets','System'])assert(fs.existsSync(path.join(backup,n+'.json')),'Backup first');
const m=read('Map001'),sets=read('Tilesets'),s=read('System'),set=sets[m.tilesetId],a=JSON.parse(fs.readFileSync(path.join(R,'docs/art/courtyard-v7/export.json')));
const W=25,H=15;m.width=W;m.height=H;m.data=Array(W*H*6).fill(0);
m.note='wws:dojo-courtyard-v7\nOriginal 288x192 hall RGBA, original straight wall faces, bamboo and complete swordsmen records preserved. Sources: docs/art/courtyard-v7.';
set.tilesetNames=['','','','','EdoCourtyard_A5-v2','EdoCourtyard_B-v7','EdoCourtyard_C-v7','EdoRedWoodExterior_D-v4','EdoCourtyard_E-v7'];
set.flags=Array(8192).fill(16);set.flags[512]=15;set.flags[513]=0;
const put=(x,y,z,t)=>{assert(x>=0&&x<W&&y>=0&&y<H);m.data[(z*H+y)*W+x]=t};
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
 const t=1536+(y%8)*8+x%8;set.flags[t]=0;put(x,y,0,t);
 // Bases: 48px side cells, rear wall row2, front wall rows12/13.
 // No solid roof-width bands. Exterior north strip excluded intentionally.
 if(y===0||x===0||x===24||y===2||y>=12)put(x,y,1,512);
}
for(const t of a.architectureTiles){
 let flag=16;
 // Rear wall face and hall body are solid; all roof projections are overhead.
 if((t.y===2)||(t.y===3&&t.x>=9&&t.x<=15)||(t.x===0||t.x===24)||(t.y>=12))flag=15;
 if(t.y>=11&&t.x>=11&&t.x<=13)flag=16;
 set.flags[t.id]=flag;put(t.x,t.y,2,t.id);
}
// The real gateway and small arrival apron remain open, with an honest action boundary.
for(let y=11;y<=14;y++)for(let x=11;x<=13;x++)put(x,y,1,513);
function prop(name,x,y,kind='tall',z=3){const p=a.assets[name];for(let yy=0;yy<p.h;yy++)for(let xx=0;xx<p.w;xx++){
 const t=768+(p.y+yy)*8+p.x+xx;set.flags[t]=kind==='walk'?0:yy<p.h-1?16:15;put(x+xx,y+yy,z,t);
}}
// Low threshold shares y=192 sill; single walkable standing surface.
prop('veranda',9,4,'walk',2);
for(const [bx,by]of [[2,2],[21,3]])for(let yy=0;yy<4;yy++)for(let xx=0;xx<2;xx++){
 const t=512+(8+yy)*8+4+xx;set.flags[t]=yy<3?16:15;put(bx+xx,by+yy,3,t);
}
prop('rack',2,6);prop('dummy',2,9);prop('basin',22,10);prop('lantern',22,7);
prop('planting',18,2,'base');
for(const [i,y]of [10,11,12,13].entries())prop('slab'+i%3,12,y,'walk',3);
for(const e of m.events.filter(e=>e&&[1,5].includes(e.id)))e.pages[0].list=[{code:101,indent:0,parameters:['',0,0,2,'']},{code:401,indent:0,parameters:['The dojo is closed. Sparring is held here in the courtyard.']},{code:0,indent:0,parameters:[]}];
// Existing door events move with the half-cell-aligned hall; both action cells still work.
// Full swordsman records are immutable, including coordinates and every event branch.
for(const e of m.events.filter(e=>e&&[8,9].includes(e.id))){e.x=e.id===8?11:13;e.y=14;e.pages[0].list[1].parameters=['The road beyond this courtyard is outside this practice area.'];}
// Center action boundary closes the third passable cell as well.
m.events[10]=JSON.parse(JSON.stringify(m.events[8]));m.events[10].id=10;m.events[10].x=12;
s.startMapId=1;s.startX=12;s.startY=11;
const old=JSON.parse(fs.readFileSync(path.join(backup,'Map001.json')));
for(const tag of ['wws:samurai-sparring','wws:shinsengumi-npc'])assert.deepEqual(m.events.find(e=>e&&e.note===tag),old.events.find(e=>e&&e.note===tag));
write('Map001',m);write('Tilesets',sets);write('System',s);
console.log('Saved v7 courtyard: shared architecture, centered approach, original hall and complete fighters.');
