const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=n=>JSON.parse(fs.readFileSync(path.join(root,'data',n+'.json'),'utf8'));
const map=read('Map001'),enemies=read('Enemies'),troops=read('Troops');
const event=map.events.find(e=>e?.note==='wws:legendary-ronin');assert(event);
assert.equal(event.name,'Legendary Ronin');assert.deepEqual([event.x,event.y],[18,8]);
const page=event.pages[0],list=page.list,battle=list.find(c=>c.code===301);
assert.equal(page.trigger,0);assert.equal(page.priorityType,1);assert.equal(page.through,false);
assert.equal(page.image.characterName,'$StrawHatRonin-v1');assert.equal(page.image.pattern,1);
const troop=troops[battle.parameters[1]],enemy=enemies[troop.members[0].enemyId];
assert(troop.name.includes('[WWS Duel]')&&troop.name.includes('[WWS Courtyard]'));
assert(!troop.name.includes('[Bleeding]'));assert.equal(troop.members.length,1);
assert.equal(enemy.name,'Legendary Ronin');assert.equal(enemy.exp,0);assert.equal(enemy.gold,0);
assert(enemy.dropItems.every(d=>d.kind===0));
assert(enemy.params[0]>enemies[7].params[0]);assert(enemy.params[2]>enemies[7].params[2]);
for(const [folder,name,w,h] of [['characters',page.image.characterName,192,352],['enemies',enemy.battlerName,288,288]]){
 const png=fs.readFileSync(path.join(root,'img',folder,name+'.png'));
 assert.equal(png.readUInt32BE(16),w);assert.equal(png.readUInt32BE(20),h);assert.equal(png[25],6);
}
function branch(choice,result){
 const calls={texts:[],battles:0,recoveries:0};
 const context=vm.createContext({console,Graphics:{frameCount:0},ImageManager:{loadFace(){}},Scene_Battle:function(){},
  $dataTroops:troops,$gameMap:{mapId:()=>1},$gamePlayer:{makeEncounterCount(){}},$gameActors:{actor:()=>null},
  $gameParty:{inBattle:()=>false,members:()=>[{recoverAll(){calls.recoveries++}}]},
  $gameMessage:{isBusy:()=>false,setFaceImage(){},setBackground(){},setPositionType(){},setSpeakerName(){},
   add:t=>calls.texts.push(t),setChoices(){},setChoiceBackground(){},setChoicePositionType(){},setChoiceCallback:fn=>fn(choice)},
  BattleManager:{setup:(id,escape,lose)=>{assert.equal(id,troop.id);assert(escape&&lose);calls.battles++},setEventCallback:fn=>fn(result)},
  SceneManager:{push(){}},listJson:JSON.stringify(list)});
 vm.runInContext('Array.prototype.clone=function(){return this.slice()}',context);
 vm.runInContext(fs.readFileSync(path.join(root,'js/rmmz_objects.js'),'utf8'),context);
 vm.runInContext('const i=new Game_Interpreter();i.setup(JSON.parse(listJson),13);let steps=0;while(i.isRunning()){if(++steps>100)throw Error("Stalled event");i.executeCommand()}',context);
 assert.equal(calls.battles,choice===1?0:1);assert.equal(calls.recoveries,choice===1?0:2);
 const expected=choice===1?'Then let your blades rest. I will be here.':[
  'Well struck. You have earned my respect.','A measured retreat is wisdom.','Rest. Learn from each opening you gave me.'][result];
 assert(calls.texts.includes(expected));
 return {choice,result,battles:calls.battles,recoveries:calls.recoveries};
}
const branches=[branch(1,0),branch(0,0),branch(0,1),branch(0,2)];
const {context,run}=require('./lib/duel-harness.cjs')({feedback:true});
context.roninTroopId=troop.id;
run(`
reset(roninTroopId,true);
assert(BattleManager._wwsDuel.sparring);assert(!BattleManager._wwsDuel.multi);
assert.equal(BattleManager._wwsDuel.battlers.length,2);
const ronin=$gameTroop.members()[0],hero=WwsDuelRules.actor();
assert.equal(ronin.mhp,1400);assert.equal(WwsDuelRules.enemySpriteSet(ronin),'LegendaryRonin');
for(const stance of WwsDuelRules.availableStances(ronin)){
 ronin._wws.stance=stance;
 assert.equal(ronin.battlerName(),'StrawHatRonin-v2');
 const layout=WwsDuelRules.spriteLayout(ronin);assert.equal(layout.scale,1);assert.equal(layout.height,288);
}
for(const reaction of ['Parry','Dodge']){
 ronin._wws.reaction=reaction;assert.equal(ronin.battlerName(),'StrawHatRonin-v2');
}
ronin._wws.reaction=null;
assert.deepEqual(WwsDuelRules.availableStances(ronin),['Two Sword']);
assert.equal(WwsDuelRules.enemyStance(ronin,0),'Two Sword');
hero.setHp(0);assert.equal(hero.hp,1);assert(hero.isAlive());
ronin.setHp(0);assert(ronin.isDead());assert(BattleManager.checkBattleEnd());
reset(roninTroopId);let escaped=null;BattleManager.setEventCallback(r=>escaped=r);
BattleManager.endBattle(1);assert.equal(escaped,1);
`);
run(`
function prepareTwoSword(){
 reset(roninTroopId);
 const d=BattleManager._wwsDuel,[a,e]=d.battlers;
 assert.equal(e._wws.stance,'Two Sword');
 d.pending=[a];d.mode='advance';d.activeBattler=e;BattleManager._subject=e;
 WwsDuelFeedback.events=[];
 return {d,a,e};
}
let combinations=0;
for(const kind of ['Quick Cut','Heavy Cut'])for(const area of ['Head','Torso','Arms','Legs']){
 for(const first of ['Hit','Parry','Dodge'])for(const second of ['Hit','Parry','Dodge']){
  const {d,a,e}=prepareTwoSword(),round=d.round;
  const expectedRolls=[{defense:first},...(first==='Hit'?[{wound:.1}]:[]),
   {defense:second},...(second==='Hit'?[{wound:.99}]:[])];
  let defenseRolls=0,woundRolls=0;
  Math.random=()=>{
   const step=expectedRolls.shift();assert(step,'No extra random rolls in the two-cut action');
   if('wound' in step){woundRolls++;return step.wound;}
   defenseRolls++;
   const chances=WwsDuelRules.defenseChances(a,e,kind==='Heavy Cut',area);
   return step.defense==='Hit'?.999:step.defense==='Parry'?0:chances.Parry+chances.Dodge/2;
  };
  const before=a.hp,firstDamage=WwsDuelRules.damage(e,a,kind==='Heavy Cut',area);
  BattleManager.wwsChooseAction(kind,area);
  assert.equal(d.twoSwordStrike,1);assert.equal(d.defense,first==='Hit'?null:first);
  BattleManager.updateAction();
  assert.equal(a.hp,first==='Hit'?Math.max(1,before-firstDamage):before);
  const middle=a.hp,secondDamage=WwsDuelRules.damage(e,a,kind==='Heavy Cut',area);
  BattleManager.updateAction();
  assert.equal(BattleManager._phase,'action');assert.equal(BattleManager._subject,e);
  assert.equal(d.twoSwordStrike,2);assert.equal(d.kind,kind);assert.equal(d.area,area);
  assert.equal(d.defense,second==='Hit'?null:second);assert.equal(a._wws.reaction,null);
  BattleManager.updateAction();
  assert.equal(a.hp,second==='Hit'?Math.max(1,middle-secondDamage):middle);
  BattleManager.updateAction();
  assert.equal(BattleManager._phase,'wws');assert.equal(d.mode,'advance');
  assert.equal(d.twoSwordStrike,0);assert.equal(BattleManager._subject,null);
  assert.equal(defenseRolls,2);assert.equal(woundRolls,Number(first==='Hit')+Number(second==='Hit'));
  assert.equal(expectedRolls.length,0);assert.equal(d.round,round);assert.deepEqual(d.pending,[a]);
  assert.equal(e._wws.recovery,kind==='Heavy Cut'?8:0);assert.equal(e._wws.stance,'Two Sword');
  const impacts=WwsDuelFeedback.events.filter(v=>v.type==='impact');
  assert.equal(impacts.length,2);assert.deepEqual(impacts.map(v=>v.twoSwordStrike),[1,2]);
  assert.deepEqual(impacts.map(v=>v.defense),[first==='Hit'?null:first,second==='Hit'?null:second]);
  combinations++;
 }
}
assert.equal(combinations,72);
// Fixed-stance AI must attack even in the former 20% stance-change range.
for(const roll of [0,.01,.19,.2,.5,.99]){
 const {d,a,e}=prepareTwoSword();d.pending=[e,a];Math.random=()=>roll;
 BattleManager.wwsNext();
 assert.equal(d.mode,'animation');assert.equal(d.twoSwordStrike,1);
 assert.equal(e._wws.stance,'Two Sword');assert.notEqual(d.kind,'Change Stance');
 resolve();assert.equal(WwsDuelFeedback.events.filter(v=>v.type==='impact').length,2);
}
// Both hits remain protected at one HP. A lethal test stops after a killing cut.
{
 const {d,a}=prepareTwoSword();a.setHp(1);Math.random=()=>.999;
 BattleManager.wwsChooseAction('Heavy Cut','Torso');resolve();
 assert.equal(a.hp,1);assert(a.isAlive());
 assert.equal(WwsDuelFeedback.events.filter(v=>v.type==='impact').length,2);
}
{
 const {d,a}=prepareTwoSword();d.sparring=false;a.setHp(1);Math.random=()=>.999;
 BattleManager.wwsChooseAction('Quick Cut','Torso');resolve();assert(a.isDead());
 assert.equal(WwsDuelFeedback.events.filter(v=>v.type==='impact').length,1);assert.equal(d.twoSwordStrike,0);
}
{
 const {d,a,e}=prepareTwoSword();Math.random=()=>0;
 BattleManager.wwsChooseAction('Quick Cut','Torso');BattleManager.updateAction();e.setHp(0);resolve();
 assert.equal(WwsDuelFeedback.events.filter(v=>v.type==='impact').length,1);
}
// Rapid presentation: one wind-up, separate impacts, and short log/motion waits.
{
 const {d,a,e}=prepareTwoSword();const battleLog=new Window_BattleLog();
 battleLog.methods=[];battleLog.push=function(...args){this.methods.push(args)};
 d.twoSwordStrike=1;battleLog.startAction(e,{},[a]);
 assert(battleLog.methods.some(v=>v[0]==='performActionStart'));assert.equal(battleLog.messageSpeed(),2);
 battleLog.methods=[];d.twoSwordStrike=2;battleLog.startAction(e,{},[a]);
 assert.deepEqual(battleLog.methods.map(v=>v[0]),['performAction']);
 WwsDuelFeedback.scene={};
 for(const defense of [null,'Parry','Dodge']){
  WwsDuelFeedback.impact({subject:e,target:a,defense,heavy:true,twoSwordStrike:2});
  assert.equal(WwsDuelFeedback.motionFrames,4);assert(WwsDuelFeedback.hitStop<=1);
 }
 WwsDuelFeedback.scene=null;
 BattleManager.endBattle(1);reset(6);assert.equal(BattleManager._wwsDuel.twoSwordStrike,undefined);
}
`);
console.log(JSON.stringify({eventId:event.id,enemyId:enemy.id,troopId:troop.id,branches,twoStrikeCombinations:72,combat:'passed'}));
