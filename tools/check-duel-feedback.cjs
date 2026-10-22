// Feedback timing is exercised through actual MZ action resolution; only drawing/audio are stubbed.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { run } = require('./lib/duel-harness.cjs')({ feedback: true });
for (const name of ['Sword1','Sword3','Parry','Evasion1'])
    assert(fs.existsSync(path.join(__dirname,'../audio/se',name+'.ogg')),name+' sound exists');
run(`
const f=WwsDuelFeedback;let d,a,e,sprite;
function fresh(){
    reset();d=BattleManager._wwsDuel;[a,e]=d.battlers;AudioManager.sounds=[];
    sprite=new Sprite_Battler();Object.assign(sprite,{_battler:e,_homeX:870,_homeY:500,x:870,y:500});
    f.scene={_spriteset:{findTargetSprite:target=>target===e?sprite:null}};
}
function attack(kind,defenseRoll=.99,woundRoll=.5,area='Torso',subject=a){
    const rolls=[defenseRoll,woundRoll];let count=0;Math.random=()=>{count++;return rolls.shift()};
    d.mode='action';BattleManager._subject=subject;
    const oldImpacts=f.events.filter(event=>event.type==='impact').length;
    BattleManager.wwsChooseAction(kind,area);
    assert.equal(f.events.filter(event=>event.type==='impact').length,oldImpacts,'No impact before action resolution');
    assert(!d.notice.includes('Parried')&&!d.notice.includes('Dodged')&&!d.notice.includes('lands'),'No early outcome reveal');
    BattleManager.updateAction();
    const event=f.events.filter(event=>event.type==='impact').at(-1);
    resolve();return {event,count};
}
fresh();let light=attack('Quick Cut');assert.equal(light.event.damage,140);assert.equal(light.count,2);
assert.equal(f.hitStop,3);assert.equal(AudioManager.sounds.at(-1).name,'Sword1');
const lightDuration=sprite._wwsFeedbackMotion.duration;
fresh();let heavy=attack('Heavy Cut');assert.equal(heavy.event.damage,280);assert.equal(heavy.count,2);
assert.equal(f.hitStop,6);assert.equal(AudioManager.sounds.at(-1).name,'Sword3');assert(sprite._wwsFeedbackMotion.duration>lightDuration);
assert(BattleManager.isBusy(),'Impact and recoil delay the next action');
while(f.hitStop)f.step();sprite.update();assert.notEqual(sprite.x,870,'Hit recoils locally');
for(let frame=0;frame<40;frame++){sprite.update();f.step()}
assert.equal(sprite.x,870);assert.equal(sprite.y,500);assert.equal(f.motionFrames,0);
fresh();const hp=e.hp;const parry=attack('Quick Cut',0);
assert.equal(parry.count,1);assert.equal(parry.event.defense,'Parry');assert.equal(e.hp,hp);assert.equal(AudioManager.sounds.at(-1).name,'Parry');
fresh();const chances=WwsDuelRules.defenseChances(e,a,false);const dodge=attack('Quick Cut',chances.Parry+chances.Dodge/2);
assert.equal(dodge.count,1);assert.equal(dodge.event.defense,'Dodge');assert.equal(f.hitStop,0);assert.equal(AudioManager.sounds.at(-1).name,'Evasion1');
for(let frame=0;frame<13;frame++)sprite.update();assert(sprite.x>870,'Dodge sidesteps away from the player');
for(let frame=0;frame<20;frame++)sprite.update();assert.equal(sprite.x,870);assert.equal(sprite.y,500);
// New/worsened injuries notify; merely refreshing the same injury does not.
fresh();attack('Quick Cut',.99,.5,'Legs');attack('Quick Cut',.99,.5,'Legs');
assert.equal(f.events.filter(event=>event.type==='injury').length,1);
attack('Quick Cut',.99,.99,'Legs');assert.equal(f.events.filter(event=>event.type==='injury').length,2);
assert(f.events.some(event=>event.type==='injury'&&event.text.includes('slower initiative')));
// The protection message appears once, and numbers reflect actual HP lost.
fresh();a.setHp(2);let protectedHit=attack('Heavy Cut',.99,.5,'Torso',e);
assert.equal(a.hp,1);assert.equal(protectedHit.event.damage,1);
protectedHit=attack('Quick Cut',.99,.5,'Torso',e);assert.equal(protectedHit.event.damage,0);
assert.equal(f.events.filter(event=>event.type==='protection').length,1);assert(a.isAlive());
// Player choices are briefly held for a turn cue; no action is spent or auto-selected.
fresh();d.pending=[a];d.mode='advance';Math.random=()=>.5;BattleManager.wwsNext();
assert.equal(d.mode,'action');assert.equal(d.activeBattler,a);assert.equal(f.turnHold,22);
assert(f.events.some(event=>event.type==='turn'&&event.text==='YOUR TURN'));
for(let frame=0;frame<22;frame++)f.step();assert.equal(f.turnHold,0);assert.equal(d.mode,'action');assert.equal(a.numActions(),0);
// Health bars animate monotonically, trail briefly, and settle exactly without RNG.
fresh();const bar=f.health(a);const full=a.hp;a.gainHp(-100);Math.random=()=>{throw Error('Feedback must not roll randomness')};
f.step();assert(bar.value<full&&bar.value>a.hp);assert.equal(bar.trail,full);
let previous=bar.value;
for(let frame=0;frame<160;frame++){f.step();assert(bar.value<=previous&&bar.value>=a.hp);previous=bar.value;}
assert.equal(bar.value,a.hp);assert.equal(bar.trail,a.hp);
// The custom log has one wind-up and no stock animation, popup, or Miss duplication.
const battleLog=new Window_BattleLog();battleLog.methods=[];battleLog.push=function(...args){this.methods.push(args)};
battleLog.startAction(a,{},[e]);assert(!battleLog.methods.some(method=>method[0]==='showAnimation'));
battleLog.displayActionResults(a,e);assert(!battleLog.methods.some(method=>method[0]==='popupDamage'));
BattleManager.endBattle(1);assert.equal(f.events.length,0);assert.equal(f.bars.size,0);assert.equal(f.scene,null);assert.equal(f.hitStop,0);
BattleManager.setup(1,true,true);battleLog.startAction(a,{},[e]);battleLog.displayActionResults(a,e);
assert(battleLog.stockStart&&battleLog.stockResults,'Stock log and effects retain their original handlers');
`);
console.log('PASS: duel feedback: impact timing, sound distinctions, recoil/dodge return, single damage/defense labels, injury changes, one-time protection, turn cues, Health easing, cleanup and stock fallback');
