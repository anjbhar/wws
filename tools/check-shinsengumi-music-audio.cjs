// Exercise the actual MZ audio engine and MP3 with Chromium's audio renderer.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
(async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        const core = fs.readFileSync(path.join(root, 'js/rmmz_core.js'), 'utf8');
        await page.addScriptTag({ content: core.slice(core.indexOf('function WebAudio()'), core.indexOf('function Video()')) });
        await page.addScriptTag({ content: `
            var Utils = { encodeURI: encodeURIComponent }, Graphics = { frameCount: 0 };
            var AudioManager = { _path: 'audio/', createBuffer() {} };
            var BattleManager = { playBattleBgm() {} };
            function Scene_Map() {}
            Scene_Map.prototype.start = function() {};
            Scene_Map.prototype.startEncounterEffect = function() {};
            WebAudio.prototype._startLoading = function() {};
        ` });
        await page.addScriptTag({ content: fs.readFileSync(path.join(root, 'js/plugins/WWS_ShinsengumiMusic.js'), 'utf8') });
        const result = await page.evaluate(async base64 => {
            const rate = 44100;
            const context = new OfflineAudioContext(2, rate * 7, rate);
            WebAudio._context = context;
            WebAudio._masterGainNode = context.createGain();
            WebAudio._masterGainNode.connect(context.destination);
            const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
            const decoded = await context.decodeAudioData(bytes.buffer);
            const original = decoded.getChannelData(0).slice();
            const music = AudioManager.createBuffer('bgm/', 'azianmaddoxx-samurai-423024');
            music._isLoaded = true;
            music._onDecode(decoded);
            music.volume = 0.8;
            music.play(true, decoded.duration - 3);
            const rendered = (await context.startRendering()).getChannelData(0);
            const loopStart = Math.round(music._loopStartTime * rate);
            const seam = rate * 3;
            // After wrapping, the renderer must continue with the exact next
            // original samples, without a silent gap or a second intro.
            let error = 0;
            for (let i = 0; i < rate; i++) {
                error = Math.max(error, Math.abs(rendered[seam + i] - original[loopStart + i] * 0.8));
            }
            const samples = decoded.getChannelData(0);
            const expectedStep = original[loopStart] - original[loopStart - 1];
            const actualStep = samples[loopStart] - samples[samples.length - 1];
            const rms = (start, end) => {
                let sum = 0;
                for (let i = start; i < end; i++) sum += rendered[i] ** 2;
                return Math.sqrt(sum / (end - start));
            };
            music.stop();
            return {
                duration: decoded.duration, loopStart: music._loopStartTime,
                loopEnd: music._loopStartTime + music._loopLengthTime,
                seamError: Math.abs(actualStep - expectedStep), renderedLoopError: error,
                initialRms: rms(0, rate / 10), fullRms: rms(rate * 2, rate * 2.1)
            };
        }, fs.readFileSync(path.join(root, 'audio/bgm/azianmaddoxx-samurai-423024.mp3')).toString('base64'));
        assert.equal(result.loopStart, 14.67);
        assert.equal(result.loopEnd, result.duration);
        assert(result.seamError < 1e-6, 'Loop seam must continue the original waveform');
        assert(result.renderedLoopError < 0.001, 'Native loop playback must have no gap');
        assert(result.initialRms < result.fullRms * 0.2, 'Playback must fade in from silence');
        console.log('PASS: decoded MP3 crossfade, sample-continuous loop, native playback and initial fade', result);
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
