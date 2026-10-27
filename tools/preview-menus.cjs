// Real MZ renderer and input integration checks. Fixtures exist only in browser memory.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const { chromium } = require('C:/Users/anjan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..'), out = path.join(root, 'docs/menus');
const stage = Number(process.argv[2] || 6);
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.css': 'text/css', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm' };
(async () => {
    const server = http.createServer((req, res) => {
        const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/\/$/, '/index.html'));
        if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
        fs.readFile(file, (err, data) => { if (err) { res.writeHead(404).end(); return; } res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); res.end(data); });
    });
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [], checks = [];
    page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    fs.mkdirSync(out, { recursive: true });
    try {
        await page.goto('http://127.0.0.1:' + server.address().port + '/');
        await page.waitForFunction(() => window.SceneManager && SceneManager._scene instanceof Scene_Title && SceneManager._scene.isStarted());
        await page.evaluate(() => { Graphics._app.ticker.stop(); SceneManager.isGameActive = () => true; });
        const frames = async (count = 4) => page.evaluate(n => { for (let i = 0; i < n; i++) SceneManager.updateMain(); }, count);
        const wait = async (predicate, arg) => page.waitForFunction(({ source, arg }) => {
            const condition = eval('(' + source + ')');
            for (let n = 0; n < 12; n++) { if (condition(arg)) return true; SceneManager.updateMain(); } return condition(arg);
        }, { source: predicate.toString(), arg }, { polling: 50 });
        const ready = name => wait(name => SceneManager._scene.constructor.name === name && SceneManager._scene.isStarted() && SceneManager._scene.isReady() && ImageManager.isReady() && !SceneManager._scene.isBusy() && (!['Scene_Title', 'Scene_GameEnd'].includes(name) || SceneManager._scene._commandWindow.isOpen()), name);
        const key = async name => { await page.keyboard.down(name); await frames(1); await page.keyboard.up(name); await frames(2); };
        const shot = async name => { await frames(10); await wait(() => ImageManager.isReady()); await frames(4); await page.evaluate(() => Graphics._app.render()); await page.screenshot({ path: path.join(out, name + '.png') }); console.log('Rendered ' + name); };
        const click = async (field, index) => {
            const p = await page.evaluate(({ field, index }) => {
                const w = SceneManager._scene[field], r = w.itemRect(index), b = document.querySelector('canvas').getBoundingClientRect();
                return { x: b.left + (w.x + w.padding + r.x + r.width / 2 - w.origin.x) * b.width / Graphics.width, y: b.top + (w.y + w.padding + r.y + r.height / 2 - w.origin.y) * b.height / Graphics.height };
            }, { field, index });
            await page.mouse.move(p.x, p.y); await page.mouse.down(); await frames(1); await page.mouse.up(); await frames(2);
        };
        const open = async name => { await page.evaluate(name => SceneManager.push(window[name]), name); await ready(name); };
        const menuCommand = async symbol => { await page.evaluate(symbol => { const w = SceneManager._scene._commandWindow; w.selectSymbol(symbol); w.processOk(); }, symbol); await frames(); };
        await page.evaluate(() => { DataManager.setupNewGame(); SceneManager.goto(Scene_Map); }); await ready('Scene_Map');
        await open('Scene_Menu'); await shot('pause-solo');
        await menuCommand('equip'); await key('ArrowLeft'); await key('Enter');
        assert.equal(await page.evaluate(() => SceneManager._scene.constructor.name), 'Scene_Menu');
        await key('Escape');
        assert.equal(await page.evaluate(() => SceneManager._scene._commandWindow.active), true);
        await page.evaluate(() => { for (const id of [9, 10, 2]) $gameParty.addActor(id); $gameParty.setWwsFormation([1, 9, 10]); SceneManager._scene._statusWindow.refresh(); });
        await shot('pause-team');
        await menuCommand('status'); await click('_statusWindow', 2); await click('_statusWindow', 2); await ready('Scene_Status');
        assert.equal(await page.evaluate(() => $gameParty.menuActor().actorId()), 10);
        await key('Escape'); await ready('Scene_Menu');
        await page.setViewportSize({ width: 960, height: 540 }); await frames();
        await page.waitForFunction(() => { const b = document.querySelector('canvas').getBoundingClientRect(); return b.left >= -1 && b.top >= -1 && b.right <= 961 && b.bottom <= 541; });
        const bounds = await page.evaluate(() => { const b = document.querySelector('canvas').getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; });
        assert(bounds[0] >= -1 && bounds[1] >= -1 && bounds[2] <= 961 && bounds[3] <= 541);
        await shot('pause-small'); await page.setViewportSize({ width: 1280, height: 720 });
        checks.push('Pause: solo empty slots, three active fighters, left navigation, keyboard cancel, mouse actor selection, 960 × 540 fit');
        if (stage >= 2) {
            await page.evaluate(() => { $gameParty.setMenuActor($gameActors.actor(1)); for (const w of $dataWeapons.filter(Boolean).slice(0, 24)) $gameParty.gainItem(w, 2); });
            await open('Scene_Equip');
            await key('Enter'); await key('Enter'); await frames();
            const before = await page.evaluate(() => ({ weapon: SceneManager._scene.actor().equips()[0]?.id, attack: SceneManager._scene.actor().atk, inventory: $gameParty.numItems($dataWeapons[1]) }));
            await frames();
            assert(await page.evaluate(() => !!SceneManager._scene._statusWindow._tempActor));
            assert.notEqual(await page.evaluate(() => SceneManager._scene._statusWindow._tempActor.atk), before.attack);
            assert.equal(await page.evaluate(() => SceneManager._scene.actor().equips()[0]?.id), before.weapon);
            await shot('equipment-preview'); await key('Escape');
            assert.equal(await page.evaluate(() => SceneManager._scene.actor().equips()[0]?.id), before.weapon);
            await key('Enter');
            const predicted = await page.evaluate(() => SceneManager._scene._statusWindow._tempActor.param(2));
            await key('Enter'); assert.equal(await page.evaluate(() => SceneManager._scene.actor().param(2)), predicted);
            await key('Escape'); await key('ArrowRight'); await key('ArrowRight'); await key('Enter');
            assert(await page.evaluate(() => SceneManager._scene._loadoutConfirm.active));
            await shot('equipment-bulk-confirm'); await key('Escape');
            await key('PageDown'); assert.equal(await page.evaluate(() => SceneManager._scene.actor().actorId()), 9);
            await shot('equipment-fighter'); await key('Escape'); await ready('Scene_Menu');
            checks.push('Equipment: preview is inert, cancel preserves weapon, confirmed stats match engine preview, bulk confirmation, keyboard fighter switching');
        }
        if (stage >= 3) {
            await open('Scene_Item'); await key('Enter'); await shot('inventory-empty');
            assert.equal(await page.evaluate(() => SceneManager._scene._itemWindow.maxItems()), 0);
            await key('Escape'); await key('Escape'); await ready('Scene_Menu');
            const potionId = await page.evaluate(() => {
                const item = $dataItems.find(i => i && i.scope === 7 && [0, 2].includes(i.occasion) && i.effects.some(e => e.code === 11));
                $gameParty.gainItem(item, 3); $gameActors.actor(1).setHp(100); return item.id;
            });
            await open('Scene_Item'); await key('Enter'); await shot('inventory-items'); await key('Enter');
            assert(await page.evaluate(() => SceneManager._scene._actorWindow.active));
            await shot('inventory-recipient'); await key('Escape');
            assert.equal(await page.evaluate(id => $gameParty.numItems($dataItems[id]), potionId), 3);
            await key('Enter');
            await page.evaluate(() => SceneManager._scene._actorWindow.forceSelect(0));
            await key('Enter');
            assert.equal(await page.evaluate(id => $gameParty.numItems($dataItems[id]), potionId), 2);
            assert(await page.evaluate(() => $gameActors.actor(1).hp > 100));
            await key('Enter'); assert.equal(await page.evaluate(id => $gameParty.numItems($dataItems[id]), potionId), 2);
            await key('Escape'); await key('Escape');
            await key('ArrowRight'); await key('Enter');
            await page.mouse.wheel(0, 800); await frames(30); await shot('inventory-scroll');
            await key('Escape'); await key('Escape'); await ready('Scene_Menu');
            checks.push('Inventory: empty state, categories, quantities, descriptions, recipient cancel and real healing/consumption, mouse-wheel list scrolling');
        }
        if (stage >= 4) {
            await page.evaluate(() => $gameParty.setMenuActor($gameActors.actor(1)));
            await open('Scene_Status'); await shot('status-hayato'); await key('PageDown'); await key('PageDown');
            assert.equal(await page.evaluate(() => SceneManager._scene.actor().actorId()), 10);
            await shot('status-shinsengumi'); await key('Escape'); await ready('Scene_Menu');
            await open('Scene_Skill'); await key('Enter');
            assert(await page.evaluate(() => SceneManager._scene._disciplineList.active));
            assert.equal(await page.evaluate(() => SceneManager._scene._disciplineList._entries[0]), 'Seigan');
            await shot('skills-seigan');
            for (let i = 0; i < 8; i++) await key('ArrowDown');
            assert.equal(await page.evaluate(() => SceneManager._scene._disciplineDetails._name), 'Three Stage Thrust');
            await shot('skills-three-stage');
            const before = await page.evaluate(() => JSON.stringify($gameParty.wwsFormation().map(a => a.actorId())));
            await key('PageUp'); assert.equal(await page.evaluate(() => SceneManager._scene.actor().actorId()), 9);
            assert.equal(await page.evaluate(() => SceneManager._scene._disciplineList._entries[0]), 'Chudan');
            assert.equal(await page.evaluate(() => SceneManager._scene._disciplineList.active), false);
            await shot('skills-forms'); await key('Escape'); await ready('Scene_Menu');
            assert.equal(await page.evaluate(() => JSON.stringify($gameParty.wwsFormation().map(a => a.actorId()))), before);
            checks.push('Status/Skills: actor details, relevant attributes, actor switching, live form catalogue, Seigan/Three Stage Thrust, scrolling and browsing preserve formation');
        }
        if (stage >= 5) {
            const saved = await page.evaluate(async () => {
                $gameSystem.onBeforeSave(); await DataManager.saveGame(1);
                return { active: $gameParty.wwsFormation().map(a => a.actorId()), hp: $gameActors.actor(1).hp, location: DataManager.savefileInfo(1).wwsLocation };
            });
            assert(saved.location);
            await open('Scene_Save'); await shot('save-cards'); await key('Escape'); await ready('Scene_Menu');
            await page.evaluate(() => { $gameActors.actor(1).setHp(1); $gameParty.setWwsFormation([10, 9, 1]); });
            await open('Scene_Load');
            await page.evaluate(() => SceneManager._scene._listWindow.selectSavefile(1));
            await key('Enter'); await ready('Scene_Map');
            assert.deepEqual(await page.evaluate(() => $gameParty.wwsFormation().map(a => a.actorId())), saved.active);
            assert.equal(await page.evaluate(() => $gameActors.actor(1).hp), saved.hp);
            await open('Scene_Menu');
            await page.evaluate(() => { delete DataManager._globalInfo[1].wwsLocation; delete DataManager._globalInfo[1].wwsCompany; });
            await open('Scene_Load'); await shot('load-legacy');
            await page.evaluate(() => SceneManager._scene._listWindow.selectSavefile(1)); await key('Enter'); await ready('Scene_Map');
            assert.equal(await page.evaluate(() => $gameActors.actor(1).hp), saved.hp);
            await open('Scene_Menu'); await open('Scene_Options');
            const dash = await page.evaluate(() => ConfigManager.alwaysDash); await key('Enter');
            assert.equal(await page.evaluate(() => ConfigManager.alwaysDash), !dash);
            await page.evaluate(() => { SceneManager._scene._optionsWindow.selectSymbol('bgmVolume'); ConfigManager.bgmVolume = 60; });
            await key('ArrowLeft'); assert.equal(await page.evaluate(() => ConfigManager.bgmVolume), 40);
            await key('ArrowRight'); assert.equal(await page.evaluate(() => ConfigManager.bgmVolume), 60);
            await shot('options'); await key('Escape'); await ready('Scene_Menu');
            checks.push('Save/Load/Options: new metadata cards, actual save/load restores formation and Health, legacy metadata fallback loads, toggle and volume controls');
        }
        if (stage >= 6) {
            await page.evaluate(() => { const item = $dataItems.find(i => i && i.scope === 7 && [0, 2].includes(i.occasion) && i.effects.some(e => e.code === 11)); $gameParty.gainGold(1000); SceneManager.push(Scene_Shop); SceneManager.prepareNextScene([[0, item.id, 0, 0], [1, 1, 0, 0]], false); });
            await ready('Scene_Shop'); await key('Enter'); await shot('shop-buy');
            const before = await page.evaluate(() => { const item = SceneManager._scene._buyWindow.item(); return {id: item.id, gold: $gameParty.gold(), count: $gameParty.numItems(item), price: item.price}; });
            assert(before.price > 0);
            await key('Enter'); await key('ArrowRight'); await shot('shop-quantity'); await key('Escape');
            assert.equal(await page.evaluate(() => $gameParty.gold()), before.gold);
            await key('Enter'); await key('Enter');
            assert.equal(await page.evaluate(() => $gameParty.gold()), before.gold - before.price);
            assert.equal(await page.evaluate(id => $gameParty.numItems($dataItems[id]), before.id), before.count + 1);
            await key('ArrowDown'); await shot('shop-equipment');
            await page.evaluate(() => { window._wwsBeforePoor = $gameParty.gold(); $gameParty.loseGold($gameParty.gold()); SceneManager._scene._buyWindow.setMoney(0); });
            await key('Enter'); assert(await page.evaluate(() => SceneManager._scene._buyWindow.active));
            await page.evaluate(() => { $gameParty.gainGold(window._wwsBeforePoor); SceneManager._scene._buyWindow.setMoney($gameParty.gold()); });
            await key('Escape'); await key('ArrowRight'); await key('Enter'); await key('Enter');
            await shot('shop-sell');
            const selling = await page.evaluate(() => { const item = SceneManager._scene._sellWindow.item(); return {id: item.id, gold: $gameParty.gold(), count: $gameParty.numItems(item), price: Math.floor(item.price / 2)}; });
            await key('Enter'); await key('Enter');
            assert.equal(await page.evaluate(() => $gameParty.gold()), selling.gold + selling.price);
            assert.equal(await page.evaluate(id => $gameParty.numItems($dataItems[id]), selling.id), selling.count - 1);
            await key('Escape'); await key('Escape'); await key('Escape'); await ready('Scene_Menu');
            await open('Scene_Save'); await page.evaluate(() => SceneManager._scene._listWindow.selectSavefile(1)); await key('Enter');
            await shot('save-overwrite'); await key('Escape');
            assert(await page.evaluate(() => SceneManager._scene._listWindow.active));
            await key('Enter'); await key('ArrowUp'); await key('Enter'); await ready('Scene_Menu');
            assert(await page.evaluate(() => !!DataManager.savefileInfo(1).wwsLocation));
            await open('Scene_GameEnd'); await frames(24); await key('Enter'); await shot('return-confirm'); await key('Escape'); await key('Escape'); await ready('Scene_Menu');
            // Every menu scene fits the smaller desktop viewport; pointer Back remains usable.
            await page.setViewportSize({ width: 960, height: 540 });
            for (const name of ['Scene_Equip', 'Scene_Item', 'Scene_Status', 'Scene_Skill', 'Scene_Save', 'Scene_Load', 'Scene_Options']) {
                await open(name); await shot(name.replace('Scene_', '').toLowerCase() + '-small');
                assert(await page.evaluate(() => {
                    const b = document.querySelector('canvas').getBoundingClientRect();
                    return b.left >= -1 && b.top >= -1 && b.right <= 961 && b.bottom <= 541;
                }));
                if (name === 'Scene_Equip') {
                    const actorBefore = await page.evaluate(() => SceneManager._scene.actor().actorId());
                    const p = await page.evaluate(() => { const b = document.querySelector('canvas').getBoundingClientRect(), button = SceneManager._scene._pagedownButton; return {x: b.left + (button.x + 56) * b.width / Graphics.width, y: b.top + (button.y + 20) * b.height / Graphics.height}; });
                    await page.mouse.click(p.x, p.y); await frames(); assert.notEqual(await page.evaluate(() => SceneManager._scene.actor().actorId()), actorBefore);
                }
                const p = await page.evaluate(() => { const b = document.querySelector('canvas').getBoundingClientRect(); return { x: b.left + (Graphics.boxWidth - 78) * b.width / Graphics.width, y: b.top + 48 * b.height / Graphics.height }; });
                await page.mouse.click(p.x, p.y); await frames(); await ready('Scene_Menu');
            }
            await page.setViewportSize({ width: 1280, height: 720 });
            await key('Escape'); await ready('Scene_Map');
            await page.evaluate(() => {
                window._wwsChoiceResult = null;
                $gameMessage.setSpeakerName('Masanori'); $gameMessage.add('A spar to sharpen your sword?');
                $gameMessage.setChoices(['Spar', 'Not now'], 0, 1);
                $gameMessage.setChoiceCallback(value => window._wwsChoiceResult = value);
            });
            await frames(120); await wait(() => SceneManager._scene._choiceListWindow.active);
            await page.setViewportSize({ width: 960, height: 540 }); await frames(); await shot('dialogue-small');
            await page.setViewportSize({ width: 1280, height: 720 });
            await shot('dialogue-choices'); await key('Escape'); assert.equal(await page.evaluate(() => window._wwsChoiceResult), 1);
            await frames(24);
            await page.evaluate(() => { SceneManager.goto(Scene_Title); }); await ready('Scene_Title'); await shot('title');
            await page.setViewportSize({ width: 960, height: 540 }); await frames(24); await shot('title-small');
            await page.evaluate(() => { const w = SceneManager._scene._commandWindow; w.selectSymbol('options'); w.processOk(); }); await ready('Scene_Options');
            await key('Escape'); await ready('Scene_Title');
            await page.evaluate(() => SceneManager._scene._commandWindow.selectSymbol('newGame')); await key('Enter'); await ready('Scene_Map');
            assert.deepEqual(await page.evaluate(() => $gameParty._actors.slice()), [1]);
            checks.push('Remaining: buy/sell transactions and quantities, insufficient-money rejection, save overwrite cancel/confirm, title confirmation cancel, all seven menu scenes fit 960 × 540, mouse fighter switching/Back, real dialogue cancellation branch at both sizes, title/options and New Game');
        }
        assert.deepEqual(errors, []);
        const report = { stage, checks, runtimeErrors: errors };
        fs.writeFileSync(path.join(out, 'stage-' + stage + '-check.json'), JSON.stringify(report, null, 2) + '\n');
        console.log(JSON.stringify(report));
    } catch (error) {
        console.error({ failure: String(error), errors, state: await page.evaluate(() => ({ scene: window.SceneManager?._scene?.constructor.name, error: window.Graphics?._errorPrinter?.textContent, message: window.$gameMessage?.allText(), choices: window.$gameMessage?.choices(), choiceResult: window._wwsChoiceResult })) });
        await page.evaluate(() => window.Graphics?._app?.render());
        await page.screenshot({ path: path.join(out, 'failure.png') }); throw error;
    } finally { await browser.close(); server.closeAllConnections(); await new Promise(r => server.close(r)); }
})().catch(e => { console.error(e); process.exitCode = 1; });
