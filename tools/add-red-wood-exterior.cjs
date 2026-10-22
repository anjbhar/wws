// Register a new tileset without replacing either starter map's current tileset.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const dbPath=path.join(root,'data/Tilesets.json');
const imageName='EdoRedWoodExterior_D-v1';
const png=fs.readFileSync(path.join(root,'img/tilesets',imageName+'.png'));
assert.equal(png.readUInt32BE(16),768);assert.equal(png.readUInt32BE(20),768);
const sets=JSON.parse(fs.readFileSync(dbPath,'utf8'));
assert(sets[7] && sets[7].tilesetNames[8]==='EdoVillage_B-v1','Starter village reference is present');
assert(!sets[7].tilesetNames[7],'Starter D slot is available');
const existing=sets.find(s=>s && s.tilesetNames[7]===imageName);
if(existing){console.log('Already registered: '+existing.id+' '+existing.name);process.exit(0);}
const record=JSON.parse(JSON.stringify(sets[7]));
record.id=sets.length;record.name='Edo Village — Red Wood Exterior';record.tilesetNames[7]=imageName;
// MZ B–E sheets use two eight-column blocks; the new artwork occupies the left block.
const tileId=(x,y)=>512+(x%8)+y*8+(x>=8?128:0);
for(let x=0;x<16;x++)for(let y=0;y<16;y++)record.flags[tileId(x,y)]=16;
for(let y=1;y<=6;y++)for(let x=0;x<8;x++)record.flags[tileId(x,y)]=y<=3?16:15;
for(const x of [3,4])record.flags[tileId(x,6)]=0;
for(let y=8;y<=10;y++) {
    for(const x of [0,1,6])record.flags[tileId(x,y)]=15;
    for(const x of [2,3])record.flags[tileId(x,y)]=16;
}
for(let y=8;y<=9;y++)for(const x of [4,5])record.flags[tileId(x,y)]=y===9?0:15;
const backup=path.join(root,'docs/art/red-wood-exterior/Tilesets-before-v1.json');
if(!fs.existsSync(backup))fs.copyFileSync(dbPath,backup);
sets.push(record);fs.writeFileSync(dbPath,JSON.stringify(sets)+'\n');
// Verify saved slot and passage settings, including unchanged existing records.
const saved=JSON.parse(fs.readFileSync(dbPath,'utf8'));
assert.deepEqual(saved.slice(0,-1),JSON.parse(fs.readFileSync(backup,'utf8')));
assert.equal(saved[record.id].tilesetNames[7],imageName);
assert.equal(record.flags[tileId(3,6)],0);assert.equal(record.flags[tileId(2,6)],15);
assert.equal(record.flags[tileId(2,1)],16);
console.log(JSON.stringify({id:record.id,name:record.name,slot:'D',sheet:'768x768',building:'8x6 tiles',previousTilesets:'unchanged',passage:'roof star, walls blocked, threshold passable'}));
