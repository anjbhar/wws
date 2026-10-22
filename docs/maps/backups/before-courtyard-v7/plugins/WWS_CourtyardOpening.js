/*:
 * @target MZ
 * @plugindesc Face the dojo on a new courtyard game; retain normal camera and saves.
 */
(() => {
    const setup = DataManager.setupNewGame;
    DataManager.setupNewGame = function() {
        setup.call(this);
        if ($dataSystem.startMapId === 1) {
            $gamePlayer.reserveTransfer(1, $dataSystem.startX, $dataSystem.startY, 8, 0);
        }
    };
})();
