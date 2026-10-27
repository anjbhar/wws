// Persistent-party integration, using real MZ party/actor/action objects.
const { run } = require('./lib/duel-harness.cjs')();
run(`
$gamePlayer = { refresh() {} };
const monkId = $dataTroops.find(t => t?.name.includes('[WWS Monk Group]')).id;
const ids = actors => actors.map(actor => actor.actorId());
function roster(values) {
    $gameParty._inBattle = false;
    BattleManager._wwsDuel = null;
    $gameParty._actors = values.slice();
    delete $gameParty._wwsFormation;
}
function finish(result = 1) {
    BattleManager.endBattle(result);
    $gameParty.onBattleEnd();
}
roster([1,9,10,2]);
assert.equal($gameParty.maxBattleMembers(), 3);
assert.deepEqual(ids($gameParty.battleMembers()), [1,9,10]);
assert.deepEqual(ids($gameParty.allMembers()), [1,9,10,2]);
assert.equal($gameParty.setWwsFormation([10,1,9]), true);
assert.deepEqual(ids($gameParty.battleMembers()), [10,1,9]);
for (const invalid of [[1,1,9], [1,9], [1,9,2], null]) {
    assert.equal($gameParty.setWwsFormation(invalid), false);
    assert.deepEqual(ids($gameParty.battleMembers()), [10,1,9]);
}
// Reordering the same active roster does not implicitly move combat positions.
$gameParty._actors = [9,10,1,2];
assert.deepEqual(ids($gameParty.battleMembers()), [10,1,9]);
// Assignments survive the save payload; legacy saves initialize lazily.
const savedParty = JSON.stringify($gameParty);
$gameParty = Object.assign(new Game_Party(), JSON.parse(savedParty));
assert.deepEqual(ids($gameParty.battleMembers()), [10,1,9]);
delete $gameParty._wwsFormation;
assert.deepEqual(ids($gameParty.battleMembers()), [9,10,1]);
// The actual stock Formation command calls swapOrder: active swaps and reserves.
$gameParty.swapOrder(0,2);
assert.deepEqual(ids($gameParty.battleMembers()), [1,10,9]);
$gameParty.swapOrder(1,3);
assert.deepEqual(ids($gameParty.battleMembers()), [1,2,9]);
assert.deepEqual(ids($gameParty.allMembers()), [1,2,9,10]);
// A corrupted/stale save cannot duplicate actors or exceed available slots.
$gameParty._wwsFormation = [999,1,1];
assert.equal(new Set(ids($gameParty.battleMembers())).size, 3);
assert.deepEqual(ids($gameParty.battleMembers()).slice().sort((a,b)=>a-b), [1,2,9]);

// Current solo encounters stay solo even with a full roster and Hayato in reserve.
for (const troopId of [6,7,9]) for (const order of [[1,9,10,2], [9,10,2,1]]) {
    roster(order);
    const actors = $gameParty.allMembers();
    const hp = actors.map(actor => actor.hp);
    BattleManager.setup(troopId, true, true);
    const d = BattleManager._wwsDuel;
    assert(d, 'Four-member rosters must not fall back to stock combat');
    assert.deepEqual(ids(d.allies), [1]);
    assert.equal($gameParty.members().length, 4, 'Map transition retains the roster');
    const starts = [], ends = [];
    for (const actor of actors) {
        actor.onBattleStart = () => starts.push(actor.actorId());
        actor.onBattleEnd = () => ends.push(actor.actorId());
    }
    $gameParty.onBattleStart(false);
    assert.deepEqual(starts, [1]);
    assert.deepEqual(ids($gameParty.members()), [1]);
    assert.equal(d.allies[0].index(), 0);
    for (const enemy of WwsDuelRules.enemies()) assert.deepEqual(ids(WwsDuelRules.legalTargets(enemy)), [1]);
    finish([6,7,9].indexOf(troopId));
    assert.deepEqual(ends, [1]);
    assert.deepEqual($gameParty._actors, order);
    assert.deepEqual(actors.map(actor => actor.hp), hp);
    assert.equal($gameParty.members().length, 4);
    for (const actor of actors) { delete actor.onBattleStart; delete actor.onBattleEnd; }
}
roster([9,10]);
BattleManager.setup(6, true, true);
assert.deepEqual(ids(BattleManager._wwsDuel.allies), [9], 'Missing Hayato falls back to the leader');
$gameParty.onBattleStart(false);finish();

// Explicit party tags accept all 1..3 versus 1..3 sizes; partial teams have full reach.
const clone = value => JSON.parse(JSON.stringify(value));
const template = clone($dataTroops[monkId]);
const fixtureId = $dataTroops.length;
for (let a = 1; a <= 3; a++) for (let e = 1; e <= 3; e++) {
    roster([1,9,10].slice(0,a));
    $dataTroops[fixtureId] = { ...clone(template), id: fixtureId,
        name: '[WWS Party] integration fixture', members: template.members.slice(0,e) };
    BattleManager.setup(fixtureId, true, true);
    $gameParty.onBattleStart(false);
    const d = BattleManager._wwsDuel, enemies = WwsDuelRules.enemies();
    assert.equal(d.allies.length,a);assert.equal(enemies.length,e);
    if (a < 3 || e < 3) {
        for (const ally of d.allies) assert.deepEqual(WwsDuelRules.legalTargets(ally),enemies);
        for (const enemy of enemies) assert.deepEqual(WwsDuelRules.legalTargets(enemy),d.allies);
    }
    if(e===1) assert.equal(WwsDuelRules.position(enemies[0]), 'Center');
    if(e===2) assert.deepEqual(enemies.map(b=>WwsDuelRules.position(b)), ['Left','Right']);
    for (const b of d.battlers) {
        const slot = WwsDuelRules.formationSlot(b.isActor()?'allies':'enemies', b.index(),1280,720);
        assert(Number.isFinite(slot.x)&&Number.isFinite(slot.y));
    }
    // Resolve a real AI action against the farthest ally in every partial size.
    if (a < 3 || e < 3) {
        for (const b of d.battlers) b.recoverAll();
        BattleManager._logWindow = log;
        BattleManager._spriteset = { isBusy: () => false };
        BattleManager.startInput();
        if (d.mode === 'openingDialogue') { $gameMessage.clear(); BattleManager.updatePhase(true); }
        while (d.opening) BattleManager.wwsChooseStance(WwsDuelRules.availableStances(WwsDuelRules.actor())[0]);
        const random = Math.random;Math.random = () => .99;
        d.pending = [enemies[enemies.length-1]];d.mode = 'advance';BattleManager.wwsNext();
        assert.equal(BattleManager._targets[0], d.allies[d.allies.length-1]);
        resolve();Math.random = random;
    }
    // In full teams, either side losing a fighter opens every surviving target.
    if (a===3 && e===3) {
        d.sparring=false;d.allies[0].setHp(0);
        for (const ally of d.allies.filter(b=>b.isAlive())) assert.deepEqual(WwsDuelRules.legalTargets(ally),enemies);
        for (const enemy of enemies) assert.deepEqual(WwsDuelRules.legalTargets(enemy),d.allies.filter(b=>b.isAlive()));
    }
    finish();
}
roster([1,9,10,2]);BattleManager.setup(monkId,true,true);
assert.deepEqual(ids(BattleManager._wwsDuel.allies),[1,9,10]);
assert.equal(BattleManager._wwsDuel.temporaryAllies,false);
$gameParty.onBattleStart(false);finish();
assert.deepEqual($gameParty._actors,[1,9,10,2]);
roster([9]);BattleManager.setup(monkId,true,true);
assert.deepEqual(ids(BattleManager._wwsDuel.allies),[9], 'A lone companion must not generate a duplicate guest');
$gameParty.onBattleStart(false);finish();
// Untagged encounters retain stock combat with the same three-active limit.
roster([1,9,10,2]);BattleManager.setup(1,true,true);
assert.equal(BattleManager._wwsDuel,null);
assert.equal($gameParty.battleMembers().length,3);
console.log('PASS: three active slots/reserves, formation persistence/migration/validation, explicit swaps, solo isolation/lifecycle, Hayato in reserve, party tags, all nine team sizes, symmetric targeting and guest deduplication');
`);
