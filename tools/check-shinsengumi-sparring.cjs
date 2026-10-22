const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'data', name + '.json'), 'utf8'));
const map = read('Map001'), troops = read('Troops'), enemies = read('Enemies');
const npc = map.events.find(event => event && event.note === 'wws:shinsengumi-npc');
assert(npc); assert.deepEqual([npc.x, npc.y], [16, 10]);
const page = npc.pages[0], list = page.list;
assert.equal(page.trigger, 0); assert.equal(page.priorityType, 1);
assert.equal(page.image.characterName, '$Shinsengumi-v2');
const battle = list.find(command => command.code === 301);
assert(battle); assert.equal(battle.parameters[0], 0);
assert.equal(battle.parameters[2], true); assert.equal(battle.parameters[3], true);
const troop = troops[battle.parameters[1]], enemy = enemies[troop.members[0].enemyId];
assert(troop.name.includes('[WWS Duel]') && troop.name.includes('[WWS Courtyard]'));
assert(!troop.name.includes('[Bleeding]')); assert.equal(troop.members.length, 1);
assert.equal(enemy.name, 'Shinsengumi Swordsman'); assert.equal(enemy.params[0], 1000);
assert.deepEqual(enemy.params.slice(1), enemies[6].params.slice(1));
assert.equal(enemy.exp, 0); assert.equal(enemy.gold, 0); assert(enemy.dropItems.every(item => item.kind === 0));
for (const pose of ['Chudan', 'Jodan', 'Gedan', 'Kasumi', 'Waki', 'TwoSword']) {
  const png = fs.readFileSync(path.join(root, 'img/enemies', `Shinsengumi-${pose}-v2.png`));
  assert.equal(png.readUInt32BE(16), 288); assert.equal(png.readUInt32BE(20), 288); assert.equal(png[25], 6);
}

// Exercise all saved dialogue branches through the actual MZ event interpreter.
function eventBranch(choice, result) {
  const calls = { texts: [], battles: 0, recoveries: 0 };
  const context = vm.createContext({
    console, Graphics: { frameCount: 0 }, ImageManager: { loadFace() {} }, Scene_Battle: function() {},
    $dataTroops: troops, $gameMap: { mapId: () => 1 },
    $gameParty: { inBattle: () => false, members: () => [{ recoverAll: () => calls.recoveries++ }] },
    $gamePlayer: { makeEncounterCount() {} }, $gameActors: { actor: () => null },
    $gameMessage: { isBusy: () => false, setFaceImage() {}, setBackground() {}, setPositionType() {},
      setSpeakerName() {}, add: text => calls.texts.push(text), setChoices() {}, setChoiceBackground() {},
      setChoicePositionType() {}, setChoiceCallback: fn => fn(choice) },
    BattleManager: { setup: (id, escape, lose) => { assert.equal(id, troop.id); assert(escape && lose); calls.battles++; }, setEventCallback: fn => fn(result) },
    SceneManager: { push() {} }, listJson: JSON.stringify(list)
  });
  vm.runInContext('Array.prototype.clone=function(){return this.slice()}', context);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/rmmz_objects.js'), 'utf8'), context);
  vm.runInContext(`const interpreter=new Game_Interpreter();interpreter.setup(JSON.parse(listJson),${npc.id});
    let steps=0;while(interpreter.isRunning()){if(++steps>100)throw Error('Unfinished NPC event');interpreter.executeCommand();}`, context);
  const decline = 'Another time, then. Keep your guard steady.';
  const outcomes = ['Well fought. We can cross swords again whenever you like.',
    'Take a breath. We can continue when you are ready.', 'Keep training. You will find your opening.'];
  assert.equal(calls.battles, choice === 0 ? 1 : 0);
  assert.equal(calls.recoveries, choice === 0 ? 2 : 0);
  assert.equal(calls.texts.includes(decline), choice === 1);
  for (let i = 0; i < outcomes.length; i++) assert.equal(calls.texts.includes(outcomes[i]), choice === 0 && result === i);
}
eventBranch(1, 0); eventBranch(0, 0); eventBranch(0, 1); eventBranch(0, 2);

