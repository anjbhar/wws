/*:
 * @target MZ
 * @plugindesc v1.1 Courtyard backdrop for tagged courtyard practice fights.
 * @author WWS
 * @help
 * Uses EdoPracticeCourtyard-v1 for troop 6 and troops named [WWS Courtyard].
 * The complete 1280 x 720 scene replaces both stock background layers.
 * Fits the viewport without the engine's usual battleback overscan.
 * Does not change map battleback settings or other troops' backgrounds.
 */
(() => {
    'use strict';
    const practice = () => {
        const troop = $gameTroop.troop();
        return troop?.id === 6 || !!troop?.name?.includes('[WWS Courtyard]');
    };
    const name1 = Sprite_Battleback.prototype.battleback1Name;
    const name2 = Sprite_Battleback.prototype.battleback2Name;
    const position = Sprite_Battleback.prototype.adjustPosition;
    Sprite_Battleback.prototype.battleback1Name = function() {
        return practice() ? 'EdoPracticeCourtyard-v1' : name1.call(this);
    };
    Sprite_Battleback.prototype.battleback2Name = function() {
        return practice() ? '' : name2.call(this);
    };
    Sprite_Battleback.prototype.adjustPosition = function() {
        if (!practice()) return position.call(this);
        this.x = 0;
        this.y = 0;
        this.scale.x = Graphics.width / (this.bitmap.width || 1);
        this.scale.y = Graphics.height / (this.bitmap.height || 1);
        this.width = this.bitmap.width || 1;
        this.height = this.bitmap.height || 1;
        this.bitmap.smooth = false;
    };
})();
