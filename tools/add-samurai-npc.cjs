const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root,'data',name+'.json'),'utf8'));
const save = (name,data) => fs.writeFileSync(path.join(root,'data',name+'.json'),JSON.stringify(data));
const backup = path.join(root,'docs/battles/backups/before-samurai-npc');
fs.mkdirSync(backup,{recursive:true});
for(const name of ['Map001','Enemies','Troops','Skills','Animations']) {
  const target=path.join(backup,name+'.json');
  if(!fs.existsSync(target))fs.copyFileSync(path.join(root,'data',name+'.json'),target);
}
function entry(table,name,build) {
  const old=table.find(item=>item && item.name===name);
  const id=old?old.id:table.length;
  table[id]=build(id);return id;
}
const animations=read('Animations'),skills=read('Skills'),enemies=read('Enemies'),troops=read('Troops');
const animationId=entry(animations,'Katana Strike — Practice',id=>({...structuredClone(animations[6]),id,name:'Katana Strike — Practice'}));
const skillId=entry(skills,'Practice Katana Strike',id=>({...structuredClone(skills[1]),id,name:'Practice Katana Strike',animationId,message1:'%1 makes a controlled katana strike!',note:'NPC sparring attack. Uses the existing SlashPhysical effect.',effects:[],damage:{...skills[1].damage,critical:false}}));
const enemyId=entry(enemies,'Masanori',id=>({id,name:'Masanori',battlerName:'SamuraiInstructor-v1',battlerHue:0,params:[540,0,31,20,12,16,28,20],actions:[{conditionType:0,conditionParam1:0,conditionParam2:0,rating:5,skillId}],traits:[{code:22,dataId:0,value:0.95},{code:22,dataId:1,value:0.03},{code:31,dataId:1,value:0}],exp:0,gold:0,dropItems:Array.from({length:3},()=>({kind:0,dataId:1,denominator:1})),note:'Repeatable nonlethal courtyard sparring partner. No rewards.'}));
const troopId=entry(troops,'Masanori — Courtyard Sparring',id=>({id,name:'Masanori — Courtyard Sparring',members:[{enemyId,x:408,y:420,hidden:false}],pages:[{conditions:{actorHp:50,actorId:1,actorValid:false,enemyHp:50,enemyIndex:0,enemyValid:false,switchId:1,switchValid:false,turnA:0,turnB:0,turnEnding:false,turnValid:false},list:[{code:0,indent:0,parameters:[]}],span:0}]}));
const map=read('Map001');
const existing=map.events.find(e=>e && e.note==='wws:samurai-sparring');
const eventId=existing?existing.id:map.events.length;
const command=(code,indent,...parameters)=>({code,indent,parameters});
const text=(indent,message)=>[command(101,indent,'',0,0,2,'Masanori'),command(401,indent,message)];
const recovery=indent=>command(314,indent,0,0);
const list=[
  ...text(0,'I am Masanori. Care to test your sword against mine?'),
  ...text(0,'A friendly match. We will both leave on our feet.'),
  command(102,0,['Spar','Not now'],1,1,2,0),
  command(402,0,0,'Spar'),
  recovery(1),
  command(301,1,0,troopId,true,true),
  command(601,1),recovery(2),...text(2,'Well struck. Come back whenever you wish to practice.'),
  command(602,1),recovery(2),...text(2,'There is no shame in stepping back. Try again when ready.'),
  command(603,1),recovery(2),...text(2,'Keep your guard steady. Rest a moment, then try again.'),
  command(604,1),command(0,1),
  command(402,0,1,'Not now'),...text(1,'I will be here when you are ready.'),command(0,1),
  command(404,0),command(0,0)
];
map.events[eventId]={id:eventId,name:'Masanori — Sparring Samurai',note:'wws:samurai-sparring',x:12,y:9,pages:[{conditions:{actorId:1,actorValid:false,itemId:1,itemValid:false,selfSwitchCh:'A',selfSwitchValid:false,switch1Id:1,switch1Valid:false,switch2Id:1,switch2Valid:false,variableId:1,variableValid:false,variableValue:0},directionFix:false,image:{tileId:0,characterName:'$SamuraiInstructor-v2',characterIndex:0,direction:2,pattern:1},list,moveFrequency:3,moveRoute:{list:[{code:0,parameters:[]}],repeat:true,skippable:false,wait:false},moveSpeed:3,moveType:0,priorityType:1,stepAnime:false,through:false,trigger:0,walkAnime:true}]};
for(const [name,data]of Object.entries({Map001:map,Enemies:enemies,Troops:troops,Skills:skills,Animations:animations}))save(name,data);
console.log(JSON.stringify({eventId,position:[12,9],enemyId,troopId,skillId,animationId,battleMode:read('System').optSideView?'side-view':'front-view'}));
