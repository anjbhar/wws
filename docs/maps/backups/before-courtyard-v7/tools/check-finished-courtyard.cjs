const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
if(JSON.parse(fs.readFileSync(path.join(root,'data/Map001.json'),'utf8')).note.includes('wws:dojo-courtyard-v6')) {
    require('./verify-courtyard-v6.cjs');return;
}
const read=n=>JSON.parse(fs.readFileSync(path.join(root,'data',n+'.json'),'utf8'));
const m=read('Map001'),sets=read('Tilesets'),system=read('System'),set=sets[m.tilesetId];
assert(m.note.includes('wws:dojo-courtyard-v5'));
assert.deepEqual([m.width,m.height,m.data.length],[25,19,25*19*6]);
assert.deepEqual(set.tilesetNames,['','','','','EdoCourtyard_A5-v1','','','EdoRedWoodExterior_D-v4','EdoCourtyard_E-v1']);
for(const n of set.tilesetNames.filter(Boolean))assert(fs.existsSync(path.join(root,'img/tilesets',n+'.png')));
for(const t of m.data)assert(t===0||(t>=512&&t<640)||(t>=768&&t<896)||(t>=1536&&t<1664),'Custom tile '+t);
const c=vm.createContext({console,assert,ImageManager:{isObjectCharacter:n=>n.startsWith('!'),isZeroParallax:()=>false},$dataMap:m,$dataTilesets:sets,$dataSystem:system,
 $dataCommonEvents:[],$gameSwitches:{value:()=>false},$gameVariables:{value:()=>0},$gameSelfSwitches:{value:()=>false},
 $gameParty:{hasItem:()=>false,members:()=>[],maxBattleMembers:()=>1,inBattle:()=>false},$gameTemp:{clearDestination:()=>{},isPlaytest:()=>false},Input:{isPressed:()=>false},
 $gameScreen:{clearZoom:()=>{}},$gameMessage:{isBusy:()=>false},
 Graphics:{width:1280,height:720},Utils:{isOptionValid:()=>false}});
vm.runInContext('Array.prototype.contains=Array.prototype.includes;Array.prototype.clone=function(){return this.slice()};Number.prototype.mod=function(n){return (this%n+n)%n};Number.prototype.clamp=function(a,b){return Math.min(Math.max(this,a),b)};Math.randomInt=n=>0;',c);
vm.runInContext(fs.readFileSync(path.join(root,'js/rmmz_objects.js'),'utf8'),c);
vm.runInContext(`var $gameMap=new Game_Map();$gameMap.setup(1);var $gamePlayer=new Game_Player();
$gamePlayer.locate(${system.startX},${system.startY});
var queue=[[$gamePlayer.x,$gamePlayer.y]],seen=new Set(queue.map(p=>p.join(',')));
for(var i=0;i<queue.length;i++)for(var d of [2,4,6,8]) {
 var [x,y]=queue[i];$gamePlayer.locate(x,y);
 var nx=$gameMap.roundXWithDirection(x,d),ny=$gameMap.roundYWithDirection(y,d),key=nx+','+ny;
 if(!seen.has(key)&&$gamePlayer.canPass(x,y,d)){seen.add(key);queue.push([nx,ny])}
}
for(var p of [[11,4],[12,4],[12,10],[16,11],[11,18],[12,18],[4,7],[6,8],[20,6]])assert(seen.has(p.join(',')),'Reachable '+p);
for(var p of [[12,1],[12,3],[0,8],[24,8],[4,6],[6,7],[20,5],[19,5],[10,17],[13,17],[5,17]])assert(!seen.has(p.join(',')),'Blocked '+p);
assert(queue.length>200,'Broad connected open yard');`,c);
const before=JSON.parse(fs.readFileSync(path.join(root,'docs/maps/backups/before-finished-courtyard/Map001.json'),'utf8'));
for(const tag of ['wws:samurai-sparring','wws:shinsengumi-npc']) {
 const old=before.events.find(e=>e&&e.note===tag),now=m.events.find(e=>e&&e.note===tag);
 assert.deepEqual(now,old,'Unchanged NPC '+tag);
 assert(fs.existsSync(path.join(root,'img/characters',now.pages[0].image.characterName+'.png')));
}
for(const e of m.events.filter(Boolean))for(const p of e.pages)for(const cmd of p.list)if(cmd.code===201){
 const [,id,x,y]=cmd.parameters,f=path.join(root,'data/Map'+String(id).padStart(3,'0')+'.json');
 assert(fs.existsSync(f),'Transfer map exists');const target=JSON.parse(fs.readFileSync(f));
 assert(x>=0&&y>=0&&x<target.width&&y<target.height);
}
for(let y=0;y<4;y++)for(let x=0;x<6;x++)assert.equal(m.data[(2*m.height+y)*m.width+9+x],512+(y+1)*8+x);
assert(set.flags[520]&16);assert(set.flags[768]&16);
console.log('PASS: real-engine movement, prop collision, gate passage, NPC/dojo routes, custom references, original hall and unchanged sparring events');
