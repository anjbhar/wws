// Real RPG Maker MZ combat objects with only rendering/audio boundaries stubbed.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');

module.exports = function createDuelHarness({ feedback = false } = {}) {
    const root = path.resolve(__dirname, '../..');
    const context = vm.createContext({ console, assert: require('node:assert/strict') });
    const run = code => vm.runInContext(code, context);
    run(`
Array.prototype.clone = function(){return this.slice()};
Array.prototype.contains = function(x){return this.includes(x)};
Array.prototype.remove = function(x){const i=this.indexOf(x);if(i>=0)this.splice(i,1);return this};
Number.prototype.clamp = function(a,b){return Math.min(b,Math.max(a,this))};
Math.randomInt = n => Math.floor(Math.random()*n);
String.prototype.format = function(...args){return this.replace(/%([0-9]+)/g,(_,n)=>args[n-1])};
function Window_Base(){this.initialize(...arguments)}; function Window_Command(){this.initialize(...arguments)}; function Window_Options(){};
function Scene_Options(){};function Scene_Battle(){};function Bitmap(){};function Sprite_Battler(){};
function Spriteset_Battle(){};Spriteset_Battle.prototype.createEnemies=function(){};
var Utils={isOptionValid:()=>false};
Window_Options.prototype.addGeneralOptions=function(){};Scene_Options.prototype.maxCommands=()=>7;
Scene_Battle.prototype.createAllWindows=function(){};Scene_Battle.prototype.updateVisibility=function(){};
var Graphics={frameCount:0},AudioManager={stopBgm(){},stopMe(){},replayBgm(){},replayBgs(){}};
var TextManager={defeat:'%1 defeated',victory:'%1 wins',escapeStart:'%1 retreats'};
`);
    for (const file of ['js/rmmz_managers.js', 'js/rmmz_objects.js', 'js/plugins/WWS_Duel.js', 'js/plugins/WWS_DuelTargets.js'])
        run(fs.readFileSync(path.join(root, file), 'utf8'));
    if (feedback) {
        run(`
function Window_BattleLog(){};
Window_BattleLog.prototype.messageSpeed=function(){return 16};
Window_BattleLog.prototype.startAction=function(){this.stockStart=true};
Window_BattleLog.prototype.displayActionResults=function(){this.stockResults=true};
Sprite_Battler.prototype.update=function(){this.x=this._homeX;this.y=this._homeY};
AudioManager.playSe=function(sound){this.sounds.push(sound)};AudioManager.sounds=[];
`);
        run(fs.readFileSync(path.join(root, 'js/plugins/WWS_DuelFeedback.js'), 'utf8'));
    }
    for (const name of ['Actors','Classes','Weapons','Armors','States','Skills','Enemies','Troops','System','Items'])
        context['$data' + name] = JSON.parse(fs.readFileSync(path.join(root, 'data', name + '.json'), 'utf8'));
    run(`
DataManager.isSkill = item => $dataSkills.includes(item);
DataManager.isItem = item => $dataItems.includes(item);
var $gameTemp=new Game_Temp(),$gameSystem=new Game_System(),$gameScreen=new Game_Screen();
var $gameActors=new Game_Actors(),$gameParty=new Game_Party(),$gameTroop=new Game_Troop();
var $gameMessage=new Game_Message();$gameParty.setupStartingMembers();
const log=new Proxy({texts:[],addText(t){this.texts.push(t)}},{get(t,p){return p in t?t[p]:()=>{}}});
// Combat fixtures explicitly confirm neutral opening forms. Pass true to test
// the real opening picker without this convenience confirmation.
function reset(id=6,opening=false){$gameParty._inBattle=false;BattleManager.setup(id,true,true);$gameParty._inBattle=true;BattleManager._logWindow=log;BattleManager._spriteset={isBusy:()=>false};
    $gameParty.battleMembers()[0].recoverAll();$gameTroop.members()[0].recoverAll();BattleManager.startInput();
    if(!opening&&BattleManager._wwsDuel?.mode==='openingDialogue'){
        $gameMessage.clear();BattleManager.updatePhase(true);}
    if(!opening&&BattleManager._wwsDuel?.opening){const random=Math.random;Math.random=()=>0;
        try{while(BattleManager._wwsDuel?.opening)BattleManager.wwsChooseStance(WwsDuelRules.availableStances(WwsDuelRules.actor())[0])}finally{Math.random=random}}}
function tick(n){for(let i=0;i<n;i++)BattleManager.updatePhase(true)}
function resolve(){while(BattleManager._phase==='action')BattleManager.updateAction()}
`);
    return { context, run };
};
