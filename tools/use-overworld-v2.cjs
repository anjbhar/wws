const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const backup = path.join(root, 'docs/maps/backups/before-overworld-v2');
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'data', name + '.json'), 'utf8'));
const actors = read('Actors');
const map = read('Map001');
const npc = map.events.find(event => event && event.note === 'wws:samurai-sparring');
assert(npc, 'Masanori event must exist');
for (const name of ['$Samurai-v2', '$SamuraiInstructor-v2']) {
  const png = fs.readFileSync(path.join(root, 'img/characters', name + '.png'));
  assert.equal(png.readUInt32BE(16), 144);
  assert.equal(png.readUInt32BE(20), 288);
}
assert(['$Samurai-v1', '$Samurai-v2'].includes(actors[1].characterName), 'Player identity changed unexpectedly');
fs.mkdirSync(backup, { recursive: true });
for (const name of ['Actors', 'Map001']) {
  const target = path.join(backup, name + '.json');
  if (!fs.existsSync(target)) fs.copyFileSync(path.join(root, 'data', name + '.json'), target);
}
actors[1].characterName = '$Samurai-v2';
actors[1].characterIndex = 0;
for (const page of npc.pages) {
  if (['$SamuraiInstructor-v1', '$SamuraiInstructor-v2'].includes(page.image.characterName)) {
    page.image.characterName = '$SamuraiInstructor-v2';
    page.image.characterIndex = 0;
  }
}
for (const [name, value] of [['Actors', actors], ['Map001', map]]) {
  fs.writeFileSync(path.join(root, 'data', name + '.json'), JSON.stringify(value));
}
// Prevent the placement tool from reverting Masanori on a subsequent run.
const toolPath = path.join(root, 'tools/add-samurai-npc.cjs');
const tool = fs.readFileSync(toolPath, 'utf8');
fs.writeFileSync(toolPath, tool.replaceAll('$SamuraiInstructor-v1', '$SamuraiInstructor-v2'));
console.log('Assigned new player and Masanori walking sheets; original assets and database backups preserved.');
