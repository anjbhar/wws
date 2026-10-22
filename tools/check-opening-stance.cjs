const { context, run } = require('./lib/duel-harness.cjs')({ feedback: true });
const fs = require('node:fs'), path = require('node:path');
const troops = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/Troops.json'), 'utf8'));
const shinsengumi = troops.find(troop => troop && troop.name.includes('Shinsengumi') && troop.name.includes('[WWS Duel]'));
context.practiceIds = [6, shinsengumi.id];
run(`
const forms=WwsDuelRules.stances;
for(const id of practiceIds)for(const playerForm of forms)for(const [index,enemyForm] of (id===6?forms:[...forms,'Seigan']).entries()){
    reset(id,true);
    if(BattleManager._wwsDuel.mode==='openingDialogue'){
        $gameMessage.clear();BattleManager.updatePhase(true);
    }
    const d=BattleManager._wwsDuel,[a,e]=d.battlers;
    const health=d.battlers.map(b=>b.hp);
    assert(d.opening);assert.equal(d.mode,'stance');assert.equal(d.round,0);
    assert.equal($gameTroop.turnCount(),0);assert.deepEqual(d.pending,[]);assert.deepEqual(d.order,[]);
    assert(d.battlers.every(b=>b._wws.stance===null));
    let rolls=0;Math.random=()=>{rolls++;return id===6?(index+.5)/forms.length:enemyForm==='Seigan'?.65:(index+.5)*.06};
    for(const preview of forms){d.previewStance=preview;assert.equal(WwsDuelRules.playerPose(a),preview)}
    assert(d.battlers.every(b=>b._wws.stance===null));
    BattleManager.wwsChooseAction('Quick Cut','Torso');BattleManager.wwsNext();
    BattleManager.wwsChooseStance('Invalid');BattleManager.wwsCancelStance();tick(12000);
    assert(d.opening);assert.equal(d.mode,'stance');assert.equal(d.round,0);
    assert.equal($gameTroop.turnCount(),0);assert.equal(rolls,0);
    assert.deepEqual(d.battlers.map(b=>b.hp),health);
    BattleManager.startInput();assert.equal(d.round,0);
    const oldStanceEvents=WwsDuelFeedback.events.filter(event=>event.type==='stance').length;
    BattleManager.wwsChooseStance(playerForm);
    assert(!d.opening);assert.equal(d.mode,'reveal');assert.equal(d.round,1);
    assert.equal($gameTroop.turnCount(),1);assert.equal(d.pending.length,2);
    assert.equal(a._wws.stance,playerForm);assert.equal(e._wws.stance,enemyForm);
    assert.equal(rolls,1);assert.equal(d.previewStance,null);
    const first=WwsDuelRules.initiative(a)>=WwsDuelRules.initiative(e)?a:e;
    assert.equal(d.order[0],first,'Round 1 initiative uses both chosen forms');
    assert.equal(d.pending.filter(b=>b===a).length,1);assert.equal(d.pending.filter(b=>b===e).length,1);
    assert.equal(WwsDuelFeedback.events.filter(event=>event.type==='stance').length,oldStanceEvents,'No turn-used feedback for opening');
    assert.deepEqual(d.battlers.map(b=>b.hp),health);assert(d.battlers.every(b=>b._wws.recovery===0));
    // The first scheduled player turn still offers an attack; changing forms
    // on that turn costs it exactly as in later rounds.
    d.pending=[a,e];BattleManager.wwsNext();assert.equal(d.mode,'action');
    BattleManager.wwsChooseAction('Change Stance');
    const next=forms.find(form=>form!==playerForm);
    Math.random=()=>{throw Error('Paid form changes do not roll randomness')};
    BattleManager.wwsChooseStance(next);
    assert.equal(a._wws.stance,next);assert.equal(d.mode,'advance');assert.equal(d.kind,'Change Stance');
    assert.equal(BattleManager._subject,null);assert.deepEqual(d.pending,[e]);
    assert.deepEqual(d.battlers.map(b=>b.hp),health);
    BattleManager.wwsChooseAction('Heavy Cut','Torso');assert.equal(d.mode,'advance');
    BattleManager.startInput();assert(!d.opening);assert.equal(d.round,2);
    assert.equal(a._wws.stance,next);assert.equal(e._wws.stance,enemyForm);
}
for(const id of practiceIds){
    reset(id,true);let outcome=-1;
    if(BattleManager._wwsDuel.mode==='openingDialogue'){
        $gameMessage.clear();BattleManager.updatePhase(true);
    }
    BattleManager.setEventCallback(result=>outcome=result);
    const d=BattleManager._wwsDuel,members=d.battlers;
    BattleManager.processPartyEscape();assert.equal(outcome,1);assert.equal(d.mode,'finished');
    assert.equal(d.round,0);assert(members.every(b=>!b._wws));
}
console.log('PASS: both opponents, all 55 opening-form combinations including enemy-only Seigan, untimed free selection, first-round initiative, full turns preserved, later changes paid, forms retained and opening retreat');
`);
