// Feedback timing is exercised through actual MZ action resolution; only drawing/audio are stubbed.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { run } = require('./lib/duel-harness.cjs')({ feedback: true });
for (const name of ['Sword5','Parry','Evasion1'])
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
assert.deepEqual(light.event.blood,{duration:18,count:10,travel:32});
assert.equal(f.hitStop,3);assert.equal(AudioManager.sounds.at(-1).name,'Sword5');
const lightSound=AudioManager.sounds.at(-1);
const lightDuration=sprite._wwsFeedbackMotion.duration;
fresh();let heavy=attack('Heavy Cut');assert.equal(heavy.event.damage,280);assert.equal(heavy.count,2);
assert.deepEqual(heavy.event.blood,{duration:22,count:16,travel:48});
assert.equal(f.hitStop,6);assert.equal(AudioManager.sounds.at(-1).name,'Sword5');assert(sprite._wwsFeedbackMotion.duration>lightDuration);
assert(AudioManager.sounds.at(-1).pitch<lightSound.pitch,'Heavy Cut uses a lower pitch');
assert(AudioManager.sounds.at(-1).volume>lightSound.volume,'Heavy Cut uses a higher volume');
assert(BattleManager.isBusy(),'Impact and recoil delay the next action');
while(f.hitStop)f.step();sprite.update();assert.notEqual(sprite.x,870,'Hit recoils locally');
for(let frame=0;frame<40;frame++){sprite.update();f.step()}
assert.equal(sprite.x,870);assert.equal(sprite.y,500);assert.equal(f.motionFrames,0);
fresh();const hp=e.hp;const parry=attack('Quick Cut',0);
assert.equal(parry.count,1);assert.equal(parry.event.defense,'Parry');assert.equal(e.hp,hp);assert.equal(AudioManager.sounds.at(-1).name,'Parry');
assert.equal(parry.event.blood,null);
fresh();const chances=WwsDuelRules.defenseChances(e,a,false);const dodge=attack('Quick Cut',chances.Parry+chances.Dodge/2);
assert.equal(dodge.count,1);assert.equal(dodge.event.defense,'Dodge');assert.equal(f.hitStop,0);assert.equal(AudioManager.sounds.at(-1).name,'Evasion1');
assert.equal(dodge.event.blood,null);
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
assert(protectedHit.event.blood,'Actual Health loss at the practice floor still sprays');
protectedHit=attack('Quick Cut',.99,.5,'Torso',e);assert.equal(protectedHit.event.damage,0);
assert.equal(protectedHit.event.blood,null,'Zero-loss practice hits have no blood');
assert.equal(f.events.filter(event=>event.type==='protection').length,1);assert(a.isAlive());
// Player choices are briefly held for a turn cue; no action is spent or auto-selected.
fresh();d.pending=[a];d.mode='advance';Math.random=()=>.5;BattleManager.wwsNext();
assert.equal(d.mode,'action');assert.equal(d.activeBattler,a);assert.equal(f.turnHold,22);
assert(f.events.some(event=>event.type==='turn'&&event.text==='YOUR TURN'));
for(let frame=0;frame<22;frame++)f.step();assert.equal(f.turnHold,0);assert.equal(d.mode,'action');assert.equal(a.numActions(),0);
// Dialogue preserves fighter information while suspending action choices.
fresh();d.mode='action';f.turnHold=0;
const scene=new Scene_Battle();
const hiddenWindow=()=>({hide(){this.visible=false},deactivate(){this.active=false}});
Object.assign(scene,{_statusWindow:hiddenWindow(),_partyCommandWindow:hiddenWindow(),_actorCommandWindow:hiddenWindow(),
    _duelHud:{refresh(){this.refreshed=true}},_duelCards:{setMode(mode){this.mode=mode}},_logWindow:{visible:true}});
