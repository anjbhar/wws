const {context,run}=require('./lib/duel-harness.cjs')({feedback:true});
context.teamTroopId=context.$dataTroops.find(t=>t?.name.includes('[WWS Monk Group]')).id;
run(`
const originalRandom=Math.random;
let d,allies,enemies;
function team(opening=false){reset(teamTroopId,opening);d=BattleManager._wwsDuel;allies=d.allies;enemies=WwsDuelRules.enemies();}
function giveTurn(b){d.pending=[b];d.mode='advance';BattleManager.wwsNext();}
$gameParty._inBattle=false;BattleManager.setup(teamTroopId,true,true);
assert.equal(BattleManager._wwsDuel.allies.length,3);assert.equal($gameParty.members().length,1);assert.equal($gameParty.battleMembers().length,1,'No clones appear during the map encounter transition');
team(true);
assert.equal(d.battlers.length,6);assert.equal(allies.length,3);assert.equal(new Set(allies).size,3);
assert.deepEqual($gameParty._actors,[1]);assert.equal($gameParty.members().length,3);
assert.equal(d.mode,'openingDialogue');assert($gameMessage.allText().includes('Centers can attack anyone'));
$gameMessage.clear();BattleManager.updatePhase(true);
for(let i=0;i<3;i++){
 assert.equal(BattleManager._subject,allies[i]);assert.equal(WwsDuelRules.actor(),allies[i]);
 assert.equal(d.round,0);assert.equal(d.pending.length,0);
 BattleManager.wwsChooseStance(['Jodan','Chudan','Waki'][i]);
 assert.equal(d.opening,i<2);
}
assert.equal(d.round,1);assert.equal(new Set(d.order).size,6);assert.equal(d.pending.length,6);
assert.deepEqual(allies.map(b=>b._wws.stance),['Jodan','Chudan','Waki']);
for(const b of allies.slice(1)){
 assert.notEqual(b._wws,allies[0]._wws);assert.notEqual(b._equips,allies[0]._equips);
 assert.deepEqual(b._paramPlus,allies[0]._paramPlus);assert.deepEqual(b.equips(),allies[0].equips());
 assert.equal(b.level,allies[0].level);for(let p=0;p<8;p++)assert.equal(b.param(p),allies[0].param(p));
}
assert.deepEqual(allies.map(b=>b.index()),[0,1,2]);
const expectedAllies=[[0,1,2],[0,1],[1,2]],expectedEnemies=[[0,1],[0,1,2],[0,2]];
allies.forEach((b,i)=>assert.deepEqual(WwsDuelRules.legalTargets(b).map(t=>enemies.indexOf(t)),expectedAllies[i]));
enemies.forEach((b,i)=>assert.deepEqual(WwsDuelRules.legalTargets(b).map(t=>allies.indexOf(t)),expectedEnemies[i]));
// Every ally's own turn, stance change and action use that ally's state.
team();giveTurn(allies[1]);assert.equal(d.mode,'action');
BattleManager.wwsChooseAction('Change Stance');BattleManager.wwsChooseStance('Jodan');
assert.equal(allies[1]._wws.stance,'Jodan');assert.equal(allies[0]._wws.stance,'Chudan');
giveTurn(allies[1]);Math.random=()=>.99;
BattleManager.wwsChooseAction('Heavy Cut');assert.equal(d.mode,'opponent');
const health=d.battlers.map(b=>b.hp);
BattleManager.wwsChooseOpponent(enemies[2].index());assert.equal(d.mode,'opponent');assert.deepEqual(d.battlers.map(b=>b.hp),health);
BattleManager.wwsChooseOpponent(enemies[0].index());assert.equal(d.mode,'target');
BattleManager.wwsCancelTarget();assert.equal(d.mode,'opponent');BattleManager.wwsCancelTarget();assert.equal(d.mode,'action');
assert.equal(allies[1]._wws.recovery,0);
BattleManager.wwsChooseAction('Heavy Cut');BattleManager.wwsChooseOpponent(enemies[0].index());BattleManager.wwsChooseTarget('Torso');
assert.equal(BattleManager._action.subject(),allies[1]);assert.deepEqual(BattleManager._targets,[enemies[0]]);
resolve();assert(enemies[0].isDead());assert.equal(allies[1]._wws.recovery,8);assert.equal(allies[0]._wws.recovery,0);
assert(enemies[1].isAlive()&&enemies[2].isAlive());
// The mirrored flank AI can hit its opposite clone, never the distant flank.
team();Math.random=()=>.99;giveTurn(enemies[0]);
assert.equal(d.target,allies[1]);assert.equal(BattleManager._targets[0],allies[1]);resolve();
assert(allies[1].hp<allies[1].mhp);assert.equal(allies[0].hp,allies[0].mhp);assert.equal(allies[2].hp,allies[2].mhp);
team();Math.random=()=>.99;giveTurn(enemies[2]);assert.equal(d.target,allies[2]);resolve();
assert(allies[2].hp<allies[2].mhp);assert.equal(allies[1].hp,allies[1].mhp);
// Fallen centers do not unlock attacks against the far flank.
team();d.sparring=false;allies[0].setHp(0);enemies[1].setHp(0);
assert.deepEqual(WwsDuelRules.legalTargets(allies[1]),[enemies[0]]);
assert.deepEqual(WwsDuelRules.legalTargets(allies[2]),[enemies[2]]);
enemies[0].setHp(0);assert.deepEqual(WwsDuelRules.legalTargets(allies[1]),[]);
giveTurn(allies[1]);assert.equal(d.mode,'advance');assert.equal(BattleManager._subject,null);
d.pending=[allies[0],allies[2]];BattleManager.wwsNext();assert.equal(BattleManager._subject,allies[2]);
allies[2].setHp(0);assert(BattleManager.checkBattleEnd());assert.equal(d.mode,'finished');
assert($gameMessage.allText().includes('draw'));$gameMessage.clear();
// All protected practice allies share the same nonlethal floor.
team();for(const b of allies){b.setHp(0);assert.equal(b.hp,1);assert(b.isAlive());}
const previous=allies.slice();BattleManager.endBattle(1);assert(previous.every(b=>!b._wws));
$gameParty.onBattleEnd();assert.equal($gameParty.members().length,1);assert.equal($gameParty.battleMembers().length,1);assert.deepEqual($gameParty._actors,[1]);
reset(6);assert.equal(BattleManager._wwsDuel.allies.length,1);assert.equal(BattleManager._wwsDuel.battlers.length,2);
// Resolve complete six-fighter fights through actual MZ actions and AI.
let seed=934018;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const allyTurns=new Set(),enemyTargets=new Set();
const originalInvoke=BattleManager.invokeAction;
BattleManager.invokeAction=function(subject,target){
 assert(WwsDuelRules.legalTargets(subject).includes(target));
 if(subject.isEnemy())enemyTargets.add(allies.indexOf(target));
 return originalInvoke.call(this,subject,target);
};
for(let battle=0;battle<80;battle++){
 team();let result=null;BattleManager.setEventCallback(value=>result=value);
 for(let step=0;d.mode!=='finished';step++){
  if(step>20000)throw Error('Team fight stalled');
  if(BattleManager._phase==='action'){
   const b=BattleManager._subject;assert(WwsDuelRules.legalTargets(b).includes(d.target));
   if(b.isEnemy())enemyTargets.add(allies.indexOf(d.target));
   resolve();continue;
  }
  if(d.mode==='action'){
   allyTurns.add(allies.indexOf(BattleManager._subject));BattleManager.wwsChooseAction('Quick Cut');
  }
  if(d.mode==='opponent'){
   const targets=WwsDuelRules.legalTargets();BattleManager.wwsChooseOpponent(targets[battle%targets.length].index());
  }
  if(d.mode==='target'){
   const actor=WwsDuelRules.actor(),target=WwsDuelRules.playerTarget(),areas=['Head','Torso','Arms','Legs'];
   areas.sort((a,b)=>WwsDuelRules.defense(target,actor,false,a)-WwsDuelRules.defense(target,actor,false,b));
   BattleManager.wwsChooseTarget(areas[0]);
  }
  tick(90);
 }
 assert.equal(result,0);assert(enemies.every(b=>b.isDead()));assert(allies.every(b=>b.hp>=1));assert(d.battlers.every(b=>!b._wws));
 $gameParty.onBattleEnd();assert.equal($gameParty.members().length,1);
}
assert.equal(allyTurns.size,3);assert.equal(enemyTargets.size,3);
BattleManager.invokeAction=originalInvoke;
Math.random=originalRandom;
console.log('PASS: actual 3v3 clones, three free opening forms, six turns, mirrored lane targets, illegal-target rejection, independent actions/states, AI hits both clones, dead/blocked fighters, draw handling, practice protection, party cleanup and 80 complete seeded team battles');
`);
