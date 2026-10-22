const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
// Keep the practice scene scoped to Masanori and preserve stock framing elsewhere.
const backdrop=vm.createContext({assert:require('node:assert/strict')});
vm.runInContext(`
function Sprite_Battleback() {this.scale={x:1,y:1};this.bitmap={width:1280,height:720,smooth:true};}
Sprite_Battleback.prototype.battleback1Name=function(){return 'stock-ground'};
Sprite_Battleback.prototype.battleback2Name=function(){return 'stock-wall'};
Sprite_Battleback.prototype.adjustPosition=function(){this.stockPosition=true};
var troopId=6,$gameTroop={troop:()=>({id:troopId})},Graphics={width:1280,height:720};
`,backdrop);
vm.runInContext(fs.readFileSync(path.join(root,'js/plugins/WWS_PracticeBackdrop.js'),'utf8'),backdrop);
vm.runInContext(`
const s=new Sprite_Battleback();assert.equal(s.battleback1Name(),'EdoPracticeCourtyard-v1');
assert.equal(s.battleback2Name(),'');s.adjustPosition();
assert.equal(s.x,0);assert.equal(s.y,0);assert.equal(s.width,1280);assert.equal(s.height,720);
assert.equal(s.scale.x,1);assert.equal(s.scale.y,1);assert.equal(s.bitmap.smooth,false);
troopId=1;assert.equal(s.battleback1Name(),'stock-ground');assert.equal(s.battleback2Name(),'stock-wall');
s.adjustPosition();assert.equal(s.stockPosition,true);
`,backdrop);
const backgroundPng=fs.readFileSync(path.join(root,'img/battlebacks1/EdoPracticeCourtyard-v1.png'));
assert.equal(backgroundPng.readUInt32BE(16),1280);assert.equal(backgroundPng.readUInt32BE(20),720);
const read=name=>JSON.parse(fs.readFileSync(path.join(root,'data',name+'.json'),'utf8'));
const m=read('Map001'),event=m.events.find(e=>e && e.note==='wws:samurai-sparring');
assert(event,'Sparring NPC exists');assert.equal(event.pages[0].trigger,0);assert.equal(event.pages[0].priorityType,1);
const list=event.pages[0].list,battle=list.find(c=>c.code===301),troops=read('Troops'),enemies=read('Enemies'),skills=read('Skills'),animations=read('Animations');
assert.equal(battle.parameters[2],true);assert.equal(battle.parameters[3],true);
const troop=troops[battle.parameters[1]],enemy=enemies[troop.members[0].enemyId],skill=skills[enemy.actions[0].skillId],animation=animations[skill.animationId];
assert.equal(enemy.exp,0);assert.equal(enemy.gold,0);assert(enemy.dropItems.every(d=>d.kind===0));
for(const file of ['img/characters/'+event.pages[0].image.characterName+'.png','img/enemies/'+enemy.battlerName+'.png','effects/'+animation.effectName+'.efkefc'])assert(fs.existsSync(path.join(root,file)),file);
for(const pose of ['Chudan','Jodan','Gedan','Kasumi','Waki']){
  const file=path.join(root,'img/enemies/SamuraiInstructor-'+pose+'-v1.png');
  const png=fs.readFileSync(file);assert.equal(png.subarray(1,4).toString(),'PNG');
  assert.equal(png.readUInt32BE(16),288);assert.equal(png.readUInt32BE(20),288);
  assert.equal(png[25],6,'Stance sprite has an RGBA channel: '+pose);
}
const playerPng=fs.readFileSync(path.join(root,'img/battlers/Samurai-ChudanBack-v1.png'));
assert.equal(playerPng.readUInt32BE(16),320);assert.equal(playerPng.readUInt32BE(20),320);
assert.equal(playerPng[25],6,'Player battle preview uses RGBA');
for(const pose of ['Chudan','Jodan','Gedan','Kasumi','Waki']){
  const png=fs.readFileSync(path.join(root,'img/battlers/Samurai-'+pose+'Back-v2.png'));
  assert.equal(png.readUInt32BE(16),480);assert.equal(png.readUInt32BE(20),384);
  assert.equal(png[25],6,'Player form uses RGBA: '+pose);
}
const sets=read('Tilesets'),flags=sets[m.tilesetId].flags;
function passage(x,y,bit){for(let z=3;z>=0;z--){const flag=flags[m.data[(z*m.height+y)*m.width+x]];if(flag&16)continue;if(!(flag&bit))return true;if(flag&bit)return false;}return false;}
assert(passage(event.x,event.y+1,8),'Tile directly south of NPC is approachable');
const system=read('System');
const q=[[system.startX,system.startY]],seen=new Set(q.map(p=>p.join(',')));
for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy,bit,rev]of [[0,1,1,8],[-1,0,2,4],[1,0,4,2],[0,-1,8,1]]){const nx=x+dx,ny=y+dy,key=nx+','+ny;if(nx<0||ny<0||nx>=m.width||ny>=m.height||seen.has(key)||(nx===event.x&&ny===event.y))continue;if(passage(x,y,bit)&&passage(nx,ny,rev)){seen.add(key);q.push([nx,ny]);}}}
assert(seen.has(event.x+','+(event.y+1)),'NPC is reachable from spawn');

