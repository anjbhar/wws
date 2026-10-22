// Add the two generated walking characters without replacing existing events.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const mapFile=path.join(root,'data/Map001.json'),systemFile=path.join(root,'data/System.json');
const map=JSON.parse(fs.readFileSync(mapFile,'utf8'));
const definitions=[
 {key:'masked',name:'Masked Warrior Monk',sheet:'$WarriorMonk-Masked-v2',x:8,y:9},
 {key:'unmasked',name:'Unmasked Warrior Monk',sheet:'$WarriorMonk-Unmasked-v2',x:10,y:9}
];
let changed=false;
for(const def of definitions){
 const png=fs.readFileSync(path.join(root,'img/characters',def.sheet+'.png'));
 assert.equal(png.readUInt32BE(16),192);assert.equal(png.readUInt32BE(20),448);
 const note='wws:warrior-monk-'+def.key;
 const old=map.events.find(e=>e&&e.note===note);
 const id=old?.id||map.events.length;
 assert(!map.events.some(e=>e&&e.id!==id&&e.x===def.x&&e.y===def.y),'Occupied monk position');
 const event={id,name:def.name,note,x:def.x,y:def.y,pages:[{
  conditions:{actorId:1,actorValid:false,itemId:1,itemValid:false,selfSwitchCh:'A',selfSwitchValid:false,switch1Id:1,switch1Valid:false,switch2Id:1,switch2Valid:false,variableId:1,variableValid:false,variableValue:0},
  image:{tileId:0,characterName:def.sheet,characterIndex:0,direction:2,pattern:1},
  moveType:0,moveSpeed:3,moveFrequency:3,moveRoute:{list:[{code:0,parameters:[]}],repeat:true,skippable:false,wait:false},
  walkAnime:true,stepAnime:false,directionFix:false,through:false,priorityType:1,trigger:0,
  list:[{code:0,indent:0,parameters:[]}]
 }]};
 if(JSON.stringify(old)!==JSON.stringify(event)){map.events[id]=event;changed=true;}
}
if(changed){
 fs.writeFileSync(mapFile,JSON.stringify(map));
 // MZ reloads map data after loading an older save when the version differs.
 const system=JSON.parse(fs.readFileSync(systemFile,'utf8'));system.versionId++;
 fs.writeFileSync(systemFile,JSON.stringify(system));
}
console.log(JSON.stringify({changed,monks:definitions}));
