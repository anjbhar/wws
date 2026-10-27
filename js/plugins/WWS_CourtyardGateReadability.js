/*:
 * @target MZ
 * @plugindesc Local courtyard canopy cutaway, with the older gate cue retained for old art.
 * @help Rendering only. Does not alter movement, events or collision.
 */
(() => {
    const createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        createCharacters.call(this);
        if ($gameMap.mapId() !== 1 || !$dataMap.note.includes('wws:dojo-courtyard-v7')) return;
        if ($dataMap.note.includes('wws:gate-canopy-v5')) {
            // Keep both roof wings and the structural header opaque. Only the
            // roof over the opening cuts away as the actual sprite overlaps it.
            const canopy = new Sprite(ImageManager.loadPicture('EdoCourtyardGateCanopy-v5'));
            canopy._wwsGateCanopy = true;
            canopy.z = 5;
            const roof = new Sprite(canopy.bitmap);
            roof._wwsGateRoof = true;
            roof.z = 5;
            roof.setFrame(40, 0, 112, 44);
            // The parent displays the complement of the central roof patch.
            // A local mask leaves the header below y=584 fully solid.
            const mask = new PIXI.Graphics();
            mask.beginFill(0xffffff).drawRect(0,0,40,44)
                .drawRect(152,0,40,44).drawRect(0,44,192,16).endFill();
            canopy.addChild(mask);
            canopy.mask = mask;
            let bounds;
            const overlap = () => {
                const player=this._characterSprites.find(s=>s._character===$gamePlayer);
                if (!player?.bitmap?.isReady() || !player.patternWidth()) return 0;
                // Cache the opaque extent across all native poses. Padding in
                // the 64x88 source cell is not part of the visible player.
                if (!bounds || bounds.bitmap!==player.bitmap) {
                    const w=player.patternWidth(),h=player.patternHeight();
                    const pixels=player.bitmap.context.getImageData(0,0,player.bitmap.width,player.bitmap.height).data;
                    let l=w,r=0,t=h,b=0;
                    for(let y=0;y<player.bitmap.height;y++)for(let x=0;x<player.bitmap.width;x++)
                        if(pixels[(y*player.bitmap.width+x)*4+3]>128){
                            l=Math.min(l,x%w);r=Math.max(r,x%w+1);
                            t=Math.min(t,y%h);b=Math.max(b,y%h+1);
                        }
                    bounds={bitmap:player.bitmap,l:l-w/2,r:r-w/2,t:t-h,b:b-h};
                }
                const x=($gamePlayer._realX+.5)*48,y=($gamePlayer._realY+1)*48-6;
                const ox=Math.min(x+bounds.r,656)-Math.max(x+bounds.l,544);
                const oy=Math.min(y+bounds.b,584)-Math.max(y+bounds.t,540);
                return Math.max(0,Math.min(1,ox/10,oy/12));
            };
            // Geometry gives a continuous fade boundary in either direction,
            // including quick reversals; no delayed proximity latch or pop.
            canopy.update = function() {
                Sprite.prototype.update.call(this);
                this.x = $gameMap.adjustX(504 / 48) * 48;
                this.y = $gameMap.adjustY(540 / 48) * 48;
                roof.x=this.x+40;roof.y=this.y;
                roof.opacity=Math.round(255-183*overlap());
                this._wwsRoofOpacity=roof.opacity;
            };
            this._tilemap.addChild(canopy);
            this._tilemap.addChild(roof);
            return;
        }
        // Only the roof/beam over the three existing passage columns can reveal
        // the player's current pose. Jambs and wall terminations stay opaque.
        const mask = new PIXI.Graphics();
        mask.beginFill(0xffffff).drawRect(0, 0, 144, 36)
            .drawRect(14, 36, 116, 14).endFill();
        this._tilemap.addChild(mask);
        const cue = new Sprite_Character($gamePlayer);
        cue._wwsGateCue = true;
        cue.z = 5;
        cue.mask = mask;
        const update = cue.update;
        cue.update = function() {
            update.call(this);
            // Sprite_Character.updatePosition resets z to the normal player
            // layer each frame; this clipped cue must be above the canopy.
            this.z = 5;
            mask.x = $gameMap.adjustX(11) * 48;
            mask.y = $gameMap.adjustY(548 / 48) * 48;
            this.visible = this.visible && $gamePlayer._realX >= 10.5 &&
                $gamePlayer._realX <= 13.5 && $gamePlayer._realY > 10.7 &&
                $gamePlayer._realY < 13;
            this.opacity = 88;
        };
        this._tilemap.addChild(cue);
    };
})();
