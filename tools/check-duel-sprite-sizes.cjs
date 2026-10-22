const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const { run, context } = require('./lib/duel-harness.cjs')();
run(`
const layouts=[];
function near(a,b){assert(Math.abs(a-b)<1e-8, a+' != '+b)}
for(const troopId of [6,7]) {
  reset(troopId);
  const [actor,enemy]=BattleManager._wwsDuel.battlers;
  for(const b of troopId===6?[actor,enemy]:[enemy]) {
    const neutral=WwsDuelRules.spriteLayout(b,'Chudan');
    const poses=[...WwsDuelRules.stances,...(troopId===7?['Seigan']:[])];
    for(const pose of poses) {
      const layout=WwsDuelRules.spriteLayout(b,pose);
      near((layout.foot-layout.crown)*layout.scale,neutral.foot-neutral.crown);
      near((layout.foot-layout.anchorY*layout.height)*layout.scale,-neutral.baseline);
      const sprite={scale:{x:1,y:1},anchor:{x:.5,y:1}};
      WwsDuelRules.applySpriteLayout(sprite,b,pose);
      near(sprite.scale.x,layout.scale);near(sprite.scale.y,layout.scale);
      near(sprite.anchor.y,layout.anchorY);assert.equal(sprite.anchor.x,.5);
      layouts.push({file:b.isActor()?'img/battlers/Samurai-'+pose+'Back-v2.png':
        'img/enemies/'+WwsDuelRules.enemyImage(b,pose)+'.png',pose,...layout});
    }
    // Exercise the actual enemy-rendering hook across stance and reaction swaps.
    if(b.isEnemy()) {
      const sprite={_battler:b,scale:{x:1,y:1},anchor:{x:.5,y:1},
        setHome(){},updateBitmap(){this.loaded=b.battlerName()}};
      const spriteset=new Spriteset_Battle();spriteset._enemySprites=[sprite];
      spriteset.createEnemies();
      for(const pose of WwsDuelRules.stances) {
        b._wws.stance=pose;sprite.updateBitmap();
        near(sprite.scale.x,WwsDuelRules.spriteLayout(b,pose).scale);
      }
      for(const reaction of ['Parry','Dodge']) {
        b._wws.reaction=reaction;sprite.updateBitmap();
        near(sprite.scale.x,WwsDuelRules.spriteLayout(b,WwsDuelRules.pose(b)).scale);
      }
      b._wws.reaction=null;
      if(troopId===7) {
        b.setHp(500);BattleManager.updatePhase(true);
        $gameMessage.clear();BattleManager.updatePhase(true);sprite.updateBitmap();
        near(sprite.scale.x,WwsDuelRules.spriteLayout(b,WwsDuelRules.pose(b)).scale);
        assert.notEqual(WwsDuelRules.pose(b),'TwoSword');
      }
    }
  }
}
assert.equal(WwsDuelRules.spriteLayout({isActor:()=>false,isEnemy:()=>false}),null);
globalThis.layoutResults=layouts;
`);
const layouts = JSON.parse(JSON.stringify(context.layoutResults));
for (const item of layouts) {
  const png = fs.readFileSync(path.join(root, item.file));
  assert.equal(png.readUInt32BE(16), item.width);
  assert.equal(png.readUInt32BE(20), item.height);
}
if (process.argv.includes('--preview')) {
  (async () => {
    const sharp = require('sharp');
    for (const normalized of [false, true]) {
      const layers = [];
      let row = -1;
      for (const item of layouts) {
        if (item.pose === 'Chudan') row++;
        const column = ['Chudan','Jodan','Gedan','Kasumi','Waki','Seigan'].indexOf(item.pose);
        const scale = normalized ? item.scale : 1;
        const height = Math.round(item.height * scale), width = Math.round(item.width * scale);
        const baseline = normalized ? item.baseline : item.height - item.foot;
        const left = column*500+Math.round((500-width)/2);
        const top = row*440+400-Math.round(item.foot*scale)-baseline;
        layers.push({input:await sharp(path.join(root,item.file))
          .resize(width,height,{kernel:'nearest'}).png().toBuffer(),left,top});
      }
      await sharp({create:{width:3000,height:1320,channels:4,background:'#454a4e'}})
        .composite(layers).png().toFile(path.join(root,'docs/battles/stance-size-'+(normalized?'after':'before')+'.png'));
    }
  })().catch(error => {console.error(error);process.exitCode=1});
}
console.log('PASS: all 16 active stance sprites have uniform body height and foot baseline per character, proportional scaling, stance/reaction/phase render updates and matching asset dimensions');
