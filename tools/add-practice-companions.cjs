// Recruitable companion records; the saved starting party stays unchanged.
const fs = require('node:fs'), path = require('node:path');
const file = path.resolve(__dirname, '../data/Actors.json');
const actors = JSON.parse(fs.readFileSync(file, 'utf8'));
for (const [name, set, sheet] of [
    ['Masanori', 'SamuraiInstructor', '$SamuraiInstructor-v3'],
    ['Shinsengumi Swordsman', 'Shinsengumi', '$Shinsengumi-v2']
]) {
    const note = `<DuelActorSprite: ${set}>`;
    const id = actors.find(a => a?.note.includes(note))?.id || actors.length;
    actors[id] = {...structuredClone(actors[1]), id, name, characterName: sheet,
        characterIndex: 0, note: note + '\nRecruitable courtyard companion; also available as a monk-practice guest.',
        profile: set === 'SamuraiInstructor'
            ? 'A seasoned instructor who joins your company in the dojo courtyard.'
            : 'A disciplined swordsman who brings Seigan and Three Stage Thrust to your company.'};
}
fs.writeFileSync(file, '[\n' + actors.map(a => JSON.stringify(a)).join(',\n') + '\n]\n');
console.log(actors.filter(a => a?.note.includes('DuelActorSprite')).map(a => ({id: a.id, name: a.name})));
