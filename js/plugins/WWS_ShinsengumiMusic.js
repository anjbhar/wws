/*:
 * @target MZ
 * @plugindesc Azianmaddoxx Samurai music for Shinsengumi and warrior monk fights.
 * @author WWS
 * @help
 * Load after WWS_Duel. Plays the local MP3 through MZ's looping BGM system.
 * Preloads on the map and starts with the encounter transition at 10.67
 * seconds with a 0.6-second fade-in. The ending crossfades
 * over four seconds into the same section for a seamless repeating loop.
 * Normal battle-end handling restores map music. Other music uses stock loading.
 */
(() => {
    'use strict';
    const track = 'azianmaddoxx-samurai-423024';
    const startPosition = 10.67;
    const fadeInSeconds = 0.6;
    const crossfadeSeconds = 4;

    class ShinsengumiAudio extends WebAudio {
        // This MP3 must use the browser decoder, including on platforms where
        // MZ would otherwise select its Ogg-only streaming decoder.
        _shouldUseDecoder() { return false; }

        _onDecode(buffer) {
            const rate = buffer.sampleRate;
            const start = Math.round(startPosition * rate);
            const overlap = Math.round(crossfadeSeconds * rate);
            if (buffer.length > start + overlap * 2) {
                // Blend the tail with the opening in the decoded PCM itself.
                // Native Web Audio looping then stays sample-accurate, even
                // when the game is paused or running in a background window.
                const tail = buffer.length - overlap;
                for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
                    const samples = buffer.getChannelData(channel);
                    for (let i = 0; i < overlap; i++) {
                        const mix = i / (overlap - 1);
                        const weight = mix * mix * (3 - 2 * mix);
                        samples[tail + i] = samples[tail + i] * (1 - weight) +
                            samples[start + i] * weight;
                    }
                }
                // The opening has already played during the crossfade; resume
                // immediately after it instead of replaying it at the seam.
                this._sampleRate = rate;
                this._loopStart = start + overlap;
                this._loopLength = buffer.length - this._loopStart;
            }
            super._onDecode(buffer);
        }

        _startPlaying(offset) {
            super._startPlaying(offset);
            this.fadeIn(fadeInSeconds);
        }
    }
    let preloadedMusic = null;
    function createMusicBuffer() {
        const buffer = new ShinsengumiAudio(AudioManager._path + 'bgm/' + Utils.encodeURI(track) + '.mp3');
        buffer.name = track;
        buffer.frameCount = Graphics.frameCount;
        return buffer;
    }
    function usesSamuraiMusic() {
        return BattleManager._wwsDuel?.battlers.some(battler =>
            ['Shinsengumi', 'WarriorMonkMasked', 'WarriorMonkUnmasked'].includes(
                globalThis.WwsDuelRules?.enemySpriteSet(battler)
            )
        ) || false;
    }
    // Decode before the encounter so playback need not wait for the MP3.
    const startMap = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        startMap.call(this);
        if (!preloadedMusic) preloadedMusic = createMusicBuffer();
    };
    // launchBattle has already saved map music and stopped encounter audio.
    const startEncounterEffect = Scene_Map.prototype.startEncounterEffect;
    Scene_Map.prototype.startEncounterEffect = function() {
        startEncounterEffect.call(this);
        if (usesSamuraiMusic()) BattleManager.playBattleBgm();
    };
    // MZ normally appends .ogg; this one imported track is an MP3.
    const createBuffer = AudioManager.createBuffer;
    AudioManager.createBuffer = function(folder, name) {
        if (folder !== 'bgm/' || name !== track) return createBuffer.call(this, folder, name);
        const buffer = preloadedMusic || createMusicBuffer();
        preloadedMusic = null;
        return buffer;
    };
    const playBattleBgm = BattleManager.playBattleBgm;
    BattleManager.playBattleBgm = function() {
        if (!usesSamuraiMusic()) {
            return playBattleBgm.call(this);
        }
        if (!AudioManager.isCurrentBgm({ name: track })) {
            AudioManager.playBgm({ name: track, volume: 80, pitch: 100, pan: 0 }, startPosition);
        }
        AudioManager.stopBgs();
    };
})();
