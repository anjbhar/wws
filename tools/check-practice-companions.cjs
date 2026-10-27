const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {context,run}=require('./lib/duel-harness.cjs')({feedback:true});
context.teamId=context.$dataTroops.find(t=>t?.name.includes('[WWS Monk Group]')).id;
run(`
const random=Math.random;
reset(teamId,true);let d=BattleManager._wwsDuel;
$gameMessage.clear();BattleManager.updatePhase(true);
const [hero,masanori,swordsman]=d.allies;
assert.deepEqual(d.allies.map(b=>b.name()),['Hayato','Masanori','Shinsengumi Swordsman']);
assert.equal(WwsDuelRules.actorSpriteSet(masanori),'SamuraiInstructor');
assert.equal(WwsDuelRules.actorSpriteSet(swordsman),'Shinsengumi');
assert(!WwsDuelRules.availableStances(hero).includes('Seigan'));
assert(!WwsDuelRules.availableStances(masanori).includes('Seigan'));
assert.deepEqual(WwsDuelRules.availableStances(swordsman),WwsDuelRules.stances.map(stance=>stance==='Chudan'?'Seigan':stance));
BattleManager.wwsChooseStance('Seigan');assert.equal(d.openingIndex,0);
BattleManager.wwsChooseStance('Chudan');BattleManager.wwsChooseStance('Seigan');assert.equal(d.openingIndex,1);
BattleManager.wwsChooseStance('Chudan');d.previewStance='Seigan';
BattleManager.wwsChooseStance('Chudan');assert.equal(d.openingIndex,2);assert.equal(swordsman._wws.stance,null);
assert.equal(WwsDuelRules.playerPose(swordsman),'Seigan');assert.equal(swordsman._wws.stance,null);
BattleManager.wwsChooseStance('Seigan');assert.equal(d.round,1);assert.equal(swordsman._wws.stance,'Seigan');
for(const ally of d.allies)for(const pose of WwsDuelRules.availableStances(ally)){
 const layout=WwsDuelRules.spriteLayout(ally,pose);assert.equal(layout.width,480);assert.equal(layout.height,384);
 assert(layout.scale>0);assert(WwsDuelRules.playerImage(ally,pose).includes(pose+'Back-'));
}
// Exercise player-originated Three Stage Thrust: hit, parry, and dodge endings.
for(const branch of ['hit','parry','dodge']){
 reset(teamId);d=BattleManager._wwsDuel;
 const ally=d.allies[2],target=WwsDuelRules.enemies()[2];
 target.addParam(0,10000);target.recoverAll();ally._wws.stance='Seigan';
 d.pending=[d.allies[0],d.allies[1]];d.mode='advance';BattleManager._subject=ally;d.activeBattler=ally;
 const pending=d.pending.slice(),round=d.round;
 Math.random=()=>0;BattleManager.wwsChooseAction('Heavy Cut');
 BattleManager.wwsChooseOpponent(target.index());BattleManager.wwsChooseTarget('Torso');
 assert.equal(d.defense,'Parry');BattleManager.updateAction();
 const chances=WwsDuelRules.defenseChances(target,ally,false,'Torso');
 Math.random=()=>branch==='hit'?.99:branch==='parry'?0:chances.Parry+chances.Dodge/2;
 BattleManager.updateAction();assert.equal(d.kind,'Three Stage Thrust');assert.equal(d.lightlessStrike,2);
 assert.equal(BattleManager._action.subject(),ally);assert.equal(d.target,target);
 BattleManager.updateAction();Math.random=()=>.99;resolve();
 const impacts=WwsDuelFeedback.events.filter(e=>e.type==='impact');
 assert.equal(impacts.length,branch==='dodge'?2:3);
 assert(impacts.every(e=>e.subject===ally&&e.target===target));
 if(impacts.length===3)assert.equal(impacts[2].defense,null);
 assert.equal(ally._wws.recovery,8);assert.equal(d.round,round);assert.deepEqual(d.pending,pending);
 assert(!ally._wws.lightlessExplanationPending);assert(!$gameMessage.isBusy());
}
Math.random=random;BattleManager.endBattle(1);$gameParty.onBattleEnd();assert.deepEqual($gameParty._actors,[1]);
assert.equal($gameParty.members().length,1);reset(6);assert.equal(BattleManager._wwsDuel.allies.length,1);
`);
const root=path.resolve(__dirname,'..');
const poseExports=[
 ...JSON.parse(fs.readFileSync(path.join(root,'docs/art/party-members/export-v1.json'),'utf8')).filter(e=>e.character==='Masanori'),
 ...JSON.parse(fs.readFileSync(path.join(root,'docs/art/party-members/shinsengumi-export-v2.json'),'utf8'))
];
assert.equal(poseExports.length,11);
for(const entry of poseExports){
 const png=fs.readFileSync(path.join(root,entry.output));assert.equal(png.readUInt32BE(16),480);assert.equal(png.readUInt32BE(20),384);
 assert.equal(png[25],6,'RGBA transparency');assert.equal(entry.visibleBounds[3],368);
 assert(entry.visibleBounds[0]>=4&&entry.visibleBounds[1]>=4&&entry.visibleBounds[2]<=476);
 const actor=context.$dataActors.find(a=>a?.note.includes(entry.character==='Masanori'?'DuelActorSprite: SamuraiInstructor':'DuelActorSprite: Shinsengumi'));
 context.checkedActorId=actor.id;context.checkedPose=entry.pose;
 const active=run('WwsDuelRules.playerImage(new Game_Actor(checkedActorId),checkedPose)');
 assert.equal(path.basename(entry.output),active+'.png','Validate the active pose version');
}
console.log('PASS: distinct practice guests, exclusive playable Seigan, preview isolation, all 11 RGBA exports, actor Three Stage Thrust branches, recovery and saved-party isolation');
