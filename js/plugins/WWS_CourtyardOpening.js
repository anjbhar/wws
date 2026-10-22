/*:
 * @target MZ
 * @plugindesc Courtyard arrival, low threshold contact and versioned save recovery.
 */
(() => {
    const setup = DataManager.setupNewGame;
    DataManager.setupNewGame = function() {
        setup.call(this);
        if ($dataSystem.startMapId === 1) {
            $gameSystem._wwsCourtyardRevision = 7;
            $gamePlayer.reserveTransfer(1, $dataSystem.startX, $dataSystem.startY, 8, 0);
        }
    };
    const extract = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(contents) {
        extract.call(this, contents);
        if ($gameMap.mapId() === 1 && $gameSystem._wwsCourtyardRevision !== 7) {
            $gamePlayer._wwsCourtyardNeedsReload = true;
        }
    };
    const loaded = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function() {
        if ($gamePlayer._wwsCourtyardNeedsReload && $dataMap.note.includes('wws:dojo-courtyard-v7')) {
            if (this._transfer) $gamePlayer.performTransfer();
            const from = [$gamePlayer.x, $gamePlayer.y];
            $gameMap.setup(1);
            // Connected cells, including event collision, determine safe recovery.
            const queue = [[$dataSystem.startX, $dataSystem.startY]];
            const seen = new Set([queue[0].join(',')]);
            for (let i = 0; i < queue.length; i++) for (const d of [2, 4, 6, 8]) {
                const [x, y] = queue[i];
                const nx = $gameMap.roundXWithDirection(x, d), ny = $gameMap.roundYWithDirection(y, d);
                if (!seen.has(nx + ',' + ny) && $gamePlayer.canPass(x, y, d)) {
                    seen.add(nx + ',' + ny); queue.push([nx, ny]);
                }
            }
            const to = seen.has(from.join(',')) ? from : queue.reduce((best, p) =>
                Math.abs(p[0]-from[0])+Math.abs(p[1]-from[1]) < Math.abs(best[0]-from[0])+Math.abs(best[1]-from[1]) ? p : best);
            $gamePlayer.locate(...to);
            $gamePlayer._wwsCourtyardRecovery = { from, to };
            delete $gamePlayer._wwsCourtyardNeedsReload;
            $gameSystem._wwsCourtyardRevision = 7;
        }
        loaded.call(this);
    };
    // A shallow six-pixel rise, interpolated during real movement onto the deck.
    const shiftY = Game_Player.prototype.shiftY;
    Game_Player.prototype.shiftY = function() {
        const onDeck = $gameMap.mapId() === 1 && $dataMap.note.includes('wws:dojo-courtyard-v7') && this._realX >= 10 && this._realX <= 14;
        return shiftY.call(this) + (onDeck ? 6 * Math.max(0, 1 - Math.abs(this._realY - 4)) : 0);
    };
})();
