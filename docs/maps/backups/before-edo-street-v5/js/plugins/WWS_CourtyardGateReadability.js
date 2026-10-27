/*:
 * @target MZ
 * @plugindesc Local visual cue for the player behind the courtyard gate canopy.
 * @help Rendering only. Does not alter movement, events, collision or artwork.
 */
(() => {
    const createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        createCharacters.call(this);
        if ($gameMap.mapId() !== 1 || !$dataMap.note.includes('wws:dojo-courtyard-v7')) return;
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