// Execute the saved event using MZ's actual interpreter, with only UI/battle boundaries stubbed.
function check(choice,result){
  const calls={texts:[],recoveries:0,battles:0};
  const context=vm.createContext({console,Graphics:{frameCount:0},ImageManager:{loadFace:()=>{}},Scene_Battle:function(){},$dataTroops:troops,
    $gameMap:{mapId:()=>1},$gameParty:{inBattle:()=>false,members:()=>[{recoverAll:()=>calls.recoveries++}]},
    $gamePlayer:{makeEncounterCount:()=>{}},$gameActors:{actor:()=>null},
    $gameMessage:{isBusy:()=>false,setFaceImage:()=>{},setBackground:()=>{},setPositionType:()=>{},setSpeakerName:()=>{},add:t=>calls.texts.push(t),setChoices:()=>{},setChoiceBackground:()=>{},setChoicePositionType:()=>{},setChoiceCallback:fn=>fn(choice)},
    BattleManager:{setup:(id,escape,lose)=>{assert.equal(id,troop.id);assert(escape&&lose);calls.battles++;},setEventCallback:fn=>fn(result)},SceneManager:{push:()=>{}},listJson:JSON.stringify(list)});
  vm.runInContext('Array.prototype.clone=function(){return this.slice();};',context);
  vm.runInContext(fs.readFileSync(path.join(root,'js/rmmz_objects.js'),'utf8'),context);
  vm.runInContext('var list=JSON.parse(listJson);var interpreter=new Game_Interpreter();interpreter.setup(list,4);var steps=0;while(interpreter.isRunning()){if(++steps>100)throw Error("Interpreter did not finish");interpreter.executeCommand();}',context);
  if(choice===1){assert.equal(calls.battles,0);assert.equal(calls.recoveries,0);assert(calls.texts.includes('I will be here when you are ready.'));}
  else {assert.equal(calls.battles,1);assert.equal(calls.recoveries,2);const outcomes=['Well struck. Come back whenever you wish to practice.','There is no shame in stepping back. Try again when ready.','Keep your guard steady. Rest a moment, then try again.'];assert(calls.texts.includes(outcomes[result]));assert(!calls.texts.includes('I will be here when you are ready.'));for(let i=0;i<3;i++)if(i!==result)assert(!calls.texts.includes(outcomes[i]));}
  return {choice,result,battles:calls.battles,recoveries:calls.recoveries};
}
console.log(JSON.stringify({npcReachable:true,assets:'present',interpreterBranches:[check(1,0),check(0,0),check(0,1),check(0,2)]}));
