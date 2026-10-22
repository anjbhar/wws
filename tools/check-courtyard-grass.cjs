const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const map = read('data/Map001.json'), sets = read('data/Tilesets.json');
const v3 = sets[map.tilesetId].tilesetNames[4] === 'EdoCourtyard_A5-grass-v3';
const v2 = sets[map.tilesetId].tilesetNames[4] === 'EdoCourtyard_A5-grass-v2';
const backup = `docs/maps/backups/before-courtyard-grass-${v3 ? 'v3' : v2 ? 'v2' : 'v1'}/`;
const before = read(backup+'Map001.json');
const oldSets = read(backup+'Tilesets.json');
assert.deepEqual({...map, data: null}, {...before, data: null});
assert.deepEqual(map.data.slice(map.width*map.height), before.data.slice(map.width*map.height));
function passage(m, tilesets) {
    const c = vm.createContext({console, ImageManager:{isObjectCharacter:n=>n.startsWith('!'),isZeroParallax:()=>false}, $dataMap:m, $dataTilesets:tilesets,
        $dataSystem:read('data/System.json'), $dataCommonEvents:[],
        $gameSwitches:{value:()=>false}, $gameVariables:{value:()=>0},
        $gameSelfSwitches:{value:()=>false}, $gameParty:{hasItem:()=>false},
        Graphics:{width:1280,height:720}});
    vm.runInContext('Array.prototype.contains=Array.prototype.includes; Number.prototype.mod=function(n){return (this%n+n)%n};',c);
    vm.runInContext(fs.readFileSync(path.join(root,'js/rmmz_objects.js'),'utf8'),c);
    return vm.runInContext(`var $gameMap=new Game_Map(); $gameMap.setup(1);
        var result=[]; for(var y=0;y<$gameMap.height();y++)for(var x=0;x<$gameMap.width();x++)
        for(var d of [2,4,6,8])result.push($gameMap.isPassable(x,y,d)); JSON.stringify(result);`,c);
}
assert.equal(passage(map,sets),passage(before,oldSets),'All 1,500 directional passage checks unchanged');
let grass=0, dirt=0;
if(v2 || v3){
    const info=read(`docs/art/courtyard-grass-${v3 ? 'v3' : 'v2'}/export.json`);
    assert.deepEqual(info.dirtBoundsInclusive,v3 ? [7,5,17,11] : [9,6,16,10]);
    if(v3) assert.equal(info.centerPixels[0],map.width*48/2);
    else assert(info.dirtBoundingCells<info.previousDirtCells/2);
    assert(info.tiles<=64);
    for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++){
        const t=map.data[y*map.width+x];
        assert(t>=1600&&t<1600+info.tiles);
        assert.equal(sets[map.tilesetId].flags[t],0);
    }
    console.log(`PASS: ${v3 ? 'centered symmetrical' : 'smaller'} rounded dirt footprint, ${info.transitionCells} turf-edge cells, all ${map.width*map.height*4} directional passages, upper layers, events and map settings preserved.`);
    return;
}
for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++){
    const i=y*map.width+x,t=map.data[i];
    if(x>=7&&x<=18&&y>=5&&y<=11){assert.equal(t,before.data[i]);dirt++;}
    else {assert(t>=1600&&t<1664);assert.equal(sets[map.tilesetId].flags[t],0);grass++;}
}
assert(grass>map.width*map.height/2);
console.log(`PASS: ${grass} grass / ${dirt} retained dirt cells; all 1,500 directional passages, upper layers, events and map settings preserved.`);
