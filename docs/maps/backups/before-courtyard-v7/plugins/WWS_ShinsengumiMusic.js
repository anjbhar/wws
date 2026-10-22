/*:
 * @target MZ
 * @plugindesc Azianmaddoxx Samurai music for the Shinsengumi duel.
 * @author WWS
 * @help
 * Load after WWS_Duel. Plays the local MP3 through MZ's looping BGM system.
 * Starts at 10.67 seconds with a two-second fade-in. The ending crossfades
 * over four seconds into the same section for a seamless repeating loop.
 * Normal battle-end handling restores map music. Other music uses stock loading.
 */
(() => {
    'use strict';
    const track = 'azianmaddoxx-samurai-423024';
    const startPosition = 10.67;
    const fadeInSeconds = 2;
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
    // MZ normally appends .ogg; this one imported track is an MP3.
    const createBuffer = AudioManager.createBuffer;
    AudioManager.createBuffer = function(folder, name) {
        if (folder !== 'bgm/' || name !== track) return createBuffer.call(this, folder, name);
        const buffer = new ShinsengumiAudio(this._path + folder + Utils.encodeURI(name) + '.mp3');
        buffer.name = name;
        buffer.frameCount = Graphics.frameCount;
        return buffer;
    };
    const playBattleBgm = BattleManager.playBattleBgm;
    BattleManager.playBattleBgm = function() {
        const enemy = this._wwsDuel?.battlers[1];
        if (globalThis.WwsDuelRules?.enemySpriteSet(enemy) !== 'Shinsengumi') {
            return playBattleBgm.call(this);
        }
        if (!AudioManager.isCurrentBgm({ name: track })) {
            AudioManager.playBgm({ name: track, volume: 80, pitch: 100, pan: 0 }, startPosition);
        }
        AudioManager.stopBgs();
    };
})();