// Actual engine combat, including opponent art, targets, damage and practice floor.
const { context, run } = require('./lib/duel-harness.cjs')({ feedback: true });
context.shinsengumiTroopId = troop.id;
run(`
// Opening speech pauses combat and leads into the free opening-form picker.
reset(shinsengumiTroopId,true);
assert.equal(BattleManager._wwsDuel.mode,'openingDialogue');
assert.equal($gameMessage.speakerName(),'Shinsengumi Swordsman');
assert($gameMessage.allText().includes('Draw your blade.'));
assert.equal($gameMessage._texts.length,2);
for(let i=0;i<120;i++)BattleManager.updatePhase(true);
assert.equal(BattleManager._wwsDuel.mode,'openingDialogue');
assert.equal(BattleManager._wwsDuel.round,0);
assert.equal($gameMessage._texts.length,2,'Opening speech only queues once');
$gameMessage.clear();BattleManager.updatePhase(true);
assert.equal(BattleManager._wwsDuel.mode,'stance');
BattleManager.startInput();assert(!$gameMessage.isBusy(),'Opening speech stays dismissed');
BattleManager.wwsChooseStance('Chudan');
assert.equal(BattleManager._wwsDuel.round,1);
BattleManager.endBattle(1);
reset(shinsengumiTroopId,true);
assert($gameMessage.isBusy(),'Opening speech returns for each new fight');
$gameMessage.clear();BattleManager.endBattle(1);
reset(shinsengumiTroopId);
let d=BattleManager._wwsDuel,[a,e]=d.battlers;
assert(d.sparring); assert(d.battlers.every(b=>b._wws.stance==='Chudan'));
assert.equal(e.mhp,1000);assert.equal(e.hp,1000);
assert.equal(WwsDuelRules.enemySpriteSet(e),'Shinsengumi');
assert.equal(WwsDuelRules.enemySpriteSet(a),null);
for(const pose of WwsDuelRules.stances){
  e._wws.stance=pose;
  assert.equal(e.battlerName(),'Shinsengumi-'+pose+'-v2');
  const regions=WwsDuelTargets.regions(e,pose);
  assert(regions && regions!==WwsDuelTargets.poses[pose]);
  for(const area of ['Head','Torso','Arms','Legs']) {
    assert(regions[area].length);
    for(const [x,y,rx,ry] of regions[area]) assert(x>0&&x<288&&y>0&&y<288&&rx>0&&ry>0);
  }
  const [x,y]=regions.Head[0];assert.equal(WwsDuelTargets.hit(pose,x,y,e),'Head');
  for(let i=0;i<4;i++)assert.equal(WwsDuelTargets.pick(pose,300,68+i*46,e),['Head','Torso','Arms','Legs'][i]);
}
e._wws.reaction='Parry';assert.equal(e.battlerName(),'Shinsengumi-Kasumi-v2');
e._wws.reaction='Dodge';assert.equal(e.battlerName(),'Shinsengumi-Waki-v2');e._wws.reaction=null;
const sideView=$dataSystem.optSideView;$dataSystem.optSideView=true;
assert.equal(e.battlerName(),e.enemy().battlerName);$dataSystem.optSideView=sideView;
e._wws.stance='Chudan';
assert.equal(WwsDuelRules.damage(a,e,false,'Torso'),140);
assert.equal(WwsDuelRules.damage(a,e,true,'Torso'),280);
const before=e.hp;d.mode='action';BattleManager._subject=a;
Math.random=()=>.99;BattleManager.wwsChooseAction('Quick Cut','Torso');
BattleManager.updateAction();resolve();assert.equal(e.hp,before-140);
assert(WwsDuelFeedback.events.some(event=>event.type==='impact'&&event.target===e&&event.damage===140));
assert.equal(e._wws.bleeding,0);
a.setHp(2);a.gainHp(-9999);assert.equal(a.hp,1);assert(a.isAlive());
// Half-health dialogue preserves the current single-sword stance and turns.
e.setHp(501);assert(!e._wws.midBattleSpoken);
e.gainHp(-1);assert(e._wws.midBattlePending);assert(!e._wws.midBattleSpoken);
assert.equal(e.battlerName(),'Shinsengumi-Chudan-v2');
const pendingTurns=d.pending.slice(),round=d.round;
assert(!$gameMessage.isBusy(),'Finish the cut before opening phase dialogue');
BattleManager.updatePhase(true);
assert.equal(d.mode,'bossDialogue');assert(!e._wws.midBattleSpoken);
assert.equal($gameMessage.speakerName(),'Shinsengumi Swordsman');
assert($gameMessage.allText().includes('A parry is only the beginning. Watch for the blade that follows.'));
assert(!$gameMessage.allText().includes('two-sword'));
for(let i=0;i<120;i++)BattleManager.updatePhase(true);
assert.equal(d.mode,'bossDialogue');assert(!e._wws.midBattleSpoken);
assert.equal(e.battlerName(),'Shinsengumi-Chudan-v2');
assert.equal($gameMessage._texts.length,2,'Dialogue must only be queued once');
assert.deepEqual(d.pending,pendingTurns);assert.equal(d.round,round);
$gameMessage.clear();BattleManager.updatePhase(true);
assert(e._wws.midBattleSpoken);assert.equal(e._wws.stance,'Chudan');
assert.equal(d.mode,'advance');assert(d.remaining>=.8);
assert.deepEqual(d.pending,pendingTurns);assert.equal(d.round,round);
assert.deepEqual(WwsDuelRules.availableStances(e),[...WwsDuelRules.stances,'Seigan']);
assert.equal(e.battlerName(),'Shinsengumi-Chudan-v2');
for(const reaction of ['Parry','Dodge',null]) {
  e._wws.reaction=reaction;assert.notEqual(e.battlerName(),'Shinsengumi-TwoSword-v2');
}
e.setHp(800);assert(e._wws.midBattleSpoken,'Dialogue must not replay after healing');
e.setHp(500);assert(!e._wws.midBattlePending);
assert.equal(WwsDuelFeedback.events.filter(event=>event.text==='TWO-SWORD GUARD').length,0);
BattleManager._subject=e;d.mode='advance';BattleManager.wwsChooseStance('Jodan');
assert.equal(e._wws.stance,'Jodan');
// He can still change forms and attack after the speech.
for(const roll of [0,.1,.19,.5,.99]) {
  d.pending=[e];Math.random=()=>roll;BattleManager.wwsNext();
  if(roll<.2 && d.kind==='Change Stance') {assert.equal(d.mode,'advance');}
  else {
    assert.equal(d.mode,'animation');assert(['Quick Cut','Heavy Cut'].includes(d.kind));
    BattleManager.updateAction();resolve();
  }
  assert.notEqual(e._wws.stance,'TwoSword');
  assert.equal(a.hp,1);assert(a.isAlive());
}
BattleManager.endBattle(1);assert.equal(BattleManager._wwsDuel.mode,'finished');assert(!a._wws&&!e._wws);
a.setHp(0);assert(a.isDead());
reset(shinsengumiTroopId);[a,e]=BattleManager._wwsDuel.battlers;
assert(!e._wws.midBattleSpoken);assert.equal(e.hp,1000);assert.equal(e._wws.stance,'Chudan');
assert(!e._wws.midBattlePending);assert(!$gameMessage.isBusy());
// A real threshold-crossing hit resolves before the dialogue or sprite change.
e.setHp(640);BattleManager._wwsDuel.mode='action';BattleManager._subject=a;
Math.random=()=>.99;BattleManager.wwsChooseAction('Quick Cut','Torso');
BattleManager.updateAction();assert.equal(e.hp,500);assert(e._wws.midBattlePending);
assert(!e._wws.midBattleSpoken);assert(!$gameMessage.isBusy());
resolve();BattleManager.updatePhase(true);assert($gameMessage.isBusy());
assert(!e._wws.midBattleSpoken);$gameMessage.clear();BattleManager.updatePhase(true);
assert(e._wws.midBattleSpoken);assert.equal(e._wws.stance,'Chudan');BattleManager.endBattle(1);
reset(shinsengumiTroopId);[a,e]=BattleManager._wwsDuel.battlers;
e.setHp(0);assert(e.isDead(),'Sparring opponent can be defeated');
BattleManager.updatePhase(true);assert(!$gameMessage.isBusy(),'No phase speech after defeat');
BattleManager.endBattle(0);
reset(6);[a,e]=BattleManager._wwsDuel.battlers;
assert.equal(e.battlerName(),'SamuraiInstructor-Chudan-v1');
assert.equal(WwsDuelTargets.regions(e,'Chudan'),WwsDuelTargets.poses.Chudan);
`);

