const { context, run } = require('./lib/duel-harness.cjs')({ feedback: true });
context.teamTroopId = context.$dataTroops.find(t => t?.name.includes('[WWS Monk Group]')).id;
run(`
function prepare(hp) {
    reset();
    const d = BattleManager._wwsDuel, [a,e] = d.battlers;
    e.setHp(hp); d.mode = 'action'; BattleManager._subject = a; d.activeBattler = a;
    return {d,a,e};
}
for (const hp of [1,199]) for (const roll of [0,.5,.99]) for (const area of ['Head','Torso','Arms','Legs']) {
    const {d,a,e} = prepare(hp);
    Math.random = () => roll;
    assert(WwsDuelRules.canExecute(a,e));
    assert.equal(WwsDuelRules.cutName(a,e,'Quick Cut'),'Execute');
    assert(Object.values(WwsDuelTargets.hitChances(a,e,false)).every(chance => chance === 1));
    BattleManager.wwsChooseAction('Quick Cut');
    assert.equal(d.mode,'animation','Execute skips body selection');
    assert.equal(d.kind,'Execute'); assert.equal(d.defense,null);
    resolve();
    assert.equal(e.hp,0); assert(e.isDead()); assert(!e.result().evaded);
    assert.equal(a._wws.recovery,0);
    const impact = WwsDuelFeedback.events.find(event => event.type === 'impact');
    assert(impact.execute); assert.equal(impact.area,'Neck');
    assert.deepEqual(impact.blood,{duration:40,count:24,travel:84});
}
for (const hp of [200,201]) {
    const {d,a,e} = prepare(hp);
    Math.random = () => 0;
    assert(!WwsDuelRules.canExecute(a,e));
    BattleManager.wwsChooseAction('Quick Cut','Torso');
    assert.equal(d.kind,'Quick Cut'); assert(d.defense);
    resolve(); assert.equal(e.hp,hp);
}
{
    const {d,a,e} = prepare(199);
    Math.random = () => 0;
    assert(!WwsDuelRules.canExecute(a,e,'Heavy Cut'));
    BattleManager.wwsChooseAction('Heavy Cut','Torso');
    assert.equal(d.kind,'Heavy Cut'); assert(d.defense);
    resolve(); assert.equal(e.hp,199); assert.equal(a._wws.recovery,8);
}
{
    const {d,a,e} = prepare(199);
    a.setHp(199); d.mode = 'advance'; BattleManager._subject = e;
    assert(!WwsDuelRules.canExecute(e,a));
    Math.random = () => 0;
    BattleManager.wwsChooseAction('Quick Cut','Torso');
    assert.equal(d.kind,'Quick Cut'); resolve();
}
reset(teamTroopId);
{
    const d = BattleManager._wwsDuel, a = d.allies[0], enemies = WwsDuelRules.enemies();
    enemies.forEach(e => e.setHp(199));
    d.mode = 'action'; BattleManager._subject = a; d.activeBattler = a;
    BattleManager.wwsChooseAction('Quick Cut'); assert.equal(d.mode,'opponent');
    BattleManager.wwsChooseOpponent(enemies[1].index());
    assert.equal(d.mode,'animation','Choosing an eligible opponent executes immediately');
    resolve();
    assert(enemies[1].isDead()); assert(enemies[0].isAlive()); assert(enemies[2].isAlive());
}
// Execute starts the enemy collapse immediately, alongside the spray.
var collapseTarget = WwsDuelRules.enemies()[1], collapsed = 0;
collapseTarget.performCollapse = () => collapsed++;
const battleLog = new Window_BattleLog();
battleLog.push = () => {};
BattleManager._wwsDuel.kind = 'Execute';
battleLog.displayActionResults(BattleManager._subject,collapseTarget);
assert.equal(collapsed,1);
`);

