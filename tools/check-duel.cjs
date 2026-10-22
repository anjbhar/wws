// Integration tests share the real MZ harness with balance simulations.
const { run } = require('./lib/duel-harness.cjs')();
run(`
reset();
let d=BattleManager._wwsDuel,a=d.battlers[0],e=d.battlers[1],r=WwsDuelRules;
// The starting practice matchup should give the player a modest stat edge.
assert(a.mhp>e.mhp&&a.mhp<=e.mhp*1.10,'Practice Health must be close, with a small player advantage');
assert(a.atk>=e.atk&&a.atk-e.atk<=2,'Practice Attack must be comparable');
assert(a.def>=e.def&&a.def-e.def<=2,'Practice Defense must be comparable');
assert(a.agi>e.agi&&a.agi-e.agi<=2,'Practice Speed must give the player only a small edge');
assert.equal(Math.ceil(e.mhp/r.damage(a,e,false,'Torso')),4,'Four landed light torso cuts defeat Masanori');
assert.equal(Math.ceil(e.mhp/r.damage(a,e,true,'Torso')),2,'Two landed heavy torso cuts defeat Masanori');
assert.equal(Math.ceil(a.mhp/r.damage(e,a,false,'Torso')),4,'The player has the same light-cut defeat threshold');
assert.equal(Math.ceil(a.mhp/r.damage(e,a,true,'Torso')),2,'The player has the same heavy-cut defeat threshold');
for(const [area,light,heavy] of [['Head',168,336],['Torso',140,280],['Arms',119,238],['Legs',119,238]]){
    assert.equal(r.damage(a,e,false,area),light,area+' light-cut damage');
    assert.equal(r.damage(a,e,true,area),heavy,area+' heavy-cut damage');
}
assert.equal(d.mode,'reveal');assert(d.battlers.every(b=>b._wws.stance==='Chudan'));assert.equal(d.pending.length,2);
assert(a.isSpriteVisible(),'Actor 1 is visible in front-view custom duels');
const otherActor=new Game_Actor(2);assert(!otherActor.isSpriteVisible(),'Other actors keep stock visibility');
// Pose changes follow revealed stance/automatic reaction and never alter other enemies.
for(const stance of r.stances){const pose=stance;
    e._wws.stance=stance;assert.equal(e.battlerName(),'SamuraiInstructor-'+pose+'-v1');
}
e._wws.stance='Jodan';e._wws.reaction='Parry';assert.equal(e.battlerName(),'SamuraiInstructor-Kasumi-v1');
e._wws.reaction='Dodge';assert.equal(e.battlerName(),'SamuraiInstructor-Waki-v1');
e._wws.reaction=null;e._wws.stance='Chudan';
assert.equal(e.battlerName(),'SamuraiInstructor-Chudan-v1'); // The stored form controls the pose.
const savedPoseState=e._wws;delete e._wws;assert.equal(e.battlerName(),$dataEnemies[6].battlerName);e._wws=savedPoseState;
const ordinaryEnemy=new Game_Enemy(1,0,0);ordinaryEnemy._wws={stance:'Jodan'};
assert.equal(ordinaryEnemy.battlerName(),$dataEnemies[1].battlerName);
const sideView=$dataSystem.optSideView;$dataSystem.optSideView=true;
assert.equal(e.battlerName(),$dataEnemies[6].battlerName);$dataSystem.optSideView=sideView;
const originalSpeed=a.agi;const enemySpeed=e.agi;
// Exact ties alternate; recovery clears only on the next initiative calculation.
Object.defineProperty(a,'agi',{configurable:true,value:20});Object.defineProperty(e,'agi',{configurable:true,value:20});
BattleManager.startInput();assert.equal(d.order[0],e); // Round 2 gives tied enemy priority.
BattleManager.startInput();assert.equal(d.order[0],a);
r.recover(a,8);r.recover(a,3);assert.equal(a._wws.recovery,11);
BattleManager.startInput();assert.equal(d.order[0],e);assert.equal(a._wws.recovery,0);
delete a.agi;delete e.agi;
// Both stance and action choices wait indefinitely; defenses are not actions.
BattleManager.startInput();d.pending=[a];BattleManager.wwsNext();tick(12000);assert.equal(d.mode,'action');

d.pending=[a];BattleManager.wwsNext();assert.equal(d.mode,'action');
tick(12000);assert.equal(d.mode,'action');
assert.deepEqual(Array.from(r.actions),['Quick Cut','Heavy Cut']);
for(const kind of ['Guard','Block','Parry','Dodge']){BattleManager.wwsChooseAction(kind);assert.equal(d.mode,'action');assert.equal(a.numActions(),0);}
assert.equal(typeof BattleManager.wwsChooseResponse,'undefined');assert.equal(typeof BattleManager.wwsConfirm,'undefined');
// Form bonuses apply to automatic defenses, without preparing or spending an action.
a._wws.stance='Chudan';const baseline=r.defense(a,e,false);
assert(r.defense(a,e,true)>baseline);a._wws.stance='Gedan';assert(r.defenseChances(a,e,false,'Legs').Parry>.65);
a._wws.stance='Jodan';assert(r.defense(a,e,false)<baseline);
// Each stat controls its own reaction; extreme stats cannot guarantee defense.
a._wws.stance='Chudan';const rates=r.defenseChances(a,e);
assert.deepEqual(Object.keys(rates),['Parry','Dodge']);
Object.defineProperty(a,'def',{configurable:true,value:a.def+10});
assert(r.defenseChances(a,e).Parry>rates.Parry);assert.equal(r.defenseChances(a,e).Dodge,rates.Dodge);delete a.def;
Object.defineProperty(a,'agi',{configurable:true,value:a.agi+10});
assert(r.defenseChances(a,e).Dodge>rates.Dodge);assert.equal(r.defenseChances(a,e).Parry,rates.Parry);delete a.agi;
for(const value of [-10000,10000]){
    Object.defineProperty(a,'def',{configurable:true,value});Object.defineProperty(a,'agi',{configurable:true,value});
    const extreme=r.defenseChances(a,e,true,'Head');
    assert(Object.values(extreme).every(p=>Number.isFinite(p)&&p>0));assert(r.defense(a,e,true,'Head')<=.90000001);
    assert.equal(r.defenseOutcome(a,e,true,'Head',.99),null);
    delete a.def;delete a.agi;
}
const cutoffs=r.defenseChances(a,e);
assert.equal(r.defenseOutcome(a,e,false,'Torso',0),'Parry');
assert.equal(r.defenseOutcome(a,e,false,'Torso',cutoffs.Parry),'Dodge');
assert.equal(r.defenseOutcome(a,e,false,'Torso',cutoffs.Parry+cutoffs.Dodge+.00001),null);
// Every form covers four areas differently. Raised guards expose legs;
// low guard protects legs at the expense of the head, for either defender.
for(const fighter of [a,e]){
    const attacker=fighter===a?e:a;
    for(const battler of [fighter,attacker])for(const stat of ['atk','def','agi'])
        Object.defineProperty(battler,stat,{configurable:true,value:20});
    for(const stance of r.stances){
        fighter._wws.stance=stance;
        const chances=['Head','Torso','Arms','Legs'].map(area=>r.defenseChances(fighter,attacker,false,area).Parry);
        assert.equal(new Set(chances).size,4,stance+' must have distinct area parry chances');
        const guarded={Chudan:['Head','Torso','Arms'],Jodan:['Head'],Gedan:['Arms','Legs'],
            Kasumi:['Head','Torso','Arms'],Waki:['Arms','Legs']}[stance];
        for(const area of guarded){
            const quick=r.defenseChances(fighter,attacker,false,area);
            const heavy=r.defenseChances(fighter,attacker,true,area);
            assert(quick.Parry>=.65,stance+' must strongly guard '+area);
            assert(heavy.Parry>=quick.Parry,'Heavy cuts must not bypass guarded areas');
            assert(heavy.Parry+heavy.Dodge<=.90000001,'Every guard leaves an opening');
        }
        if(['Jodan','Kasumi'].includes(stance)){
            assert(chances[0]>chances[3]);assert(chances[1]>chances[3]);assert(chances[2]>chances[3]);
            assert.equal(r.defenseOutcome(fighter,attacker,false,'Head',.25),'Parry');
            assert.equal(r.defenseOutcome(fighter,attacker,false,'Legs',.25),null);
        }
        if(stance==='Gedan')assert(chances[3]>chances[0]);
    }
    fighter._wws.stance='Jodan';const highLeg=r.defenseChances(fighter,attacker,false,'Legs');
    fighter._wws.stance='Chudan';const middleLeg=r.defenseChances(fighter,attacker,false,'Legs');
    assert(highLeg.Parry<middleLeg.Parry);
    const committed=r.defenseChances(fighter,attacker,false,'Torso');
    attacker._wws.stance='Kasumi';assert.deepEqual(r.defenseChances(fighter,attacker,false,'Torso'),committed);
    fighter._wws.reaction='Parry';assert.deepEqual(r.defenseChances(fighter,attacker,false,'Torso'),committed);fighter._wws.reaction=null;
    for(const battler of [fighter,attacker]){for(const stat of ['atk','def','agi'])delete battler[stat];battler._wws.stance='Chudan';}
}
// Exactly one attack per fighter in a complete round. Defenses do not remove turns.
reset();d=BattleManager._wwsDuel;a=d.battlers[0];e=d.battlers[1];
const oldRandom=Math.random;Math.random=()=>0;
d.pending=[a,e];BattleManager.wwsNext();
BattleManager.wwsChooseAction('Quick Cut','Torso');assert.equal(d.defense,'Parry');assert.equal(e._wws.reaction,null);
assert(!d.notice.includes('Parried'),'Outcome is hidden during wind-up');BattleManager.updateAction();assert.equal(e._wws.reaction,'Parry');resolve();assert.equal(e._wws.reaction,null);
Math.random=()=>.2;tick(31);assert.equal(d.pending.length,0);assert.equal(d.mode,'animation');resolve();
tick(31);assert.equal(d.mode,'roundEnd');tick(37);assert.equal(d.mode,'reveal');assert.equal(d.round,2);Math.random=oldRandom;
// Incoming attacks resolve with one automatic roll and no reaction prompt.
reset();d=BattleManager._wwsDuel;a=d.battlers[0];e=d.battlers[1];
d.mode='advance';BattleManager._subject=e;Math.random=()=>0;const hp=a.hp;
BattleManager.wwsChooseAction('Quick Cut', 'Torso');assert.equal(d.mode,'animation');assert.equal(d.defense,'Parry');resolve();assert.equal(a.hp,hp);assert.equal(a._wws.recovery,0);
d.mode='advance';BattleManager._subject=e;const dodgeRates=r.defenseChances(a,e,true);
Math.random=()=>dodgeRates.Parry+dodgeRates.Dodge/2;
BattleManager.wwsChooseAction('Heavy Cut','Torso');assert.equal(d.defense,'Dodge');assert.equal(r.playerPose(a),'Chudan');assert.equal(e._wws.recovery,8);
BattleManager.updateAction();assert.equal(r.playerPose(a),'Waki');
resolve();assert.equal(a.hp,hp);assert.equal(a._wws.recovery,0);assert.equal(a._wws.reaction,null);assert.equal(r.playerPose(a),'Chudan');
d.mode='advance';BattleManager._subject=e;Math.random=()=>.99;BattleManager.wwsChooseAction('Quick Cut','Torso');resolve();assert(a.hp<hp);assert.equal(a._wws.recovery,3);
// On attacking turns, NPCs retain their Quick/Heavy relative weights.
for(const stance of r.stances)for(const roll of [.2,.99]){
    reset();d=BattleManager._wwsDuel;e=d.battlers[1];e._wws.stance=stance;d.pending=[e];d.mode='advance';Math.random=()=>roll;
    BattleManager.wwsNext();assert.equal(d.kind,roll===.2?'Quick Cut':'Heavy Cut');assert.equal(d.mode,'animation');assert.equal(d.pending.length,0);resolve();
}
// Every pose has clickable centers for all four areas, including both limbs.
for(const [pose,regions] of Object.entries(WwsDuelTargets.poses)) {
    assert.equal(WwsDuelTargets.hit(pose,-100,-100),null);
    assert.equal(WwsDuelTargets.hit(pose,500,500),null);
    for(const [area,ellipses] of Object.entries(regions))for(const [x,y] of ellipses)
        assert.equal(WwsDuelTargets.hit(pose,x,y),area,pose+' '+area+' hit region');
}
Math.random=oldRandom;
// Sparring never bleeds, even when an undefended cut lands.
reset();d=BattleManager._wwsDuel;a=d.battlers[0];e=d.battlers[1];
d.mode='action';BattleManager._subject=a;Math.random=()=>.99;BattleManager.wwsChooseAction('Quick Cut', 'Torso');resolve();assert.equal(e._wws.bleeding,0);
Math.random=oldRandom;
// Non-sparring controlled duel: one defense roll, then at most one wound roll.
$dataTroops[6].name='Controlled [WWS Duel] [Bleeding]';$dataTroops[7]=JSON.parse(JSON.stringify($dataTroops[6]));$dataTroops[7].id=7;
reset(7);d=BattleManager._wwsDuel;a=d.battlers[0];e=d.battlers[1];assert(!d.sparring);
let rolls=0;Math.random=()=>{rolls++;return rolls===1?.99:.90};d.mode='action';BattleManager._subject=a;
BattleManager.wwsChooseAction('Quick Cut', 'Torso');resolve();assert.equal(rolls,2);assert.equal(e._wws.bleeding,2);
const before=e.hp;r.tickBleeding(d.battlers);assert.equal(e.hp,before-Math.floor(e.mhp*.05));assert.equal(e._wws.bleeding,1);
r.bleed(e);assert.equal(e._wws.bleeding,2);r.tickBleeding(d.battlers);r.tickBleeding(d.battlers);const finalHp=e.hp;r.tickBleeding(d.battlers);assert.equal(e.hp,finalHp);
rolls=0;Math.random=()=>{rolls++;return 0};d.mode='action';BattleManager._subject=a;BattleManager.wwsChooseAction('Quick Cut', 'Torso');resolve();assert.equal(rolls,1);assert.equal(e._wws.bleeding,0);
// Dodge, like Parry/Block, prevents damage and wounds with only one defense roll.
const enemyRates=r.defenseChances(e,a,true);const enemyHp=e.hp;
rolls=0;Math.random=()=>{rolls++;return enemyRates.Parry+enemyRates.Dodge/2};d.mode='action';BattleManager._subject=a;
BattleManager.wwsChooseAction('Heavy Cut','Torso');assert.equal(d.defense,'Dodge');resolve();assert.equal(rolls,1);assert.equal(e.hp,enemyHp);assert.equal(e._wws.bleeding,0);
Math.random=oldRandom;
// Selecting a body area is part of the same attack, and can be cancelled freely.
reset();d=BattleManager._wwsDuel;a=d.battlers[0];e=d.battlers[1];
d.pending=[a,e];d.mode='advance';BattleManager.wwsNext();const targetHp=e.hp;
BattleManager.wwsChooseAction('Heavy Cut');assert.equal(d.mode,'target');assert.equal(a._wws.recovery,0);
tick(12000);assert.equal(d.mode,'target');assert.equal(e.hp,targetHp);assert.equal(d.pending.length,1);
BattleManager.wwsChooseTarget('Invalid');assert.equal(d.mode,'target');
BattleManager.wwsCancelTarget();assert.equal(d.mode,'action');assert.equal(a._wws.recovery,0);
BattleManager.wwsChooseAction('Quick Cut');Math.random=()=>.90;BattleManager.wwsChooseTarget('Arms');
assert.equal(d.mode,'animation');assert.equal(d.area,'Arms');resolve();assert(e.hp<targetHp);
assert.equal(e._wws.injuries.Arms.severity,2);assert.equal(e._wws.bleeding,0);assert.equal(d.pending.length,1);
const injuredHp=e.hp;BattleManager.wwsChooseTarget('Head');assert.equal(e.hp,injuredHp);
// Injuries penalize the injured fighter, refresh without accumulating, and expire.
const injuredPower=r.damage(e,a,false);e._wws.injuries={};const normalPower=r.damage(e,a,false);
assert(injuredPower<normalPower);r.wound(e,'Arms',3,true);r.wound(e,'Arms',1,true);
assert.equal(e._wws.injuries.Arms.severity,3);assert.equal(e._wws.injuries.Arms.rounds,2);
const normalDefense=r.defense(e,a,false);r.wound(e,'Head',2,true);assert(r.defense(e,a,false)<normalDefense);
const normalInitiative=r.initiative(e);r.wound(e,'Legs',3,true);assert.equal(r.initiative(e),normalInitiative-6);
r.tickInjuries(d.battlers);assert.equal(e._wws.injuries.Legs.rounds,1);
r.tickInjuries(d.battlers);assert.equal(Object.keys(e._wws.injuries).length,0);
assert(r.damage(a,e,false,'Head')>r.damage(a,e,false,'Torso'));
assert(r.damage(a,e,false,'Arms')<r.damage(a,e,false,'Torso'));
for(const area of ['Head','Torso','Arms'])
    assert(r.defenseChances(e,a,false,area).Parry>r.defenseChances(e,a,false,'Legs').Parry,
        'Chudan guards the upper body and exposes the legs');
// Cutting levels reproduce every threshold of the supplied severity table.
for(let level=1;level<=5;level++){
    const light=(90-10*level)/100,heavy=.02*level;
    assert.equal(r.woundSeverity(level,light-.00001),1);
    assert.equal(r.woundSeverity(level,light),2);
    assert.equal(r.woundSeverity(level,1-heavy-.00001),2);
    assert.equal(r.woundSeverity(level,1-heavy),3);
}
const weapon=a.weapons()[0],weaponNote=weapon.note;
weapon.note='<CuttingLevel: 4>';assert.equal(r.cuttingLevel(a,false),4);assert.equal(r.cuttingLevel(a,true),5);
weapon.note='<CuttingLevel: 5>';assert.equal(r.cuttingLevel(a,true),5);weapon.note=weaponNote;
assert.equal(r.cuttingLevel(e,false),1);assert.equal(r.cuttingLevel(e,true),2);
// NPCs use body targeting too, without presenting a player target prompt.
d.mode='advance';BattleManager._subject=e;e._wws.stance='Jodan';Math.random=()=>.1;
BattleManager.wwsChooseAction('Quick Cut');assert.equal(d.area,'Head');assert.equal(d.mode,'animation');resolve();
Math.random=oldRandom;
// Automatic Parry/Block prevents location injuries; unopposed lethal cuts bleed.
reset(7);d=BattleManager._wwsDuel;a=d.battlers[0];e=d.battlers[1];
Math.random=()=>0;d.mode='action';BattleManager._subject=a;
BattleManager.wwsChooseAction('Quick Cut','Head');resolve();assert.equal(Object.keys(e._wws.injuries).length,0);
Math.random=()=>.99;d.mode='action';BattleManager._subject=a;
BattleManager.wwsChooseAction('Quick Cut','Legs');resolve();assert.equal(e._wws.injuries.Legs.severity,3);assert.equal(e._wws.bleeding,3);
r.bleed(e,2);assert.equal(e._wws.bleeding,3); // A lighter wound cannot shorten active bleeding.
Math.random=oldRandom;
// Both bleeding ticks apply before either outcome can be checked.
a.setHp(1);e.setHp(1);r.bleed(a);r.bleed(e);r.tickBleeding(d.battlers);assert(!a.isAlive()&&!e.isAlive());
// Untimed action does not timeout; ordinary troops retain stock behavior.
reset();d=BattleManager._wwsDuel;d.pending=[d.battlers[0]];d.mode='advance';BattleManager.wwsNext();tick(12000);assert.equal(d.mode,'action');
BattleManager.setup(1,true,true);assert.equal(BattleManager._wwsDuel,null);
assert(!$gameParty.battleMembers()[0].isSpriteVisible(),'Stock battles cannot inherit duel-only visibility');
// Ended duel flags are cleaned by endBattle; a fresh actor outside a duel is hidden in front view.
const stockActor=new Game_Actor(1);assert(!stockActor.isSpriteVisible());
// All three terminal paths invoke the event callback and discard transient flags.
for(const outcome of [0,1,2]){reset();let callback=-1;BattleManager.setEventCallback(result=>callback=result);
    const members=BattleManager._wwsDuel.battlers;BattleManager.endBattle(outcome);
    assert.equal(callback,outcome);assert.equal(BattleManager._phase,'battleEnd');assert(members.every(b=>!b._wws));}
// Actual attacks reach victory in practice and defeat in controlled lethal duels.
BattleManager.playVictoryMe=()=>{};BattleManager.playDefeatMe=()=>{};BattleManager.replayBgmAndBgs=()=>{};
for(const victory of [true,false]){
    reset(victory?6:7);d=BattleManager._wwsDuel;a=d.battlers[0];e=d.battlers[1];let callback=-1;
    BattleManager.setEventCallback(result=>callback=result);Math.random=()=>.99;
    if(victory)e.setHp(1);else a.setHp(1);
    d.mode='action';BattleManager._subject=victory?a:e;BattleManager.wwsChooseAction('Quick Cut', 'Torso');resolve();BattleManager.wwsNext();
    assert.equal(callback,victory?0:2);assert.equal(BattleManager._phase,'battleEnd');
}
Math.random=oldRandom;
// Stances are persistent turn actions. Browsing/cancelling does not spend a turn.
reset();d=BattleManager._wwsDuel;a=d.battlers[0];e=d.battlers[1];
assert.deepEqual(Array.from(r.stances),['Chudan','Jodan','Gedan','Kasumi','Waki']);
d.pending=[a,e];BattleManager.wwsNext();
const previewDamage=r.damage(a,e,false),previewInitiative=r.initiative(a),previewDefense=r.defense(a,e,false);
BattleManager.wwsChooseAction('Change Stance');assert.equal(d.mode,'stance');
const pending=d.pending.slice(),order=d.order.slice(),health=d.battlers.map(b=>b.hp);
for(const stance of r.stances){
    d.previewStance=stance;assert.equal(r.playerPose(a),stance);assert.equal(a._wws.stance,'Chudan');
    assert.equal(r.damage(a,e,false),previewDamage);assert.equal(r.initiative(a),previewInitiative);
    assert.equal(r.defense(a,e,false),previewDefense);assert.deepEqual(d.pending,pending);
    assert.equal(e._wws.stance,'Chudan');
}
BattleManager.wwsChooseStance('Invalid');BattleManager.wwsChooseStance('Chudan');
assert.equal(d.mode,'stance');assert.equal(a._wws.stance,'Chudan');
BattleManager.wwsCancelStance();assert.equal(d.mode,'action');assert.equal(d.previewStance,null);assert.deepEqual(d.pending,pending);
BattleManager.wwsChooseAction('Change Stance');
Math.random=()=>{throw Error('Changing stance must not roll combat randomness')};
BattleManager.wwsChooseStance('Kasumi');
assert.equal(a._wws.stance,'Kasumi');assert.equal(e._wws.stance,'Chudan');assert.equal(d.mode,'advance');
assert.equal(d.previewStance,null);assert.equal(BattleManager._subject,null);assert.deepEqual(d.pending,pending);
assert.deepEqual(d.order,order);assert.deepEqual(d.battlers.map(b=>b.hp),health);assert.equal(a._wws.recovery,0);
BattleManager.wwsChooseAction('Heavy Cut','Torso');assert.equal(d.mode,'advance');
Math.random=()=>.99;BattleManager.wwsNext();assert.equal(BattleManager._subject,e);assert.equal(d.mode,'animation');resolve();
BattleManager.startInput();assert.equal(a._wws.stance,'Kasumi');assert.equal(e._wws.stance,'Chudan');
// Every NPC form is available as a paid turn, with no attack on the same turn.
for(const stance of r.stances){
    reset();d=BattleManager._wwsDuel;a=d.battlers[0];e=d.battlers[1];
    e._wws.stance=stance==='Chudan'?'Jodan':'Chudan';
    const choices=r.stances.filter(value=>value!==e._wws.stance);
    const selection=(choices.indexOf(stance)+.5)/choices.length*.2;
    Math.random=()=>selection;d.pending=[e,a];BattleManager.wwsNext();
    assert.equal(e._wws.stance,stance);assert.equal(d.kind,'Change Stance');assert.equal(d.mode,'advance');
    assert.equal(BattleManager._subject,null);assert.equal(d.pending.length,1);assert.equal(d.pending[0],a);
    assert.equal(e.hp,e.mhp);assert.equal(a.hp,a.mhp);assert.equal(e._wws.recovery,0);
    a._wws.stance=stance;
    assert.equal(r.playerPose(a),stance);assert.equal(e.battlerName(),'SamuraiInstructor-'+stance+'-v1');
    const initiative=a.agi+({Chudan:0,Jodan:3,Gedan:-3,Kasumi:-1,Waki:2}[stance]);assert.equal(r.initiative(a),initiative);
    for(const fighter of [a,e]){
        const other=fighter===a?e:a;fighter._wws.stance='Chudan';
        const passive=r.defenseChances(fighter,other);
        fighter._wws.stance='Kasumi';const kasumi=r.defenseChances(fighter,other);
        assert(Math.abs(kasumi.Parry-passive.Parry)<1e-9);assert.equal(kasumi.Dodge,passive.Dodge);
        fighter._wws.stance='Waki';const waki=r.defenseChances(fighter,other);
        assert(Math.abs(waki.Dodge-passive.Dodge-.075)<1e-9);assert(Math.abs(waki.Parry-passive.Parry+.605)<1e-9);
    }
}
Math.random=oldRandom;
// Exercise full duels through the real round/initiative/action transitions.
let seed=12345;
Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
for(const stance of r.stances)for(const kind of r.actions){
    reset();let steps=0;
    while(BattleManager._phase!=='battleEnd' && steps++<20000){
        const current=BattleManager._wwsDuel;
        if(current.mode==='stance')BattleManager.wwsChooseStance(stance);
        else if(current.mode==='action'){if(current.battlers[0]._wws.stance!==stance)BattleManager.wwsChooseAction('Change Stance');else BattleManager.wwsChooseAction(kind,'Torso');}
        else if(BattleManager._phase==='action')resolve();
        else tick(1);
    }
    assert.equal(BattleManager._phase,'battleEnd',stance+' '+kind+' must finish without stalling');
    assert(BattleManager._wwsDuel.battlers.every(b=>!b._wws));
}
Math.random=oldRandom;
// Instantiate the real plugin windows with rendering boundaries stubbed, and
// verify the visible menu and hidden/revealed HUD through their normal methods.
Graphics.width=Graphics.boxWidth=1280;Graphics.height=Graphics.boxHeight=720;
function Rectangle(x,y,width,height){Object.assign(this,{x,y,width,height})}
var ImageManager={loadEnemy(){},loadBitmap(){}};
Window_Base.prototype.initialize=function(rect){this.innerWidth=rect.width-24;this.innerHeight=rect.height-24;this.lines=[];this.contents={clear:()=>this.lines=[],fillRect(){}};};
Window_Base.prototype.hide=function(){this.visible=false};Window_Base.prototype.show=function(){this.visible=true};
Window_Base.prototype.deactivate=function(){this.active=false};Window_Base.prototype.activate=function(){this.active=true};
Window_Base.prototype.drawText=function(text){this.lines.push(text)};
Window_Base.prototype.resetFontSettings=function(){};
Object.setPrototypeOf(Window_Command.prototype,Window_Base.prototype);
Window_Command.prototype.initialize=function(rect){Window_Base.prototype.initialize.call(this,rect);this._list=[];};
Window_Command.prototype.refresh=function(){this._list=[];this.makeCommandList()};
Window_Command.prototype.addCommand=function(name,symbol,enabled,ext){this._list.push({name,symbol,enabled,ext})};
Window_Command.prototype.select=function(index){this._index=index};
Window_Command.prototype.index=function(){return this._index};
Window_Command.prototype.currentExt=function(){return this._list[this._index]?.ext};
Window_Command.prototype.setHandler=function(){};
Window_Command.prototype.itemRect=function(){return {x:0,y:0,width:300}};
Window_Command.prototype.commandName=function(index){return this._list[index]?.name};
reset();d=BattleManager._wwsDuel;
const scene=new Scene_Battle();scene._logWindow={};scene.addWindow=()=>{};scene._spriteset={_enemySprites:[]};
scene.createAllWindows();
// Opening has a free, fully enabled picker and no fabricated round/commitment.
reset(6,true);d=BattleManager._wwsDuel;
scene._duelCards.setMode('stance');
assert.equal(scene._duelCards._list.length,5);assert(scene._duelCards._list.every(item=>item.enabled));
scene._duelCards.refresh();assert(scene._duelCards.lines.includes('CHOOSE OPENING FORM · FREE'));
scene._duelHud.refresh();assert(scene._duelHud.lines.includes('Opening form'));
assert(scene._duelHud.lines.includes('Unrevealed'));assert(!scene._duelHud.lines.includes('Round 00'));
Math.random=()=>0;BattleManager.wwsChooseStance('Chudan');
scene._duelCards.setMode('reveal');scene._duelCards.setMode('action');
assert.deepEqual(scene._duelCards._list.map(item=>item.ext),['Quick Cut','Heavy Cut','Change Stance']);assert.equal(scene._duelCards.maxCols(),3);
scene._duelCards.setMode('stance');assert.equal(scene._duelCards._list.find(item=>item.ext==='Chudan').enabled,false);assert.equal(scene._duelCards._list.length,5);assert.equal(scene._duelCards.maxCols(),5);
for(const mode of ['stance','action','target']){
    scene._duelCards.setMode(mode);
    for(let index=0;index<scene._duelCards._list.length;index++){
        const rect=scene._duelCards.itemRect(index);
        assert(rect.x>=0&&rect.y>=0&&rect.x+rect.width<=scene._duelCards.innerWidth&&rect.y+rect.height<=scene._duelCards.innerHeight,'Choice must fit the bottom strip');
    }
}
scene._duelHud.refresh();assert(!scene._duelHud.lines.includes('Unrevealed'));
assert(!scene._duelHud.lines.some(line=>line.includes('Parry/Block')),'Compact HUD omits redundant defense diagnostics');
d.battlers[1]._wws.stance='Kasumi';scene._duelHud.refresh();
assert(!scene._duelHud.lines.includes('Unrevealed'));assert(scene._duelHud.lines.includes('Kasumi'));
assert(scene._duelHud.lines.includes('Round 01'));
// Both the body picker and fallback cards show chances for the chosen attack,
// target, and defender's committed form, without rolling combat randomness.
d.battlers[1]._wws.stance='Jodan';d.kind='Quick Cut';d.mode='target';
scene._duelTargets._area='Legs';scene._duelTargets.refresh();const legLabel=scene._duelTargets.lines.join(' / ');
scene._duelTargets._area='Head';scene._duelTargets.refresh();const headLabel=scene._duelTargets.lines.join(' / ');
assert.notEqual(legLabel,headLabel);assert(headLabel.includes('Parry/Block'));
scene._duelCards.setMode('target');assert.equal(scene._duelCards.maxCols(),4);
for(const [index,area] of ['Head','Torso','Arms','Legs'].entries()){
    scene._duelCards.lines=[];scene._duelCards.drawItem(index);
    const chances=r.defenseChances(d.battlers[1],d.battlers[0],false,area);
    const damage=r.damage(d.battlers[0],d.battlers[1],false,area);
    assert(scene._duelCards.lines.includes(damage+' damage · '+Math.round((1-chances.Parry-chances.Dodge)*100)+'% hit'));
}
d.kind='Heavy Cut';scene._duelTargets.refresh();assert.notEqual(scene._duelTargets.lines.join(' / '),headLabel);
// Body callouts show the chance to LAND the cut, subtracting both defenses.
// Exercise the renderer for every pose and attack, and its live redraw cache.
Bitmap=function(width,height){
    this.width=width;this.height=height;this.labels=[];this.redraws=0;
    this.context=new Proxy({fillText:(text,x,y)=>this.labels.push({text,x,y})},{get:(target,key)=>target[key]||(()=>{})});
    this.baseTexture={update:()=>this.redraws++};
};
Bitmap.prototype.clear=function(){this.labels=[]};
function Sprite(bitmap){this.bitmap=bitmap}
const enemySprite={_battler:d.battlers[1],anchor:{x:.5,y:1},addChild(child){this.child=child}};
Math.random=()=>{throw Error('Rendering hit chances must not consume combat randomness')};
for(const stance of r.stances)for(const kind of r.actions){
    enemySprite._battler._wws.stance=stance;d.kind=kind;
    scene._duelTargets.drawMarkers(enemySprite,stance);
    const bitmap=scene._duelTargets._markers.bitmap;
    assert.equal(bitmap.labels.length,12,'One name, hit chance and damage per body area');
    for(const [index,area] of ['Head','Torso','Arms','Legs'].entries()){
        assert.equal(WwsDuelTargets.pick(stance,300,68+index*46),area,'Clicking a hit-chance label selects the matching body area');
        for(const [x,y] of WwsDuelTargets.poses[stance][area])assert.equal(WwsDuelTargets.pick(stance,x,y),area);
        const chances=r.defenseChances(enemySprite._battler,d.battlers[0],kind==='Heavy Cut',area);
        const percent=Math.round((1-(chances.Parry+chances.Dodge))*100);
        assert.equal(bitmap.labels[index*3].text,area);
        const label=bitmap.labels[index*3+1];assert.equal(label.text,percent+'% hit');assert.equal(bitmap.labels[index*3+2].text,r.damage(d.battlers[0],enemySprite._battler,kind==='Heavy Cut',area)+' damage on hit');
        assert(label.x+128>=0&&label.x+128<=bitmap.width,'Percentage fits the padded bitmap');
        assert(label.y+16-17>=0&&label.y+16+17<=bitmap.height);
    }
    const redraws=bitmap.redraws;scene._duelTargets.drawMarkers(enemySprite,stance);assert.equal(bitmap.redraws,redraws);
}
d.kind='Quick Cut';enemySprite._battler._wws.stance='Chudan';
scene._duelTargets.drawMarkers(enemySprite,'Chudan');
const markerBitmap=scene._duelTargets._markers.bitmap;const healthyLabels=markerBitmap.labels.map(label=>label.text);
enemySprite._battler._wws.injuries.Head={severity:2,rounds:2};
scene._duelTargets.drawMarkers(enemySprite,'Chudan');assert.notDeepEqual(markerBitmap.labels.map(label=>label.text),healthyLabels);
const beforeArmDamage=markerBitmap.labels.map(label=>label.text);
d.battlers[0]._wws.injuries.Arms={severity:3,rounds:2};
scene._duelTargets.drawMarkers(enemySprite,'Chudan');assert.notDeepEqual(markerBitmap.labels.map(label=>label.text),beforeArmDamage,'Damage preview invalidates when arm injury changes');
assert.equal(WwsDuelTargets.pick('Chudan',450,68),'Head','Entire expanded callout is clickable');
scene._duelTargets.stop();assert.equal(scene._duelTargets._markers.visible,false);
Math.random=oldRandom;
// Masanori still loses at the requested thresholds; the player stops at 1 HP.
for(const playerAttacks of [true,false])for(const [kind,hits] of [['Quick Cut',4],['Heavy Cut',2]]){
    reset();d=BattleManager._wwsDuel;const subject=d.battlers[playerAttacks?0:1],target=d.battlers[playerAttacks?1:0];
    subject._wws.stance=target._wws.stance='Chudan';Math.random=()=>.99;
    for(let hit=1;hit<=hits;hit++){
        d.mode='action';BattleManager._subject=subject;BattleManager.wwsChooseAction(kind,'Torso');
        assert.equal(d.defense,null);resolve();
        assert.equal(target.isAlive(),!playerAttacks||hit<hits,kind+' torso hit '+hit+' must respect practice protection');
    }
    if(!playerAttacks){
        assert.equal(target.hp,1);assert(!target.isStateAffected(target.deathStateId()));
        d.mode='action';BattleManager._subject=subject;BattleManager.wwsChooseAction(kind,'Torso');resolve();
        assert.equal(target.hp,1);assert(target.result().hpDamage===0);
        assert.equal(BattleManager.checkBattleEnd(),false,'Reaching 1 HP must not end practice');
        d.pending=[target];d.mode='advance';BattleManager.wwsNext();assert.equal(d.mode,'action');
    }
}
Math.random=oldRandom;
// Direct HP changes, damage-over-time paths, and death-state refresh cannot
// defeat the practice player. The floor ends immediately on leaving the duel.
reset();d=BattleManager._wwsDuel;a=d.battlers[0];e=d.battlers[1];
a.setHp(0);assert.equal(a.hp,1);assert(a.isAlive());
a.gainHp(-9999);assert.equal(a.hp,1);assert(a.result().hpDamage===0);
a.addState(a.deathStateId());assert.equal(a.hp,1);assert(a.isAlive());
a.setHp(20);a.gainHp(-9999);assert.equal(a.hp,1);assert.equal(a.result().hpDamage,19);
e.setHp(0);assert(e.isDead(),'Practice enemy remains defeatable');
BattleManager.endBattle(1);a.setHp(0);assert(a.isDead(),'Protection clears on exit');
reset(7);a=BattleManager._wwsDuel.battlers[0];a.setHp(0);assert(a.isDead(),'Lethal duels retain normal defeat');
BattleManager.endBattle(2);BattleManager.setup(1,true,true);a=$gameParty.battleMembers()[0];a.recoverAll();a.setHp(0);assert(a.isDead(),'Stock battles retain normal defeat');
console.log('PASS: real MZ duel integration: automatic stat-based Parry/Block and Dodge, paid stance turns, persistent forms, damage previews, targets, injuries, bleeding, outcomes and stock fallback');
`);
