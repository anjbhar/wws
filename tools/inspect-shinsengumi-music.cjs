// Decode the game MP3 in Chromium, as RPG Maker does, and inspect its intro.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe', headless: true
  });
  try {
    const page = await browser.newPage();
    const track = fs.readFileSync(path.join(__dirname, '../audio/bgm/azianmaddoxx-samurai-423024.mp3'));
    const result = await page.evaluate(async base64 => {
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const audio = await new OfflineAudioContext(2, 1, 44100).decodeAudioData(bytes.buffer);
      const data = audio.getChannelData(0), rate = audio.sampleRate, windows = [];
      for (let time = 0; time < Math.min(50, audio.duration); time += 0.5) {
        let power = 0, peak = 0;
        const start = Math.floor(time * rate), end = Math.min(data.length, start + rate / 2);
        for (let i = start; i < end; i++) { power += data[i] ** 2; peak = Math.max(peak, Math.abs(data[i])); }
        windows.push({ time, db: Math.round(200 * Math.log10(Math.sqrt(power / (end-start)) || 1e-10)) / 10,
          peak: Math.round(peak*1000)/1000 });
      }
      return { duration: audio.duration, sampleRate: rate, windows };
    }, track.toString('base64'));
    console.log(JSON.stringify(result, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
