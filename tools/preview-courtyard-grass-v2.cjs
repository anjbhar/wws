const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require('C:/Users/anjan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
    const browser = await chromium.launch({headless: true, args: ['--use-angle=swiftshader']});
    try {
        const page = await browser.newPage({viewport: {width: 1280, height: 720}});
        const errors = [];
        page.on('pageerror', e => errors.push(String(e)));
        await page.goto('http://127.0.0.1:8166/');
        await page.waitForFunction(() => window.SceneManager && SceneManager._scene instanceof Scene_Title);
        await page.evaluate(() => { DataManager.setupNewGame(); SceneManager.goto(Scene_Map); });
        await page.waitForFunction(() => SceneManager._scene instanceof Scene_Map && SceneManager._scene.isReady() && SceneManager._scene._fadeDuration === 0 && SceneManager._scene._spriteset._tilemap._bitmaps.every(b => !b || b.isReady()));
        await page.evaluate(() => SceneManager._scene._mapNameWindow.close());
        await page.screenshot({path: path.join(__dirname, '../docs/maps/courtyard-grass-v2-in-game.png')});
        const result = await page.evaluate(() => ({map: $gameMap.mapId(), terrain: $gameMap.tileset().tilesetNames[4], spawn: [$gamePlayer.x, $gamePlayer.y], loaded: SceneManager._scene._spriteset._tilemap._bitmaps.every(b => !b || b.isReady())}));
        assert.equal(result.terrain, 'EdoCourtyard_A5-grass-v2');
        assert(result.loaded);
        assert.deepEqual(errors, []);
        result.errors = errors;
        fs.writeFileSync(path.join(__dirname, '../docs/art/courtyard-grass-v2/browser-check.json'), JSON.stringify(result, null, 2)+'\n');
        console.log(JSON.stringify(result));
    } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
