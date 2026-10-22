const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'data', name + '.json'), 'utf8'));
const map = read('Map001'), enemies = read('Enemies'), troops = read('Troops');
const npc = map.events.find(event => event && event.note === 'wws:shinsengumi-npc');
const instructor = map.events.find(event => event && event.note === 'wws:samurai-sparring');
assert(npc && instructor, 'Both courtyard NPCs must already exist');
const poses = ['Chudan', 'Jodan', 'Gedan', 'Kasumi', 'Waki'];
for (const pose of poses) {
  const png = fs.readFileSync(path.join(root, 'img/enemies', `Shinsengumi-${pose}-v2.png`));
  assert.equal(png.readUInt32BE(16), 288);
  assert.equal(png.readUInt32BE(20), 288);
  assert.equal(png[25], 6, 'Expected RGBA');
}
const oldEnemy = enemies.find(enemy => enemy && /<DuelSprite:\s*Shinsengumi\s*>/i.test(enemy.note));
const enemyId = oldEnemy ? oldEnemy.id : enemies.length;
const oldTroop = troops.find(troop => troop && troop.name.includes('[WWS Duel]') && troop.members.length === 1 && troop.members[0].enemyId === enemyId);
const troopId = oldTroop ? oldTroop.id : troops.length;
enemies[enemyId] = {
  ...structuredClone(enemies[6]), id: enemyId, name: 'Shinsengumi Swordsman',
  battlerName: 'Shinsengumi-Chudan-v2',
  params: [1000, ...enemies[6].params.slice(1)],
  note: '<DuelSprite: Shinsengumi>\n<DuelSpriteVersion: 2>\nRepeatable nonlethal courtyard boss practice. 1000 HP; other practice stats match Masanori. No rewards.'
};
troops[troopId] = {
  ...structuredClone(troops[6]), id: troopId,
  name: 'Shinsengumi — Courtyard Sparring [WWS Duel] [WWS Courtyard]',
  members: [{ ...troops[6].members[0], enemyId }]
};
// Reuse the proven recovery/choice/battle branching, with his own dialogue.
const dialogue = new Map([
  ['I am Masanori. Care to test your sword against mine?', 'A steady hand begins with a steady mind. Care for a spar?'],
  ['A friendly match. We will both leave on our feet.', 'A friendly practice bout. Show me your form.'],
  ['Well struck. Come back whenever you wish to practice.', 'Well fought. We can cross swords again whenever you like.'],
  ['There is no shame in stepping back. Try again when ready.', 'Take a breath. We can continue when you are ready.'],
  ['Keep your guard steady. Rest a moment, then try again.', 'Keep training. You will find your opening.'],
  ['I will be here when you are ready.', 'Another time, then. Keep your guard steady.']
]);
const list = structuredClone(instructor.pages[0].list);
for (const command of list) {
  if (command.code === 101) command.parameters[4] = 'Shinsengumi Swordsman';
  if (command.code === 401) {
    assert(dialogue.has(command.parameters[0]), 'Update Shinsengumi dialogue mapping for changed instructor text');
    command.parameters[0] = dialogue.get(command.parameters[0]);
  }
  if (command.code === 301) command.parameters = [0, troopId, true, true];
}
const backup = path.join(root, 'docs/battles/backups/before-shinsengumi-sparring');
fs.mkdirSync(backup, { recursive: true });
for (const name of ['Map001', 'Enemies', 'Troops']) {
  const target = path.join(backup, name + '.json');
  if (!fs.existsSync(target)) fs.copyFileSync(path.join(root, 'data', name + '.json'), target);
}
npc.pages[0].list = list;
for (const [name, value] of Object.entries({ Map001: map, Enemies: enemies, Troops: troops }))
  fs.writeFileSync(path.join(root, 'data', name + '.json'), JSON.stringify(value));
console.log(JSON.stringify({ eventId: npc.id, position: [npc.x, npc.y], enemyId, troopId, poses, practice: true }));