const backdrop = vm.createContext({ assert, troop });
vm.runInContext(`function Sprite_Battleback(){this.scale={x:1,y:1};this.bitmap={width:1280,height:720}};
Sprite_Battleback.prototype.battleback1Name=()=> 'stock-ground';
Sprite_Battleback.prototype.battleback2Name=()=> 'stock-wall';
Sprite_Battleback.prototype.adjustPosition=function(){this.stock=true};
var current=troop,$gameTroop={troop:()=>current},Graphics={width:1280,height:720};`, backdrop);
vm.runInContext(fs.readFileSync(path.join(root, 'js/plugins/WWS_PracticeBackdrop.js'), 'utf8'), backdrop);
vm.runInContext(`const s=new Sprite_Battleback();assert.equal(s.battleback1Name(),'EdoPracticeCourtyard-v1');
assert.equal(s.battleback2Name(),'');s.adjustPosition();assert.equal(s.scale.x,1);assert.equal(s.bitmap.smooth,false);
current={id:1,name:'Slime'};assert.equal(s.battleback1Name(),'stock-ground');s.adjustPosition();assert(s.stock);`, backdrop);
console.log('PASS: Shinsengumi 1000 HP, opening speech/pause/replay, event/recovery, poses/targets, once-only 500 HP dialogue, preserved stance/turns, single-sword AI, archived two-sword sprite retained, real cuts/feedback, 1 HP protection, cleanup and stock fallback');
