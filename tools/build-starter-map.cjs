const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
if (JSON.parse(fs.readFileSync(path.join(root,'data/Map001.json'),'utf8')).note.includes('wws:dojo-courtyard-v5')) {
  require('./finish-dojo-courtyard.cjs');return;
}
// Once the full dojo remake is installed, the starter builder regenerates it.
if (/wws:dojo-courtyard-v[34]/.test(JSON.parse(fs.readFileSync(path.join(root, 'data/Map001.json'), 'utf8')).note)) {
  require('./remake-dojo-courtyard.cjs');
  return;
}
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'data', name + '.json'), 'utf8'));
const write = (name, value) => fs.writeFileSync(path.join(root, 'data', name + '.json'), JSON.stringify(value));
const backup = path.join(root, 'docs/maps/backups/before-starter-map');
fs.mkdirSync(backup, {recursive:true});
for (const name of ['Map001','MapInfos','Tilesets','System']) {
  const target = path.join(backup, name+'.json');
  if (!fs.existsSync(target)) fs.copyFileSync(path.join(root,'data',name+'.json'),target);
}
const sets = read('Tilesets');
function newSet(name, sourceId, interior=false) {
  const previous = sets.find(t => t && t.name===name);
  if (previous) return previous;
  const t = structuredClone(sets.find(t=>t && t.id===sourceId));
  t.id=sets.length; t.name=name; t.tilesetNames[8]='EdoVillage_B-v1';
  for (let i=768;i<1024;i++) t.flags[i]=16;
  for (const [x,y] of [[1,0],[2,0],[3,0],[0,1],[1,1],[3,1],[2,2],[0,2],[1,2],[3,2],[0,3],[1,3],[2,3],[3,3]]) t.flags[768+y*8+x]=15;
  t.flags[768+1*8+2]=16; // lantern upper half
  t.flags[0]=16;
  if (!interior) {
    for(let shape=0;shape<48;shape++) {t.flags[2816+shape]=0;t.flags[2864+shape]=0;t.flags[3008+shape]=15;}
    t.flags[114]=15; t.flags[122]=0; // full-height door upper/lower cells
  } else {
    t.flags[1552]=0; t.flags[1553]=0; t.flags[1536]=15;
  }
  sets.push(t); return t;
}
const exteriorSet=newSet('Edo Village — Starter',2);
const interiorSet=newSet('Edo Home — Starter',3,true);
exteriorSet.flags[114]=15;exteriorSet.flags[122]=0;
const core=fs.readFileSync(path.join(root,'js/rmmz_core.js'),'utf8');
const floorTable=JSON.parse(core.match(/Tilemap\.FLOOR_AUTOTILE_TABLE = (\[[\s\S]*?\]);/)[1]);
const template=read('Map001');
function map(w,h,tilesetId,name) {
  return {...template,width:w,height:h,tilesetId,displayName:name,data:Array(w*h*6).fill(0),events:[null],encounterList:[],autoplayBgm:false,autoplayBgs:false,note:'Starter layout: stock terrain/building placeholders with custom village props.'};
}
const put=(m,x,y,z,t)=>{if(x<0||y<0||x>=m.width||y>=m.height)throw Error('Tile outside map');m.data[(z*m.height+y)*m.width+x]=t;};
const get=(m,x,y,z)=>m.data[(z*m.height+y)*m.width+x];
function rect(m,x,y,w,h,z,t) {for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)put(m,xx,yy,z,t);}
function autotiles(m,z) {
  for(let y=0;y<m.height;y++)for(let x=0;x<m.width;x++) {
    const t=get(m,x,y,z); if(t<2048)continue;
    const kind=Math.floor((t-2048)/48), base=2048+kind*48;
    const same=(xx,yy)=>xx<0||yy<0||xx>=m.width||yy>=m.height ? true : Math.floor((get(m,xx,yy,z)-2048)/48)===kind;
    const n=same(x,y-1),s=same(x,y+1),w=same(x-1,y),e=same(x+1,y);
    if(t>=4352 && t<5888) {put(m,x,y,z,base+(!w?1:0)+(!n?2:0)+(!e?4:0)+(!s?8:0));continue;}
    const q=[
      w&&n ? (same(x-1,y-1)?[2,4]:[2,0]) : !w&&n?[0,4]:w&&!n?[2,2]:[0,2],
      e&&n ? (same(x+1,y-1)?[1,4]:[3,0]) : !e&&n?[3,4]:e&&!n?[1,2]:[3,2],
      w&&s ? (same(x-1,y+1)?[2,3]:[2,1]) : !w&&s?[0,3]:w&&!s?[2,5]:[0,5],
      e&&s ? (same(x+1,y+1)?[1,3]:[3,1]) : !e&&s?[3,3]:e&&!s?[1,5]:[3,5]
    ];
    const shape=floorTable.findIndex(a=>JSON.stringify(a)===JSON.stringify(q));
    if(shape<0)throw Error('Unmatched autotile neighborhood');
    put(m,x,y,z,base+shape);
  }
}
function prop(m,x,y,sx,sy,w=1,h=1) {for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)put(m,x+xx,y+yy,2,768+(sy+yy)*8+sx+xx);}
function event(m,name,x,y,commands,trigger=0,priority=0) {
  const id=m.events.length;
  m.events.push({id,name,note:'',x,y,pages:[{conditions:{actorId:1,actorValid:false,itemId:1,itemValid:false,selfSwitchCh:'A',selfSwitchValid:false,switch1Id:1,switch1Valid:false,switch2Id:1,switch2Valid:false,variableId:1,variableValid:false,variableValue:0},directionFix:true,image:{tileId:0,characterName:'',characterIndex:0,direction:2,pattern:1},list:[...commands,{code:0,indent:0,parameters:[]}],moveFrequency:3,moveRoute:{list:[{code:0,parameters:[]}],repeat:true,skippable:false,wait:false},moveSpeed:3,moveType:0,priorityType:priority,stepAnime:false,through:false,trigger,walkAnime:false}]});
}
const message=text=>[{code:101,indent:0,parameters:['',0,0,2,'']},{code:401,indent:0,parameters:[text]}];
const village=map(25,19,exteriorSet.id,'Village Courtyard');
rect(village,0,0,25,19,0,2816);
rect(village,10,5,5,13,0,2864);
rect(village,3,9,19,3,0,2864);
rect(village,5,6,2,5,0,2864);
rect(village,19,6,2,5,0,2864);
rect(village,8,8,9,6,0,2864);
for(let x=0;x<25;x++){put(village,x,0,0,3008);put(village,x,18,0,3008);}
for(let y=0;y<19;y++){put(village,0,y,0,3008);put(village,24,y,0,3008);}
// Buildings: navy-tile home and wooden storage shed.
rect(village,3,2,6,3,1,4688); rect(village,3,5,6,2,1,4928);
rect(village,17,3,5,2,1,4544); rect(village,17,5,5,2,1,4928);
autotiles(village,0);autotiles(village,1);
put(village,5,5,2,114);put(village,5,6,2,122);
put(village,19,5,2,114);put(village,19,6,2,122);
prop(village,4,10,0,1,2,1);prop(village,4,11,3,0);prop(village,6,11,3,3);
prop(village,17,8,1,0);prop(village,18,8,2,0);prop(village,20,8,3,1);
prop(village,9,8,2,1,1,2);prop(village,15,8,2,1,1,2);
prop(village,4,14,3,2);prop(village,5,14,0,2);prop(village,6,14,1,2);
prop(village,18,14,3,2);prop(village,19,14,0,2);prop(village,20,14,1,2);
// Sparse stock trees. Their top half draws above the player; trunks block movement.
function tree(m,x,y) {for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++){const t=128+(6+yy)*8+xx;put(m,x+xx,y+yy,2,t);exteriorSet.flags[t]=yy===0?16:15;}}
for(const [x,y] of [[1,1],[11,1],[22,1],[1,6],[22,6],[2,15],[7,15],[16,15],[21,15]])tree(village,x,y);
const info=read('MapInfos');
const oldHome=info.findIndex(i=>i && i.name==='Samurai Home');
const homeId=oldHome>=0?oldHome:info.length;
const home=map(17,13,interiorSet.id,'Samurai Home');
rect(home,0,0,17,13,0,1536);
rect(home,3,3,11,7,0,1552);
rect(home,3,2,11,1,1,/* wood wall, A4 kind 105 */2048+105*48);
for(let x=3;x<14;x++)put(home,x,2,1,2048+105*48+(x===3?1:0)+(x===13?4:0)+2+8);
rect(home,8,10,1,1,0,1553);
prop(home,6,5,0,1,2,1);prop(home,6,6,3,0);prop(home,10,4,3,1);prop(home,11,4,2,0);
prop(home,4,3,2,1,1,2);
event(village,'Enter home',5,6,[{code:201,indent:0,parameters:[0,homeId,8,9,8,0]}],1);
event(village,'Storage shed',19,6,message('The storage shed is locked. Supplies are stacked outside.'));
event(village,'Southern path',12,17,message('A quiet village morning. The road beyond will come later.'));
event(home,'Return to courtyard',8,10,[{code:201,indent:0,parameters:[0,1,5,7,2,0]}],1);
event(home,'Low table',6,5,message('A simple room, a steady blade, and a new beginning.'),0,1);
info[1]={...info[1],name:'Village Courtyard',expanded:true,scrollX:600,scrollY:456};
info[homeId]={id:homeId,name:'Samurai Home',parentId:1,order:2,expanded:false,scrollX:408,scrollY:312};
const system=read('System');system.startMapId=1;system.startX=12;system.startY=12;
// Preserve the separately installed sparring encounter when rebuilding the layout.
for(const e of template.events.filter(e=>e && e.note==='wws:samurai-sparring')) {
  const retained=structuredClone(e);retained.id=village.events.length;village.events.push(retained);
}
write('Tilesets',sets);write('Map001',village);write('Map'+String(homeId).padStart(3,'0'),home);write('MapInfos',info);write('System',system);
// Validate engine-style passage, navigation, references, and transfer destinations.
function passage(m,x,y,bit=15){const flags=sets[m.tilesetId].flags;for(let z=3;z>=0;z--){const f=flags[get(m,x,y,z)];if(f&16)continue;if((f&bit)===0)return true;if((f&bit)===bit)return false;}return false;}
function reachable(m,sx,sy,tx,ty){const queue=[[sx,sy]],seen=new Set([sx+','+sy]);for(let i=0;i<queue.length;i++){const [x,y]=queue[i];if(x===tx&&y===ty)return true;for(const [dx,dy,bit,reverse]of [[0,1,1,8],[-1,0,2,4],[1,0,4,2],[0,-1,8,1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(nx<0||ny<0||nx>=m.width||ny>=m.height||seen.has(k))continue;if(passage(m,x,y,bit)&&passage(m,nx,ny,reverse)){seen.add(k);queue.push([nx,ny]);}}}return false;}
for(const m of [village,home]){if(m.data.length!==m.width*m.height*6)throw Error('Invalid layers');for(const name of sets[m.tilesetId].tilesetNames)if(name&&!fs.existsSync(path.join(root,'img/tilesets',name+'.png')))throw Error('Missing tileset '+name);}
const mapsById={1:village,[homeId]:home};
for(const m of [village,home])for(const e of m.events.filter(Boolean))for(const page of e.pages)for(const command of page.list){
  if(command.code!==201)continue;
  const [,id,x,y]=command.parameters, destination=mapsById[id];
  if(!destination||x<0||y<0||x>=destination.width||y>=destination.height||!passage(destination,x,y))throw Error('Invalid transfer destination');
}
if(!passage(village,12,12)||!reachable(village,12,12,5,6)||!reachable(village,12,12,19,6)||!reachable(village,12,12,12,17))throw Error('Courtyard navigation failed');
if(!passage(home,8,9)||!reachable(home,8,9,8,10))throw Error('Home navigation failed');
console.log(JSON.stringify({village:[25,19],home:[17,13],homeId,tilesets:[exteriorSet.id,interiorSet.id],spawn:[12,12],navigation:'passed'}));
// Keep the installed custom exterior when intentionally regenerating the starter layout.
if(sets.some(s=>s && /^EdoRedWoodExterior_D-v[123]$/.test(s.tilesetNames[7])))require('./place-red-wood-home.cjs');
require('./clean-starter-map.cjs');
if(fs.existsSync(path.join(root,'img/tilesets/EdoRedWoodExterior_D-v3.png')))require('./shape-dojo-courtyard.cjs');
