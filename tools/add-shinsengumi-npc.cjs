const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const mapPath = path.join(root, 'data/Map001.json');
const original = fs.readFileSync(mapPath, 'utf8');
const map = JSON.parse(original);
const characterName = '$Shinsengumi-v1';
const png = fs.readFileSync(path.join(root, 'img/characters', characterName + '.png'));
assert.equal(png.readUInt32BE(16), 144);
assert.equal(png.readUInt32BE(20), 288);
const existing = map.events.find(event => event && event.note === 'wws:shinsengumi-npc');
if (existing && existing.pages.some(page => page.list.some(command => command.code === 301))) {
  console.log('Shinsengumi sparring event already exists; retaining its encounter and dialogue.');
  return;
}
const id = existing ? existing.id : map.events.length;
const x = 16, y = 10;
assert(!map.events.some(event => event && event.id !== id && event.x === x && event.y === y), 'NPC position must be unoccupied');
const instructor = map.events.find(event => event && event.note === 'wws:samurai-sparring');
assert(instructor, 'Expected courtyard NPC template');
const page = structuredClone(instructor.pages[0]);
Object.assign(page, {
  directionFix: false,
  image: { tileId: 0, characterName, characterIndex: 0, direction: 2, pattern: 1 },
  list: [
    { code: 101, indent: 0, parameters: ['', 0, 0, 2, 'Shinsengumi Swordsman'] },
    { code: 401, indent: 0, parameters: ['A steady hand begins with a steady mind.'] },
    { code: 401, indent: 0, parameters: ['This courtyard is a good place to practice both.'] },
    { code: 0, indent: 0, parameters: [] }
  ],
  moveType: 0, moveSpeed: 3, moveFrequency: 3,
  priorityType: 1, trigger: 0, through: false, walkAnime: true, stepAnime: false
});
map.events[id] = { id, name: 'Shinsengumi — Courtyard Swordsman', note: 'wws:shinsengumi-npc', x, y, pages: [page] };
// Verify map passage and reachability before writing the placement.
const sets = JSON.parse(fs.readFileSync(path.join(root, 'data/Tilesets.json'), 'utf8'));
const system = JSON.parse(fs.readFileSync(path.join(root, 'data/System.json'), 'utf8'));
const pass = (x, y, bit) => {
  for (let z = 3; z >= 0; z--) {
    const flag = sets[map.tilesetId].flags[map.data[(z * map.height + y) * map.width + x]];
    if (flag & 16) continue;
    if (!(flag & bit)) return true;
    if ((flag & bit) === bit) return false;
  }
  return false;
};
assert(pass(x, y, 15), 'NPC must stand on walkable ground');
const blocked = new Set(map.events.filter(event => event && event.pages[0].priorityType === 1 && !event.pages[0].through).map(event => `${event.x},${event.y}`));
const queue = [[system.startX, system.startY]], seen = new Set(queue.map(p => p.join(',')));
for (let i = 0; i < queue.length; i++) {
  const [cx, cy] = queue[i];
  for (const [dx, dy, bit, reverse] of [[0, 1, 1, 8], [-1, 0, 2, 4], [1, 0, 4, 2], [0, -1, 8, 1]]) {
    const nx = cx + dx, ny = cy + dy, key = `${nx},${ny}`;
    if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height || seen.has(key) || blocked.has(key)) continue;
    if (pass(cx, cy, bit) && pass(nx, ny, reverse)) { seen.add(key); queue.push([nx, ny]); }
  }
}
assert(seen.has(`${x},${y + 1}`) && pass(x, y + 1, 8) && pass(x, y, 1), 'Player must be able to approach and talk from below');
const backup = path.join(root, 'docs/maps/backups/before-shinsengumi/Map001.json');
fs.mkdirSync(path.dirname(backup), { recursive: true });
if (!fs.existsSync(backup)) fs.writeFileSync(backup, original);
fs.writeFileSync(mapPath, JSON.stringify(map));
console.log(`Placed Shinsengumi event ${id} at (${x}, ${y}); sprite dimensions, ground passage and player approach verified.`);
