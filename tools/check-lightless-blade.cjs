const fs = require('node:fs'), path = require('node:path');
const { context, run } = require('./lib/duel-harness.cjs')({ feedback: true });
// Exercise the engine's real log wait assignment with the timing override.
const windows = fs.readFileSync(path.join(__dirname, '../js/rmmz_windows.js'), 'utf8');
run(windows.match(/Window_BattleLog\.prototype\.wait = function\(\) \{[\s\S]*?\n\};/)[0]);
const troops = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/Troops.json'), 'utf8'));
context.shinsengumiId = troops.find(t => t && t.name.includes('Shinsengumi') && t.name.includes('[WWS Duel]')).id;
run(`
function prepare(id=shinsengumiId,stance='Seigan') {
    reset(id);
    const d=BattleManager._wwsDuel,[a,e]=d.battlers;
    e._wws.stance=stance; d.pending=[a]; d.mode='advance';
    d.activeBattler=e; BattleManager._subject=e;
    return {d,a,e};
}
let {d,a,e}=prepare();
assert(!WwsDuelRules.stances.includes('Seigan'));
assert(!WwsDuelRules.availableStances(a).includes('Seigan'));
assert(WwsDuelRules.availableStances(e).includes('Seigan'));
assert.equal(WwsDuelRules.pose(e),'Seigan');
assert.equal(e.battlerName(),'Shinsengumi-Seigan-v1');
const layout=WwsDuelRules.spriteLayout(e,'Seigan'),neutral=WwsDuelRules.spriteLayout(e,'Chudan');
assert(Math.abs((layout.foot-layout.crown)*layout.scale-(neutral.foot-neutral.crown))<1e-8);
assert(Math.abs((layout.foot-layout.anchorY*layout.height)*layout.scale+neutral.baseline)<1e-8);
const body=WwsDuelTargets.regions(e,'Seigan');
for(const area of ['Head','Torso','Arms','Legs']) {
    const [x,y]=body[area][0]; assert.equal(WwsDuelTargets.hit('Seigan',x,y,e),area);
}
// Exercise every chain ending for both types of initiating cut.
for(const kind of ['Quick Cut','Heavy Cut'])for(const branch of ['second-hit-third-hit','second-hit-third-dodge','second-dodge','third-hit','third-dodge']) {
    ({d,a,e}=prepare());
    const hp=a.hp,round=d.round,recovery=e._wws.recovery;
    Math.random=()=>0;
    BattleManager.wwsChooseAction(kind,'Head');
    assert.equal(d.defense,'Parry');
    BattleManager.updateAction();
    assert.equal(a.hp,hp);assert.equal(a._wws.reaction,'Parry');
    // Finish the first action: its end starts the follow-up before any other turn.
    const chances=WwsDuelRules.defenseChances(a,e,false,'Torso');
    const secondHit=branch.startsWith('second-hit');
    const thirdStrike=branch!=='second-dodge';
    const secondRoll=secondHit?.99:branch==='second-dodge'?chances.Parry+chances.Dodge/2:0;
    Math.random=()=>secondRoll;
    BattleManager.updateAction();
    assert.equal(BattleManager._phase,'action');
    assert.equal(BattleManager._subject,e);assert.equal(d.kind,'Three Stage Thrust');
    assert.equal(d.area,'Torso');assert.equal(d.lightlessStrike,2);
    const secondDefense=secondHit?null:branch==='second-dodge'?'Dodge':'Parry';
    assert.equal(d.defense,secondDefense);
    assert.equal(a._wws.reaction,null);assert.equal(d.round,round);
    assert.deepEqual(d.pending,[a]);
    assert.equal(e._wws.recovery,recovery+(kind==='Heavy Cut'?8:0));
    const damage=WwsDuelRules.damage(e,a,false,'Torso');
    Math.random=()=>0;
    BattleManager.updateAction();
    assert.equal(a.hp,secondDefense?hp:Math.max(1,hp-damage));
    let expectedHp=secondDefense?hp:Math.max(1,hp-damage);
    if(thirdStrike) {
        const thirdDodge=WwsDuelRules.defenseChances(a,e,false,'Torso').Dodge;
        Math.random=()=>branch.endsWith('dodge')?thirdDodge/2:.99;
        BattleManager.updateAction();
        assert.equal(d.kind,'Three Stage Thrust');assert.equal(d.lightlessStrike,3);
        assert.equal(d.defense,branch.endsWith('dodge')?'Dodge':null);
        assert.equal(d.area,'Torso');assert.deepEqual(d.pending,[a]);
        if(!d.defense)expectedHp=Math.max(1,expectedHp-WwsDuelRules.damage(e,a,false,'Torso'));
        Math.random=()=>0;BattleManager.updateAction();
    }
    resolve();
    const hit=secondHit||branch.endsWith('hit');
    assert.equal(a.hp,expectedHp);
    assert.equal(Boolean(a._wws.injuries.Torso),hit);assert.equal(a._wws.bleeding,0);
    assert.equal(d.lightlessStrike,0);
    assert.equal(d.mode,'advance');assert.equal(BattleManager._subject,null);
    assert.deepEqual(d.pending,[a]);assert.equal(d.round,round);
    const impacts=WwsDuelFeedback.events.filter(event=>event.type==='impact');
    assert.equal(impacts.length,thirdStrike?3:2);assert.equal(impacts[0].defense,'Parry');
    assert.equal(impacts[1].defense,secondDefense);assert.equal(impacts[1].area,'Torso');
    assert.equal(impacts[1].lightlessStrike,2);
    if(impacts[2]) {
        assert.equal(impacts[2].lightlessStrike,3);assert.notEqual(impacts[2].defense,'Parry');
        assert.equal(impacts[2].area,'Torso');
    }
    assert(WwsDuelFeedback.events.some(event=>event.text==='THREE STAGE THRUST · 2/3'));
    assert(!WwsDuelFeedback.events.some(event=>event.text?.includes('SURE HIT')));
    assert(!$gameMessage.isBusy(),'Explanation waits for the entire chain');
    assert(e._wws.lightlessExplanationPending);
    BattleManager.updatePhase(true);
    assert(!$gameMessage.isBusy(),'Explanation leaves a beat after the final strike');
    tick(29);
    assert(!$gameMessage.isBusy(),'Explanation stays paused for at least half a second');
    assert.equal(d.mode,'advance');assert.deepEqual(d.pending,[a]);assert.equal(d.round,round);
    tick(16);
    assert.equal(d.mode,'lightlessDialogue');
    assert.equal($gameMessage.speakerName(),e.name());
    assert($gameMessage.allText().includes("It's called Three Stage Thrust. When you parry my blade,"));
    assert($gameMessage.allText().includes('I can strike twice more in an instant.'));
    tick(120);
    assert.equal(d.mode,'lightlessDialogue');assert.equal($gameMessage._texts.length,2);
    assert.deepEqual(d.pending,[a]);assert.equal(d.round,round);assert.equal(e._wws.stance,'Seigan');
    $gameMessage.clear();BattleManager.updatePhase(true);
    assert.equal(d.mode,'advance');assert(e._wws.lightlessExplained);
    // Subsequent uses in this fight do not repeat the explanation.
    BattleManager._subject=e;Math.random=()=>0;
    BattleManager.wwsChooseAction('Quick Cut','Torso');BattleManager.updateAction();
    Math.random=()=>.99;resolve();BattleManager.updatePhase(true);
    assert(!$gameMessage.isBusy());assert(!e._wws.lightlessExplanationPending);
    BattleManager.wwsNext();assert.equal(BattleManager._subject,a);
    assert.equal(d.mode,'action');
}
// Dodge, ordinary hit, other stances, and another enemy never trigger it.
for(const [id,stance,outcome] of [
    [shinsengumiId,'Seigan','Dodge'],[shinsengumiId,'Seigan',null],
    [shinsengumiId,'Chudan','Parry'],[6,'Seigan','Parry']
]) {
    ({d,a,e}=prepare(id,stance));
    if(id===6)assert(!WwsDuelRules.availableStances(e).includes('Seigan'));
    Math.random=()=>.99;BattleManager.wwsChooseAction('Quick Cut','Torso');
    d.defense=outcome;resolve();
    assert.equal(WwsDuelFeedback.events.filter(event=>event.type==='impact').length,1);
    assert(!WwsDuelFeedback.events.some(event=>event.text?.startsWith('THREE STAGE THRUST')));
    BattleManager.updatePhase(true);assert(!$gameMessage.isBusy());
}
// On strike three, parry probability is not redistributed into extra dodge.
({d,a,e}=prepare());
const dodge=WwsDuelRules.defenseChances(a,e,false,'Torso').Dodge;
for(let i=0;i<1000;i++) {
    const roll=(i+.5)/1000;
    assert.equal(WwsDuelRules.lightlessDefense(a,e,3,roll),roll<dodge?'Dodge':null);
}
// Rapid follow-ups omit the normal log wind-up; ordinary cuts retain it.
const battleLog=new Window_BattleLog();let commands=[];
battleLog.push=(...args)=>commands.push(args[0]);
d.kind='Three Stage Thrust';battleLog.startAction(e,{},[a]);
assert.deepEqual(commands,['performAction']);
for(const strike of [2,3]) {
    d.lightlessStrike=strike;d.kind='Three Stage Thrust';
    battleLog.wait();assert.equal(battleLog._waitCount,2,'Follow-up log waits last only two frames');
}
// Shorten the initial parry recovery too, while keeping its opening wind-up.
d.kind='Heavy Cut';d.defense='Parry';d.target=a;BattleManager._subject=e;
a._wws.reaction=null;battleLog.wait();assert.equal(battleLog._waitCount,16);
a._wws.reaction='Parry';battleLog.wait();assert.equal(battleLog._waitCount,2);
a._wws.reaction=null;d.defense=null;
commands=[];d.kind='Quick Cut';battleLog.startAction(e,{},[a]);
assert(commands.includes('waitForMovement'));assert(commands.includes('wait'));
battleLog.wait();assert.equal(battleLog._waitCount,16,'Ordinary cuts retain stock log pacing');
WwsDuelFeedback.scene={};
WwsDuelFeedback.impact({target:a,defense:'Parry',heavy:false,lightlessStrike:2});
assert.equal(WwsDuelFeedback.motionFrames,4);assert.equal(WwsDuelFeedback.hitStop,1);
WwsDuelFeedback.impact({subject:e,target:a,defense:'Parry',heavy:true,lightlessStrike:0});
assert.equal(WwsDuelFeedback.motionFrames,4);assert.equal(WwsDuelFeedback.hitStop,1);
WwsDuelFeedback.scene=null;
// The follow-up respects sparring protection and survives mid-battle dialogue.
({d,a,e}=prepare());a.setHp(2);
Math.random=()=>0;BattleManager.wwsChooseAction('Quick Cut','Arms');
BattleManager.updateAction();Math.random=()=>.99;resolve();
assert.equal(a.hp,1);assert(a.isAlive());
tick(46);assert.equal(d.mode,'lightlessDialogue');
$gameMessage.clear();BattleManager.updatePhase(true);
e.setHp(500);BattleManager.updatePhase(true);$gameMessage.clear();BattleManager.updatePhase(true);
assert.equal(e._wws.stance,'Seigan');assert(WwsDuelRules.hasLightlessBlade(e));
assert(e._wws.midBattleSpoken);
assert(!WwsDuelRules.availableStances(e).includes('TwoSword'));
// The NPC can select Seigan through paid stance changes, not only at opening.
({d,a,e}=prepare(shinsengumiId,'Chudan'));d.pending=[e,a];Math.random=()=>.199;
BattleManager.wwsNext();assert.equal(e._wws.stance,'Seigan');
assert.equal(d.kind,'Change Stance');assert.deepEqual(d.pending,[a]);
// Weighted choices favor Seigan without losing any of his other forms.
const counts=Object.fromEntries(WwsDuelRules.availableStances(e).map(s=>[s,0]));
for(let i=0;i<1000;i++)counts[WwsDuelRules.enemyStance(e,(i+.5)/1000)]++;
assert.equal(counts.Seigan,700);
for(const stance of WwsDuelRules.stances)assert.equal(counts[stance],60);
// Retaining Seigan still attacks, while switching away costs a turn.
for(const [stance,roll,expected,mode] of [
    ['Seigan',.1,'Seigan','animation'],
    ['Seigan',.001,'Chudan','advance'],
    ['Chudan',.1,'Seigan','advance'],
    ['Chudan',.001,'Chudan','animation']
]) {
    ({d,a,e}=prepare(shinsengumiId,stance));d.pending=[e,a];Math.random=()=>roll;
    BattleManager.wwsNext();assert.equal(e._wws.stance,expected);assert.equal(d.mode,mode);
    assert.deepEqual(d.pending,[a]);
    if(mode==='animation')resolve();
    else assert.equal(d.kind,'Change Stance');
}
BattleManager.endBattle(1);reset(shinsengumiId);
assert(!WwsDuelRules.hasLightlessBlade(BattleManager._wwsDuel.battlers[1]));
assert(!BattleManager._wwsDuel.battlers[1]._wws.lightlessExplained,'New battles reset the explanation');
`);
console.log('PASS: Seigan sprite/targets/exclusivity/weighted AI, Quick/Heavy three-strike chains, second hit/dodge/parry branches, third dodge-only with unchanged dodge chance, rapid feedback, preserved turns, wounds, practice floor, dialogue and reset');
