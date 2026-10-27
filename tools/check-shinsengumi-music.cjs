const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({ assert });
const run = code => vm.runInContext(code, context);
run(`
var Graphics={frameCount:12},Utils={encodeURI:encodeURIComponent};
function Bitmap(){}
class WebAudio {
  constructor(url){this.url=url;WebAudio.created.push(this)}
  play(loop,pos){this.loop=loop;this.pos=pos}
  seek(){return 27}
  destroy(){this.destroyed=true}
  fadeIn(){}
}
WebAudio.created=[];
function Scene_Map(){}
Scene_Map.prototype.start=function(){this.started=true};
Scene_Map.prototype.startEncounterEffect=function(){this.transitionStarted=true};
var WwsDuelRules={enemySpriteSet:b=>b?.spriteSet};
`);
run(fs.readFileSync(path.join(root, 'js/rmmz_managers.js'), 'utf8'));
run(fs.readFileSync(path.join(root, 'js/plugins/WWS_ShinsengumiMusic.js'), 'utf8'));
run(`
$gameSystem={battleBgm:()=>({name:'Battle1',volume:90,pitch:100,pan:0})};
const map=new Scene_Map();
map.start();
assert.equal(map.started,true);
const preloaded=WebAudio.created[0];
assert.equal(preloaded.url,'audio/bgm/azianmaddoxx-samurai-423024.mp3');
assert.equal(preloaded.loop,undefined,'Preloading must not start playback');
map.start();
assert.equal(WebAudio.created.length,1,'Map starts reuse the pending preload');
AudioManager.playBgm({name:'Town1',volume:90,pitch:100,pan:0},27);
BattleManager.saveBgmAndBgs();
BattleManager._wwsDuel={battlers:[{}, {spriteSet:'Shinsengumi'}]};
map.startEncounterEffect();
assert.equal(map.transitionStarted,true);
assert.equal(AudioManager._bgmBuffer,preloaded,'Encounter starts the preloaded track');
assert.equal(AudioManager._bgmBuffer.url,'audio/bgm/azianmaddoxx-samurai-423024.mp3');
assert.equal(AudioManager._bgmBuffer.loop,true);
assert.equal(AudioManager._bgmBuffer.volume,.8);
assert.equal(AudioManager._bgmBuffer.pos,10.67,'Skip the opening section');
const phaseOneMusic=AudioManager._bgmBuffer;
// MZ requests battle music during both the encounter transition and scene start.
AudioManager._bgmBuffer.pos=12;
BattleManager.playBattleBgm();
assert.equal(AudioManager._bgmBuffer,phaseOneMusic);
assert.equal(AudioManager._bgmBuffer.pos,12,'Repeated battle start must not restart playback');
BattleManager._wwsDuel.battlers[1].twoSword=true;
assert.equal(AudioManager._bgmBuffer,phaseOneMusic);
BattleManager.replayBgmAndBgs();
assert.equal(AudioManager._bgmBuffer.url,'audio/bgm/Town1.ogg');
assert.equal(AudioManager._bgmBuffer.pos,27);
map.start();
assert.notEqual(WebAudio.created.at(-1),preloaded,'Returning to the map preloads the next battle');
for (const spriteSet of ['WarriorMonkMasked', 'WarriorMonkUnmasked']) {
  BattleManager._wwsDuel={battlers:[{}, {}, {}, {spriteSet}, {spriteSet}, {spriteSet}]};
  BattleManager.saveBgmAndBgs();
  map.startEncounterEffect();
  assert.equal(AudioManager._bgmBuffer.url,'audio/bgm/azianmaddoxx-samurai-423024.mp3');
  assert.equal(AudioManager._bgmBuffer.pos,10.67,'Monk fights use the same intro skip');
  assert.equal(AudioManager._bgmBuffer.loop,true);
  assert.equal(AudioManager._bgmBuffer.volume,.8);
  const monkMusic=AudioManager._bgmBuffer;
  monkMusic.pos=12;
  BattleManager.playBattleBgm();
  assert.equal(AudioManager._bgmBuffer,monkMusic);
  assert.equal(monkMusic.pos,12,'Monk scene start must not restart playback');
  BattleManager.replayBgmAndBgs();
  assert.equal(AudioManager._bgmBuffer.url,'audio/bgm/Town1.ogg');
  map.start();
}
for(const duel of [null,{battlers:[{},{spriteSet:'SamuraiInstructor'}]}]) {
  BattleManager._wwsDuel=duel;
  const before=AudioManager._bgmBuffer;
  map.startEncounterEffect();
  assert.equal(AudioManager._bgmBuffer,before,'Other encounters retain stock music timing');
  BattleManager.playBattleBgm();
  assert.equal(AudioManager._bgmBuffer.url,'audio/bgm/Battle1.ogg');
}
assert.equal(AudioManager.createBuffer('se/','Sword1').url,'audio/se/Sword1.ogg');
`);
const asset = fs.readFileSync(path.join(root, 'audio/bgm/azianmaddoxx-samurai-423024.mp3'));
assert(asset.length > 1000000);
assert(asset.subarray(0, 3).toString() === 'ID3' || asset[0] === 255, 'Expected MP3 header');
const plugins = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'js/plugins.js'), 'utf8'), plugins);
assert(plugins.$plugins.some(plugin => plugin.name === 'WWS_ShinsengumiMusic' && plugin.status));
console.log('PASS: Shinsengumi and monk MP3 selection, intro skip, no duplicate restart, looping, volume, map music restoration, stock battle/audio fallback and enabled plugin');