// Exercise neck placement and procedural spray without starting the game.
const fs = require('node:fs'), vm = require('node:vm');
const drawing = vm.createContext({assert:require('node:assert/strict')});
drawing.executeRule = context.WwsDuelRules.canExecute;
vm.runInContext(`
class Window_Base {initialize(){}}; class Scene_Battle {createAllWindows(){}};
class Sprite_Battler {update(){}}; class Window_BattleLog {}; class Rectangle {};
class Point {constructor(x,y){this.x=x;this.y=y}};
const Graphics={boxWidth:1280,boxHeight:720};
const BattleManager={_wwsDuel:{battlers:[]},setup(){},endBattle(){}};
const $gameSystem={isSideView:()=>false};
const WwsDuelRules={pose:()=> 'Chudan',actor:()=>({isActor:()=>true}),canExecute:executeRule,spriteLayout:()=>({crown:20,anchorY:1,height:288})};
var WwsDuelTargets={regions:()=>({Head:[[140,70,24,28]]})};
`,drawing);
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../js/plugins/WWS_DuelFeedback.js'),'utf8'),drawing);
vm.runInContext(`
const scene=new Scene_Battle(); scene.addChild=w=>scene.overlay=w;scene.createAllWindows();
const target={isActor:()=>false};
const sprite={bitmap:{width:288,height:288},anchor:{x:.5,y:1},toGlobal:p=>({x:p.x+800,y:p.y+500})};
scene._spriteset={findTargetSprite:()=>sprite};
const point=scene.overlay.point(target,'Neck');
assert.equal(point.x,796); assert.equal(point.y,500-288+70+28*.7);
const f=WwsDuelFeedback; f.scene=null;
f.impact({target,execute:true,damage:199,defense:null});
let droplets=0;
const canvas={save(){},restore(){},translate(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){droplets++},fill(){}};
scene.overlay.contents={context:canvas,baseTexture:{update(){}}};
Math.random=()=>{throw Error('Visual effects must not roll combat randomness')};
scene.overlay.blood(f.events.at(-1),point,20);assert.equal(droplets,24);
scene.overlay.blood(f.events.at(-1),point,40);assert.equal(droplets,24,'Spray ends after fade');
// Markers use the same eligibility rule as Execute and clear on the next redraw.
f.scene=scene; sprite.visible=true; sprite.opacity=255;
Object.assign(target,{isEnemy:()=>true,isAlive:()=>target.hp>0,hp:199});
const markers=[];
Object.assign(scene.overlay.contents,{fontFace:'Arial',drawText(...args){markers.push({args,color:this.textColor,font:this.fontFace})}});
scene.overlay.executeMarker(target);
assert.equal(markers.length,1);assert.equal(markers[0].args[0],'\u6b7b');
assert.equal(markers[0].color,'#e52b35');assert(markers[0].font.includes('Yu Mincho'));
const torso=scene.overlay.point(target,'Torso');
assert.equal(markers[0].args[1]+32,torso.x,'Marker centers horizontally on the enemy torso');
assert.equal(markers[0].args[2]+28,torso.y,'Marker centers vertically on the enemy torso');
assert.equal(scene.overlay.contents.fontFace,'Arial','Marker restores text styling');
for(const hp of [200,201,0]) {target.hp=hp;scene.overlay.executeMarker(target);}
assert.equal(markers.length,1,'No marker at 200 HP or on defeated enemies');
target.hp=199;sprite.visible=false;scene.overlay.executeMarker(target);
assert.equal(markers.length,1,'Invisible enemies do not show markers');
sprite.visible=true;
const d=BattleManager._wwsDuel;
Object.assign(d,{multi:true,mode:'action',kind:'Quick Cut',enemyPreview:target,enemyTarget:target});
scene.overlay.executeMarker(target);
assert.equal(markers.length,2,'Execute-range marker stays visible in the team action menu');
d.mode='opponent';d.enemyPreview={};scene.overlay.executeMarker(target);
assert.equal(markers.length,3,'Untargeted executable enemies stay marked');
d.enemyPreview=target;scene.overlay.executeMarker(target);
assert.equal(markers.length,4,'Highlighted executable opponent stays marked');
target.hp=200;scene.overlay.executeMarker(target);
assert.equal(markers.length,4,'Highlighted healthy opponent does not show marker');
target.hp=199;d.kind='Heavy Cut';scene.overlay.executeMarker(target);
assert.equal(markers.length,5,'Execute-range marker stays visible while choosing a heavy attack');
d.kind='Quick Cut';d.mode='target';scene.overlay.executeMarker(target);
assert.equal(markers.length,6,'Selected executable body target stays marked');
d.mode='animation';scene.overlay.executeMarker(target);
assert.equal(markers.length,7,'Execute-range marker stays visible when targeting ends');
`,drawing);
console.log('Execute checks passed: automatic targeting, threshold, sure hit, group selection, neck spray, collapse, and red death markers.');
