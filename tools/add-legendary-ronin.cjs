const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,'data',name+'.json'),'utf8'));
const names=['Map001','Enemies','Troops','System'];
const backup=path.join(root,'docs/battles/backups/before-legendary-ronin');
fs.mkdirSync(backup,{recursive:true});
for(const name of names){
 const target=path.join(backup,name+'.json');
 if(!fs.existsSync(target))fs.copyFileSync(path.join(root,'data',name+'.json'),target);
}
const map=read('Map001'),enemies=read('Enemies'),troops=read('Troops'),system=read('System');
const enemyId=enemies.find(e=>e?.note.includes('<DuelSprite: LegendaryRonin>'))?.id??enemies.length;
enemies[enemyId]={...structuredClone(enemies[6]),id:enemyId,name:'Legendary Ronin',
 battlerName:'StrawHatRonin-v2',params:[1400,0,38,26,12,20,36,24],
 note:'<DuelSprite: LegendaryRonin>\n<DuelStaticSprite: StrawHatRonin-v2>\nRepeatable nonlethal courtyard boss spar. Fixed Two Sword stance; each attack strikes twice with separate defense and injury rolls. 1400 HP, 38 Attack, 26 Defense, 36 Speed. No rewards.'};
const troopId=troops.find(t=>t?.name.includes('[WWS Legendary Ronin]'))?.id??troops.length;
troops[troopId]={...structuredClone(troops[6]),id:troopId,
 name:'Legendary Ronin — Boss Spar [WWS Duel] [WWS Courtyard] [WWS Legendary Ronin]',
 members:[{enemyId,x:408,y:420,hidden:false}]};
const command=(code,indent=0,...parameters)=>({code,indent,parameters});
const text=(message,indent=0)=>[command(101,indent,'',0,0,2,'Legendary Ronin'),
 ...message.split('\n').map(line=>command(401,indent,line))];
const heal=indent=>command(314,indent,0,0);
const list=[
 ...text('They call me the Legendary Ronin.\nCare to test your blade against my two?'),
 ...text('One guard. Two blades. Expect two cuts each time.\nA spar, nothing more. I will stay my blades.\nTake your time, and leave whenever you wish.'),
 command(102,0,['Boss spar','Not now'],1,1,2,0),
 command(402,0,0,'Boss spar'),heal(1),command(301,1,0,troopId,true,true),
 command(601,1),heal(2),...text('Well struck. You have earned my respect.\nWe can cross blades again whenever you wish.',2),
 command(602,1),heal(2),...text('A measured retreat is wisdom.\nReturn when you are ready.',2),
 command(603,1),heal(2),...text('Rest. Learn from each opening you gave me.\nWe will try again when you are ready.',2),
 command(604,1),command(0,1),
 command(402,0,1,'Not now'),...text('Then let your blades rest. I will be here.',1),command(0,1),
 command(404,0),command(0,0)
];
const eventId=map.events.find(e=>e?.note==='wws:legendary-ronin')?.id??map.events.length;
assert(!map.events.some(e=>e&&e.id!==eventId&&e.x===18&&e.y===8),'Ronin tile occupied');
const template=map.events.find(e=>e?.note==='wws:samurai-sparring');
assert(template);
const page=structuredClone(template.pages[0]);
page.image={tileId:0,characterName:'$StrawHatRonin-v1',characterIndex:0,direction:2,pattern:1};
page.list=list;page.directionFix=false;page.moveType=0;page.stepAnime=false;
map.events[eventId]={id:eventId,name:'Legendary Ronin',note:'wws:legendary-ronin',x:18,y:8,pages:[page]};
let changed=false;
for(const [name,value] of Object.entries({Map001:map,Enemies:enemies,Troops:troops})){
 const file=path.join(root,'data',name+'.json'),content=JSON.stringify(value);
 if(fs.readFileSync(file,'utf8')!==content){fs.writeFileSync(file,content);changed=true;}
}
if(changed){system.versionId++;fs.writeFileSync(path.join(root,'data/System.json'),JSON.stringify(system));}
console.log(JSON.stringify({eventId,enemyId,troopId,position:[18,8],changed}));
