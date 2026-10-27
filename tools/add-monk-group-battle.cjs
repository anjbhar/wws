const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,'data',name+'.json'),'utf8'));
const enemies=read('Enemies'),troops=read('Troops'),map=read('Map001'),system=read('System');
const variants=[['Masked','WarriorMonkMasked'],['Unmasked','WarriorMonkUnmasked']];
const ids=[];
for(const [variant,set] of variants){
 const file=`WarriorMonk-${variant}-v2`;
 const png=fs.readFileSync(path.join(root,'img/enemies',file+'.png'));
 assert.equal(png.readUInt32BE(16),288);assert.equal(png.readUInt32BE(20),384);
 const previous=enemies.find(e=>e&&e.note.includes(`<DuelSprite: ${set}>`));
 const id=previous?.id||enemies.length;ids.push(id);
 enemies[id]={...structuredClone(enemies[6]),id,name:variant+' Monk',battlerName:file,
  params:[280,0,24,18,12,16,variant==='Masked'?25:26,20],
  note:`<DuelSprite: ${set}>\n<DuelStaticSprite: ${file}>\nIntroductory protected three-opponent courtyard practice. No rewards.`};
}
const previous=troops.find(t=>t&&t.name.includes('[WWS Monk Group]'));
const troopId=previous?.id||troops.length;
troops[troopId]={...structuredClone(troops[6]),id:troopId,
 name:'Warrior Monks — Group Practice [WWS Duel] [WWS Courtyard] [WWS Monk Group]',
 members:[ids[0],ids[1],ids[0]].map((enemyId,i)=>({enemyId,x:614+i*256,y:420,hidden:false}))};
const command=(code,indent=0,parameters=[])=>({code,indent,parameters});
const message=(text,indent=0,speaker='Warrior Monks')=>[command(101,indent,['',0,0,2,speaker]),...text.split('\n').map(line=>command(401,indent,[line]))];
const list=[...message('A steady mind is as important as a steady blade.\nCome, let us see how you fight alongside your companions.',0,'Warrior Monk'),
 command(314,0,[0,0]),command(301,0,[0,troopId,true,true]),
 command(601),command(314,1,[0,0]),...message('Well fought. You kept all three opponents in sight.',1),
 command(602),command(314,1,[0,0]),
 command(603),command(314,1,[0,0]),
 command(604),command(0)];
let changed=false;
for(const variant of ['unmasked']){
 const e=map.events.find(e=>e&&e.note==='wws:warrior-monk-'+variant);assert(e);
 for(const page of e.pages){if(JSON.stringify(page.list)!==JSON.stringify(list)){page.list=structuredClone(list);changed=true;}}
}
if(changed)system.versionId++;
for(const [name,value] of Object.entries({Enemies:enemies,Troops:troops,Map001:map,System:system}))
 fs.writeFileSync(path.join(root,'data',name+'.json'),JSON.stringify(value));
console.log(JSON.stringify({troopId,enemyIds:ids,events:map.events.filter(e=>e&&e.note.startsWith('wws:warrior-monk-')).map(e=>e.id),changed}));
