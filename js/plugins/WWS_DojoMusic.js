/*:
 * @target MZ
 * @plugindesc MP3 playback for The Spirit of the Samurai dojo BGM.
 * @author WWS
 * @help
 * Map001 selects this track through its normal autoplay BGM setting.
 * Uses MZ's looping BGM and battle-end music restoration.
 */
(() => {
    'use strict';
    const track = 'playlistsons-the-spirit-of-the-samurai-383633';
    class DojoAudio extends WebAudio {
        _shouldUseDecoder() { return false; }
    }
    const createBuffer = AudioManager.createBuffer;
    AudioManager.createBuffer = function(folder, name) {
        if (folder !== 'bgm/' || name !== track) {
            return createBuffer.call(this, folder, name);
        }
        const buffer = new DojoAudio(this._path + folder + Utils.encodeURI(name) + '.mp3');
        buffer.name = name;
        buffer.frameCount = Graphics.frameCount;
        return buffer;
    };
})();
