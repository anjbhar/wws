/*:
 * @target MZ
 * @plugindesc Larger regenerated overworld sheets, including legacy save compatibility.
 * @help
 * Remaps previous walking-sheet names when loading their bitmaps. New database
 * records use the versioned sheets directly. This also covers old saved actors
 * and events, without changing their gameplay state or movement coordinates.
 */
(() => {
    "use strict";
    const replacements = {
        "$Samurai-v2": "$Samurai-v3",
        "$SamuraiInstructor-v2": "$SamuraiInstructor-v3",
        "$Shinsengumi-v1": "$Shinsengumi-v2",
        "$WarriorMonk-Masked-v1": "$WarriorMonk-Masked-v2",
        "$WarriorMonk-Unmasked-v1": "$WarriorMonk-Unmasked-v2"
    };
    const loadCharacter = ImageManager.loadCharacter;
    ImageManager.loadCharacter = function(filename) {
        return loadCharacter.call(this, replacements[filename] || filename);
    };
})();
