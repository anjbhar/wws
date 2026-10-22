const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=n=>JSON.parse(fs.readFileSync(path.join(root,'data',n+'.json'),'utf8'));
const map=read('Map001'),enemies=read('Enemies'),troops=read('Troops');
const troop=troops.find(t=>t&&t.name.includes('[WWS Monk Group]'));assert(troop);
assert.equal(troop.members.length,3);assert.notEqual(troop.members[0].enemyId,troop.members[1].enemyId);
assert.equal(troop.members[0].enemyId,troop.members[2].enemyId);
assert(troop.members[0].x<troop.members[1].x&&troop.members[1].x<troop.members[2].x);
for(const member of troop.members){const e=enemies[member.enemyId];assert.equal(e.exp,0);assert.equal(e.gold,0);assert(e.dropItems.every(i=>i.kind===0));assert(fs.existsSync(path.join(root,'img/enemies',e.battlerName+'.png')));}
assert(!map.events.some(e=>e&&e.note==='wws:warrior-monk-masked'),'Masked monk must remain battle-only');
for(const variant of ['unmasked']){
 const event=map.events.find(e=>e&&e.note==='wws:warrior-monk-'+variant);assert(event);
 const list=event.pages[0].list;
 // Run each map event through MZ's interpreter for victory, escape and loss.
 for(const result of [0,1,2]){
  const calls={battles:0,recoveries:0,texts:[]};
  const context=vm.createContext({console,Graphics:{frameCount:0},ImageManager:{loadFace(){}},Scene_Battle:function(){},
   $dataTroops:troops,$gameMap:{mapId:()=>1},$gamePlayer:{makeEncounterCount(){}},$gameParty:{inBattle:()=>false,members:()=>[{recoverAll(){calls.recoveries++}}]},
   $gameMessage:{isBusy:()=>false,setFaceImage(){},setBackground(){},setPositionType(){},setSpeakerName(){},add:t=>calls.texts.push(t)},
   BattleManager:{setup:(id,escape,lose)=>{assert.equal(id,troop.id);assert(escape&&lose);calls.battles++},setEventCallback:fn=>fn(result)},SceneManager:{push(){}}});
  vm.runInContext('Array.prototype.clone=function(){return this.slice()}',context);
  vm.runInContext(fs.readFileSync(path.join(root,'js/rmmz_objects.js'),'utf8'),context);
  context.list=list;
  vm.runInContext('const interpreter=new Game_Interpreter();interpreter.setup(list,1);let steps=0;while(interpreter.isRunning()){if(++steps>50)throw Error("Event stalled");interpreter.executeCommand()}',context);
  assert.equal(calls.battles,1);assert.equal(calls.recoveries,2);assert.equal(calls.texts.length,result===0?1:0);
 }
}
const {context,run}=require('./lib/duel-harness.cjs')({feedback:true});
context.groupTroopId=troop.id;
run(`
// Retain the original one-ally group regression; the full monk encounter's
// temporary team and lane restrictions are covered by check-team-battle.cjs.
$dataTroops[groupTroopId].name=$dataTroops[groupTroopId].name.replace('[WWS Monk Group]','');
const originalRandom=Math.random;
reset(groupTroopId,true);
let d=BattleManager._wwsDuel;assert(d.multi&&d.sparring);assert.equal(d.battlers.length,4);
const allySlots=[0,1,2].map(i=>WwsDuelRules.formationSlot('allies',i,1280,720));
const enemySlots=[0,1,2].map(i=>WwsDuelRules.formationSlot('enemies',i,1280,720));
assert.equal(new Set([...allySlots,...enemySlots].map(p=>p.x+','+p.y)).size,6);
assert(Math.min(...enemySlots.map(p=>p.x))-Math.max(...allySlots.map(p=>p.x))>400,'Leave the center open for attacks');
assert(enemySlots[1].x<enemySlots[0].x&&enemySlots[1].x<enemySlots[2].x,'Unmasked monk leads the enemy formation');
for(const p of [...allySlots,...enemySlots])assert(p.y>360&&p.y<570,'All six slots stay between the HUD and command cards');
for(const [ally,enemy] of [[0,1],[1,0],[2,2]])assert(allySlots[ally].y>enemySlots[enemy].y,'Allies stand just closer than their opposite opponents');
assert(allySlots[0].y-enemySlots[1].y>=24&&allySlots[0].y-enemySlots[1].y<80,'Lead fighters stay close with a slight depth offset');
for(const p of enemySlots)assert(p.y-384*.74>=180,'The full monk artwork clears the stacked health bars');
assert.equal(d.mode,'openingDialogue');assert($gameMessage.allText().includes('one turn per round'));
assert.equal(d.round,0);assert.equal(d.pending.length,0);
$gameMessage.clear();BattleManager.updatePhase(true);assert.equal(d.mode,'stance');
const rolls=[.21,.87,.45];Math.random=()=>rolls.shift();BattleManager.wwsChooseStance('Chudan');
assert.equal(d.battlers[1]._wws.stance,'Jodan');assert.equal(d.battlers[2]._wws.stance,'Waki');
assert.equal(new Set(d.order).size,4);assert.equal(d.pending.length,4);assert.equal(d.round,1);

reset(groupTroopId);d=BattleManager._wwsDuel;let [a,masked,unmasked,maskedRight]=d.battlers;
assert.notEqual(masked._wws,maskedRight._wws);
for(const b of [masked,unmasked,maskedRight]){
 assert.equal(WwsDuelRules.spriteLayout(b).height,384);
 for(const stance of WwsDuelRules.stances){b._wws.stance=stance;assert.equal(b.battlerName(),b.enemy().battlerName);assert.equal(WwsDuelRules.spriteLayout(b).scale,.74);}
 b._wws.stance='Chudan';
}
d.pending=[a];BattleManager.wwsNext();assert.equal(d.mode,'action');
const health=d.battlers.map(b=>b.hp);
Math.random=()=>{throw Error('Target browsing must not roll randomness')};
BattleManager.wwsChooseAction('Heavy Cut');assert.equal(d.mode,'opponent');
BattleManager.wwsChooseOpponent(99);assert.equal(d.mode,'opponent');
BattleManager.wwsChooseOpponent(unmasked.index());assert.equal(d.mode,'target');assert.equal(WwsDuelRules.playerTarget(),unmasked);
BattleManager.wwsCancelTarget();assert.equal(d.mode,'opponent');
BattleManager.wwsCancelTarget();assert.equal(d.mode,'action');assert.equal(a._wws.recovery,0);
assert.deepEqual(d.battlers.map(b=>b.hp),health);

Math.random=()=>.99;
BattleManager.wwsChooseAction('Heavy Cut');BattleManager.wwsChooseOpponent(unmasked.index());BattleManager.wwsChooseTarget('Torso');
assert.equal(d.target,unmasked);assert.equal(BattleManager._targets[0],unmasked);resolve();
assert(unmasked.isDead());assert.equal(masked.hp,masked.mhp);assert.equal(a.hp,a.mhp);assert.equal(a._wws.recovery,8);
assert.equal(BattleManager.checkBattleEnd(),false,'Victory waits for all three monks');
// The duplicate masked enemy must be selectable independently by troop index.
d.pending=[a];BattleManager.wwsNext();BattleManager.wwsChooseAction('Heavy Cut');
BattleManager.wwsChooseOpponent(maskedRight.index());BattleManager.wwsChooseTarget('Torso');resolve();
assert(maskedRight.isDead());assert.equal(masked.hp,masked.mhp);
assert.equal(BattleManager.checkBattleEnd(),false);
// Skip a defeated monk already waiting in this round. The surviving monk hits
// the player, never his teammate, and receives exactly one scheduled action.
d.pending=[unmasked,masked];d.mode='advance';BattleManager.wwsNext();
assert.equal(BattleManager._subject,masked);assert.equal(d.target,a);assert.equal(d.pending.length,0);
resolve();assert(a.hp<a.mhp);assert.equal(masked.hp,masked.mhp);
d.pending=[a];BattleManager.wwsNext();BattleManager.wwsChooseAction('Quick Cut');
assert.equal(d.mode,'target','One surviving opponent skips redundant selection');
assert.equal(WwsDuelRules.playerTarget(),masked);BattleManager.wwsCancelTarget();assert.equal(d.mode,'action');
// Practice floor belongs only to the player. Victory and escape both clean up.
a.setHp(0);assert.equal(a.hp,1);assert(a.isAlive());
let outcome=null;BattleManager.setEventCallback(result=>outcome=result);
BattleManager.wwsChooseAction('Heavy Cut');BattleManager.wwsChooseTarget('Torso');resolve();
assert(masked.isDead());assert(BattleManager.checkBattleEnd());assert.equal(outcome,0);
assert(d.battlers.every(b=>!b._wws));

reset(groupTroopId);d=BattleManager._wwsDuel;[a,masked,unmasked,maskedRight]=d.battlers;
// Equal-speed initiative rotates priority across all four combatants.
for(const b of d.battlers)Object.defineProperty(b,'agi',{configurable:true,value:20});
d.round=0;BattleManager.startInput();
assert.deepEqual(d.order,[a,masked,unmasked,maskedRight]);
BattleManager.startInput();assert.deepEqual(d.order,[masked,unmasked,maskedRight,a]);
BattleManager.startInput();assert.deepEqual(d.order,[unmasked,maskedRight,a,masked]);
BattleManager.startInput();assert.deepEqual(d.order,[maskedRight,a,masked,unmasked]);
for(const b of d.battlers)delete b.agi;
BattleManager.endBattle(1);assert(d.battlers.every(b=>!b._wws));
// Play complete seeded fights through real actions and initiative, choosing
// both target indices over the sample and letting both opponents use their AI.
let seed=482193;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
for(let battle=0;battle<60;battle++){
 reset(groupTroopId);d=BattleManager._wwsDuel;let result=null;
 BattleManager.setEventCallback(value=>result=value);
 for(let steps=0;d.mode!=='finished';steps++){
  if(steps>15000)throw Error('Group fight stalled');
  if(BattleManager._phase==='action'){resolve();continue;}
  if(d.mode==='action')BattleManager.wwsChooseAction('Quick Cut');
  if(d.mode==='opponent'){
   const targets=WwsDuelRules.enemies().filter(b=>b.isAlive());
   BattleManager.wwsChooseOpponent(targets[battle%targets.length].index());
  }
  if(d.mode==='target'){
   const target=WwsDuelRules.playerTarget();
   const areas=['Head','Torso','Arms','Legs'];
   areas.sort((x,y)=>(1-WwsDuelRules.defense(target,d.battlers[0],false,y))-(1-WwsDuelRules.defense(target,d.battlers[0],false,x)));
   BattleManager.wwsChooseTarget(areas[0]);
  }
  tick(90);
 }
 assert.equal(result,0);assert($gameTroop.members().every(b=>b.isDead()));assert(d.battlers[0].hp>=1);
}
Math.random=originalRandom;
console.log('PASS: masked monk absent from overworld, unmasked monk event/outcomes, independent forms and turns, opponent/body selection, cancellation, correct action indices, no friendly fire, dead-target skipping, practice floor, victory cleanup and 60 complete seeded group fights');
`);