$gameMessage.add('Hold your form.');scene.updateVisibility();
assert.equal(scene._duelHud.visible,true,'Health and fighter information remain visible during dialogue');
assert.equal(scene._duelHud.refreshed,true);assert.equal(scene._duelCards.mode,'message','Action choices stay suspended');
$gameMessage.clear();scene.updateVisibility();assert.equal(scene._duelCards.mode,'action');
d.mode='finished';scene.updateVisibility();assert.equal(scene._duelHud.visible,false,'Finished battles still hide the HUD');
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
const vm = require('node:vm');
const drawing = vm.createContext({assert});
vm.runInContext(`
class Window_Base {initialize(){}};
class Scene_Battle {createAllWindows(){}};
class Sprite_Battler {update(){}};
class Window_BattleLog {};
class Rectangle {};
const Graphics={boxWidth:1104,boxHeight:624};
const BattleManager={_wwsDuel:{battlers:[]},setup(){},endBattle(){}};
const AudioManager={playSe(){}};
`,drawing);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/plugins/WWS_DuelFeedback.js'),'utf8'),drawing);
vm.runInContext(`
// Exercise the procedural overlay without launching MZ or loading graphics.

const bloodScene=new Scene_Battle();bloodScene.addChild=function(window){this.overlay=window};
bloodScene.createAllWindows();const overlay=bloodScene.overlay;
const a={isActor:()=>true,hp:100},e={isActor:()=>false,hp:100};
const f=WwsDuelFeedback;
function impact(heavy,damage=10,defense=null){f.impact({target:e,heavy,damage,defense});return {event:f.events.at(-1)}}
const light=impact(false),heavy=impact(true),parry=impact(false,0,'Parry'),dodge=impact(false,0,'Dodge'),protectedHit=impact(false,0);
const draws=[],translations=[];let textureUpdates=0;
const canvas={save(){},restore(){},translate(x,y){translations.push([x,y])},beginPath(){},moveTo(){},
    lineTo(){},stroke(){},arc(x,y,r){draws.push({x,y,r,alpha:this.globalAlpha})},fill(){}};
overlay.contents={context:canvas,baseTexture:{update(){textureUpdates++}}};
Math.random=()=>{throw Error('Blood must not roll randomness')};
for(const target of [a,e]){
    const event={...light.event,target};draws.length=0;
    overlay.blood(event,{x:321,y:234},9);
    assert.equal(draws.length,10);assert.deepEqual(translations.at(-1),[321,234]);
    assert(draws.every(p=>target.isActor()?p.x<0:p.x>0),'Spray mirrors away from either fighter');
    assert(draws.every(p=>Math.abs(p.x)<30&&Math.abs(p.y)<20),'Quick spray stays local');
    assert(draws.every(p=>p.alpha>=.85&&p.r>=2.2),'Midlife droplets remain visible after leaving the glint');
    const quickAlpha=draws[0].alpha,quickTravel=Math.max(...draws.map(p=>Math.abs(p.x)));
    draws.length=0;overlay.blood({...heavy.event,target},{x:321,y:234},11);
    assert.equal(draws.length,16);assert(Math.max(...draws.map(p=>Math.abs(p.x)))>quickTravel);
    draws.length=0;overlay.blood(event,{x:321,y:234},17);
    assert(draws[0].alpha<quickAlpha,'Droplets fade during travel');
}
const beforeExpired=textureUpdates;
for(const event of [light.event,heavy.event,parry.event,dodge.event,protectedHit.event])
    overlay.blood(event,{x:321,y:234},event.blood?.duration||0);
assert.equal(textureUpdates,beforeExpired,'Expired sprays, defenses and zero damage draw nothing');

// Solo and party scenes never add a ground layer, even after repeated hits.
for(const count of [2,6]){
    f.reset();
    const targets=Array.from({length:count},(_,i)=>({isActor:()=>i<count/2,hp:100}));
    const sprites=targets.map(()=>({}));
    const field={children:sprites.slice(),addChildAt(){throw Error('Ground blood must not create a layer')}};
    const scene=new Scene_Battle();scene.addChild=function(window){this.overlay=window};
    scene._spriteset={_battleField:field,findTargetSprite:t=>sprites[targets.indexOf(t)]};
    BattleManager._wwsDuel={battlers:targets};scene.createAllWindows();
    for(const target of targets)for(let hit=0;hit<20;hit++)f.impact({target,damage:10,heavy:hit%2===0});
    for(let frame=0;frame<100;frame++)f.step();
    assert.deepEqual(field.children,sprites,'Battlefield keeps only its original fighters');
    assert.equal(f.events.length,0,'Impact spray expires without persistent blood');
    BattleManager.endBattle(0);assert.equal(f.events.length,0);
}

`,drawing);
console.log('PASS: duel feedback: no ground layer or persistent blood in solo/party battles; blood spray, combat timing/randomness, defenses, practice protection and stock fallback');
