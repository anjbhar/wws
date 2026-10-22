// Apply only after the immutable before-courtyard-v6 backup exists.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const R=path.resolve(__dirname,'..'),read=n=>JSON.parse(fs.readFileSync(path.join(R,'data',n+'.json'))),write=(n,v)=>fs.writeFileSync(path.join(R,'data',n+'.json'),JSON.stringify(v)+'\n');
const backup=path.join(R,'docs/maps/backups/before-courtyard-v6');
for(const n of ['Map001','Tilesets','System'])assert(fs.existsSync(path.join(backup,n+'.json')),'Backup first');
const m=read('Map001'),sets=read('Tilesets'),s=read('System'),set=sets[m.tilesetId],a=JSON.parse(fs.readFileSync(path.join(R,'docs/art/courtyard-v6/export.json'))).assets;
const W=m.width=25,H=m.height=15; m.data=Array(W*H*6).fill(0);
m.note='wws:dojo-courtyard-v6\nOriginal 288x192 dojo; full preserved sparring records. Custom sources: docs/art/courtyard-v6.';
m.displayName='Dojo Courtyard';m.encounterList=[];
set.tilesetNames=['','','','','EdoCourtyard_A5-v2','EdoCourtyard_west-v1','EdoCourtyard_east-v1','EdoRedWoodExterior_D-v4','EdoCourtyard_E-v2'];
set.flags=Array(8192).fill(16);set.flags[512]=15;set.flags[513]=0;
const put=(x,y,z,t)=>{assert(x>=0&&x<W&&y>=0&&y<H);m.data[(z*H+y)*W+x]=t;};
const d=(x,y)=>512+y*8+x;
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
 const t=1536+(y%8)*8+x%8;set.flags[t]=0;put(x,y,0,t);
 if(y===0)put(x,y,1,512);
}
// Existing wall is retained along both long horizontal runs.
for(const y0 of [1,12])for(let x=5;x<20;x++){
 if(y0===12&&x>=10&&x<=13)continue;
 for(let yy=0;yy<3;yy++){const t=d((x-5)%3,8+yy);set.flags[t]=yy===0?16:15;put(x,y0+yy,2,t);put(x,y0+yy,1,512);}
}
// New independently lit west/east returns, including four distinct corners.
for(const [slot,x0] of [[0,0],[1,20]])for(let yy=0;yy<14;yy++)for(let xx=0;xx<5;xx++){
 // Middle of each assembly contains only the narrow roof/wall edge.
 if(yy>=3&&yy<11&&((slot===0&&xx>=2)||(slot===1&&xx<3)))continue;
 const t=slot===0&&yy===0&&xx===0?128:slot*256+yy*8+xx;
 set.flags[t]=15;put(x0+xx,yy+1,2,t);
}
// Original building: no pixels, tiles or proportions changed.
for(let yy=0;yy<4;yy++)for(let xx=0;xx<6;xx++){
 const t=d(xx,yy+1);set.flags[t]=yy<2?16:15;put(9+xx,yy,2,t);put(9+xx,yy,1,512);
}
for(let x=9;x<=14;x++)for(let y=2;y<=3;y++)put(x,y,1,d((x+1)%3,7+y));
function prop(name,x,y,kind='base',z=2){const p=a[name];for(let yy=0;yy<p.h;yy++)for(let xx=0;xx<p.w;xx++){
 const t=768+(p.y+yy)*8+p.x+xx,star=kind==='tall'&&yy<p.h-1;
 set.flags[t]=kind==='walk'?0:star?16:15;put(x+xx,y+yy,z,t);
}}
prop('veranda',10,4,'walk');
for(const [bx,by] of [[2,2],[21,3]])for(let yy=0;yy<4;yy++)for(let xx=0;xx<2;xx++){
 const t=d(4+xx,8+yy);set.flags[t]=yy<3?16:15;put(bx+xx,by+yy,3,t);
}
prop('gate',10,12,'tall',3);
for(let yy=0;yy<3;yy++)for(let xx=0;xx<4;xx++){
 const t=768+yy*8+xx;set.flags[t]=yy===0||xx===1||xx===2?16:15;
}
for(let y=12;y<15;y++)for(const x of [11,12])put(x,y,1,513);
// A single aligned approach, with no alternating lateral jumps.
for(const y of [11,12,13,14])prop('slab',12,y,'walk',2);
prop('rack',4,5,'tall');prop('dummy',2,8,'tall');
prop('basin',22,8);prop('lantern',20,6,'tall');
prop('planting',18,4,'base',2);
// Door event stays at the actual closed sill; actor stands on veranda steps.
for(const e of m.events.filter(e=>e&&[1,5].includes(e.id))){
 e.pages[0].list=[{code:101,indent:0,parameters:['',0,0,2,'']},{code:401,indent:0,parameters:['The dojo doors are closed. Training continues in the courtyard.']},{code:0,indent:0,parameters:[]}];
}
// Deliberate gate boundary, no transfers to absent maps.
for(const x of [11,12]){
 const id=x===11?8:9;
 m.events[id]={id,name:'Southern entrance — training boundary',note:'wws:courtyard-boundary',x,y:14,pages:[{conditions:{actorId:1,actorValid:false,itemId:1,itemValid:false,selfSwitchCh:'A',selfSwitchValid:false,switch1Id:1,switch1Valid:false,switch2Id:1,switch2Valid:false,variableId:1,variableValid:false,variableValue:0},directionFix:false,image:{characterIndex:0,characterName:'',direction:2,pattern:1,tileId:0},list:[{code:101,indent:0,parameters:['',0,0,2,'']},{code:401,indent:0,parameters:['The road can wait. Remain here until courtyard training is finished.']},{code:0,indent:0,parameters:[]}],moveFrequency:3,moveRoute:{list:[{code:0,parameters:[]}],repeat:true,skippable:false,wait:false},moveSpeed:3,moveType:0,priorityType:1,stepAnime:false,through:false,trigger:0,walkAnime:true}]};
}
s.startMapId=1;s.startX=12;s.startY=7;
write('Map001',m);write('Tilesets',sets);write('System',s);
console.log('Saved 25x15 courtyard, original dojo, unchanged fighters, closed door and deliberate southern boundary.');
