// Deterministic placement of generated artwork; never changes sparring pages.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=n=>JSON.parse(fs.readFileSync(path.join(root,'data',n+'.json'),'utf8'));
const write=(n,v)=>fs.writeFileSync(path.join(root,'data',n+'.json'),JSON.stringify(v)+'\n');
const backup=path.join(root,'docs/maps/backups/before-finished-courtyard');
fs.mkdirSync(backup,{recursive:true});
for(const n of ['Map001','Map002','Tilesets','System','MapInfos']) {
 const src=path.join(root,'data',n+'.json'),dst=path.join(backup,n+'.json');
 if(fs.existsSync(src)&&!fs.existsSync(dst))fs.copyFileSync(src,dst);
}
const m=read('Map001'),sets=read('Tilesets'),system=read('System'),set=sets[m.tilesetId];
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/art/courtyard-finish/export.json'),'utf8'));
set.tilesetNames=['','','','','EdoCourtyard_A5-v1','','','EdoRedWoodExterior_D-v4','EdoCourtyard_E-v1'];
set.flags=Array(8192).fill(16);set.flags[512]=15;set.flags[513]=0;
const W=m.width=25,H=m.height=19;m.data=Array(W*H*6).fill(0);
m.note='wws:dojo-courtyard-v5\nCustom generated artwork only. Original 288x192 dojo and original sparring pages. Sources: docs/art/courtyard-finish.';
m.displayName='Dojo Courtyard';m.encounterList=[];
m.parallaxName='';m.battleback1Name='';m.battleback2Name='';
const put=(x,y,z,t)=>{m.data[(z*H+y)*W+x]=t;};
const d=(x,y)=>512+y*8+x;
function assembly(name,x,y,z=2,pass='block') {
 const a=manifest.assets[name];if(!a)throw Error('Missing assembly '+name);
 for(let yy=0;yy<a.h;yy++)for(let xx=0;xx<a.w;xx++) {
  const t=768+(a.y+yy)*8+a.x+xx;
  // Atlas only uses its left 8 columns, avoiding MZ's split-page addressing.
  const overhead=pass==='tall'&&yy<a.h-1;
  set.flags[t]=pass==='walk'?0:overhead?16:15;
  put(x+xx,y+yy,z,t);
  if(overhead)put(x+xx,y+yy,1,513);
 }
}
for(let y=0;y<H;y++)for(let x=0;x<W;x++) {
 const t=1536+(y%4)*8+x%4;set.flags[t]=0;put(x,y,0,t);
 if(x===0||x===24||y===0||y===18)put(x,y,1,512);
}
// North wall: overlap an opaque generated backing under every panel join.
for(let x=0;x<W;x++)for(let y=1;y<=3;y++) {
 const t=d(x%3,7+y);set.flags[t]=y===1?16:15;put(x,y,2,t);put(x,y,1,512);
}
for(let y=0;y<4;y++)for(let x=0;x<6;x++) {
 const t=d(x,y+1);set.flags[t]=y<2?16:15;put(9+x,y,2,t);put(9+x,y,1,512);
}
// A real generated veranda fits beneath the original sill, without altering it.
assembly('veranda',10,4,2,'walk');
for(const bx of [1,22])for(let y=0;y<4;y++)for(let x=0;x<2;x++) {
 const t=d(4+x,8+y);set.flags[t]=y<3?16:15;put(bx+x,1+y,3,t);
 if(y===3)put(bx+x,4,1,512);
}
// Side returns and southern wall leave one modest two-cell entrance.
for(const x of [0,24])for(let y=3;y<=17;y++)assembly(x===0?'side-left':'side-right',x,y,2);
for(let x=1;x<=23;x++)if(x<10||x>13)for(let y=15;y<=17;y++) {
 const t=d(x%3,8+y-15);set.flags[t]=y===15?16:15;put(x,y,2,t);put(x,y,1,512);
}
assembly('corner',0,0,2);assembly('corner-right',22,0,2);
assembly('corner',0,14,2);assembly('corner-right',22,14,2);
for(let x=9;x<=14;x++)for(let y=2;y<=3;y++)put(x,y,1,d((x+1)%3,7+y));
assembly('post',9,15,3);assembly('post',14,15,3);
assembly('gate',10,15,3);
const g=manifest.assets.gate;
for(let yy=0;yy<g.h;yy++)for(let xx=0;xx<g.w;xx++) {
 const t=768+(g.y+yy)*8+g.x+xx;
 set.flags[t]=yy===0?16:(xx===0||xx===3)?15:16;
 if(xx===0||xx===3)put(10+xx,15+yy,1,512);
}
for(let y=15;y<=18;y++)for(const x of [11,12])put(x,y,1,513);
for(const [x,y,i] of [[11,17,0],[12,16,1],[11,15,2],[12,14,0]])assembly('stone-'+i,x,y,2,'walk');
assembly('bokken-rack',4,5,2,'tall');assembly('dummy',6,6,2,'tall');
assembly('basin',20,5);assembly('lantern',19,4,2,'tall');
for(const [x,y] of [[3,4],[20,13],[2,13]])assembly('planting',x,y);
const home=fs.existsSync(path.join(root,'data/Map002.json'))?read('Map002'):null;
for(const e of m.events.filter(e=>e&&[1,5].includes(e.id))) {
 const p=e.pages[0];p.trigger=0;p.priorityType=1;
 p.list=home?[{code:201,indent:0,parameters:[0,2,8,9,8,0]},{code:0,indent:0,parameters:[]}]:[
  {code:101,indent:0,parameters:['',0,0,2,'']},
  {code:401,indent:0,parameters:['The dojo is closed. Practice continues in the courtyard.']},
  {code:0,indent:0,parameters:[]}];
}
system.startMapId=1;system.startX=12;system.startY=12;
write('Map001',m);write('Tilesets',sets);write('System',system);
console.log('Finished custom courtyard. Interior: '+(home?'existing map 2':'absent; no transfer commands'));
