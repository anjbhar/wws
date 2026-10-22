const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const backup = path.join(root, 'docs/art/overworld-larger-v1/backup');
const replacements = {'$Samurai-v2':'$Samurai-v3', '$SamuraiInstructor-v2':'$SamuraiInstructor-v3', '$Shinsengumi-v1':'$Shinsengumi-v2'};
for (const name of Object.values(replacements)) {
    const png = fs.readFileSync(path.join(root,'img/characters',name+'.png'));
    assert.equal(png.readUInt32BE(16),192);
    assert.equal(png.readUInt32BE(20),352);
}
fs.mkdirSync(backup,{recursive:true});
for (const file of ['data/Actors.json','data/Map001.json','js/plugins.js']) {
    const target=path.join(backup,path.basename(file));
    if (!fs.existsSync(target)) fs.copyFileSync(path.join(root,file),target);
}
const actorsFile=path.join(root,'data/Actors.json');
const actors=JSON.parse(fs.readFileSync(actorsFile,'utf8'));
for (const actor of actors) if (actor && replacements[actor.characterName]) actor.characterName=replacements[actor.characterName];
fs.writeFileSync(actorsFile,JSON.stringify(actors));
const mapFile=path.join(root,'data/Map001.json');
const map=JSON.parse(fs.readFileSync(mapFile,'utf8'));
for (const event of map.events) if (event) for (const page of event.pages) {
    if (replacements[page.image.characterName]) page.image.characterName=replacements[page.image.characterName];
}
fs.writeFileSync(mapFile,JSON.stringify(map));
const pluginsFile=path.join(root,'js/plugins.js');
let plugins=fs.readFileSync(pluginsFile,'utf8');
if (!plugins.includes('"WWS_OverworldCharacters"')) plugins=plugins.replace('[\n','[\n{"name":"WWS_OverworldCharacters","status":true,"description":"Regenerated larger overworld character sheets and legacy save support","parameters":{}},\n').replace('[\r\n','[\r\n{"name":"WWS_OverworldCharacters","status":true,"description":"Regenerated larger overworld character sheets and legacy save support","parameters":{}},\r\n');
fs.writeFileSync(pluginsFile,plugins);
console.log('Installed versioned walking sheets and legacy bitmap aliases.');
