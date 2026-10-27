// Freeze only AFTER the next engine update and completed PIXI render.
// Sprite frame/transform and logical state are read from that frozen frame.
module.exports = async function freezeFrame(page) {
 return page.evaluate(() => new Promise(resolve => {
  const w=SceneManager._scene._mapNameWindow;
  w.close();w._showCount=0;w.openness=0;
  const app=Graphics.app,render=app.render;
  app.render=function() {
   // Scene_Map updates its spriteset before updating player movement. During
   // walking, even the next normal render can therefore be one movement tick
   // behind logic. Refresh rendering objects (no game/player update) against
   // that final logical state, then render and freeze exactly those pixels.
   SceneManager._scene._spriteset.update();
   render.call(this);
   app.render=render;
   SceneManager.stop();
   const ss=SceneManager._scene._spriteset;
   const p=ss._characterSprites.find(s=>s._character===$gamePlayer);
   const f=p._frame,t=p.worldTransform;
   const frame={x:f.x,y:f.y,width:f.width,height:f.height};
   const canvas=document.createElement('canvas');canvas.width=f.width;canvas.height=f.height;
   canvas.getContext('2d').drawImage(p.bitmap.canvas,f.x,f.y,f.width,f.height,0,0,f.width,f.height);
   resolve({frameCount:Graphics.frameCount,displayed:{frame,screen:[t.tx,t.ty],
    anchor:[p.anchor.x,p.anchor.y],scale:[t.a,t.d],direction:(f.y/f.height)*2+2,
    pattern:f.x/f.width,expectedScreen:[$gamePlayer.screenX(),$gamePlayer.screenY()],
    source:p._characterName},sourceFrame:canvas.toDataURL('image/png')});
  };
 }));
};
