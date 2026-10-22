// Replace the courtyard home while retaining its interior, NPC and other events.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,'data',name+'.json'),'utf8'));
const write=(name,value)=>fs.writeFileSync(path.join(root,'data',name+'.json'),JSON.stringify(value)+'\n');
const m=read('Map001'),sets=read('Tilesets'),home=read('Map002'),system=read('System');
if(m.note.includes('wws:dojo-courtyard-v1')){require('./check-dojo-courtyard.cjs');return;}
const compact=fs.existsSync(path.join(root,'img/tilesets/EdoRedWoodExterior_D-v2.png'));
const set=sets.find(s=>s && /^EdoRedWoodExterior_D-v[123]$/.test(s.tilesetNames[7]));
assert(set,'Registered red-wood exterior tileset is required');
assert.equal(m.width,25);assert.equal(m.height,19);
const marker='wws:red-wood-home-v'+(compact?2:1);
const layout=compact?{x:3,y:3,w:6,h:4,roof:2,doors:[2,3]}:{x:2,y:1,w:8,h:6,roof:3,doors:[3,4]};
const get=(x,y,z)=>m.data[(z*m.height+y)*m.width+x];
const put=(x,y,z,t)=>{m.data[(z*m.height+y)*m.width+x]=t;};
const tile=(x,y)=>512+y*8+x;
if(!m.note.includes(marker)) {
    const backup=path.join(root,'docs/maps/backups/'+(compact?'before-compact-home-v2':'before-red-wood-home'));
    fs.mkdirSync(backup,{recursive:true});
    for(const name of ['Map001','Tilesets']) {
        const destination=path.join(backup,name+'.json');
        if(!fs.existsSync(destination))fs.copyFileSync(path.join(root,'data',name+'.json'),destination);
    }
    // Save and move the lower left tree; remove the upper tree the wider roof replaces.
    const tree=[];
    if(!m.note.includes('wws:red-wood-home-v1')) {
        for(let y=0;y<2;y++)for(let x=0;x<2;x++)tree.push({x,y,t:get(1+x,6+y,2)});
        for(const sy of [1,6])for(let y=sy;y<sy+2;y++)for(let x=1;x<3;x++)put(x,y,2,0);
    }
    for(let y=1;y<=6;y++)for(let x=2;x<10;x++) {
        for(const z of [1,2,3,4])put(x,y,z,0);
    }
    // Transparent D tile (0,0) supplies collision under the star roof, preventing
    // walking through the house's footprint where roof pixels are transparent.
    set.flags[512]=15;
    if(compact) {
        set.tilesetNames[7]='EdoRedWoodExterior_D-v2';
        for(let y=0;y<16;y++)for(let x=0;x<8;x++)set.flags[tile(x,y)]=16;
        set.flags[512]=15;
    }
    for(let y=0;y<layout.h;y++)for(let x=0;x<layout.w;x++) {
        const entrance=y===layout.h-1 && layout.doors.includes(x);
        set.flags[tile(x,1+y)]=y<layout.roof?16:entrance?0:15;
        put(layout.x+x,layout.y+y,2,tile(x,1+y));
        if(y<layout.roof)put(layout.x+x,layout.y+y,1,512);
    }
    for(const p of tree){assert.equal(get(1+p.x,8+p.y,2),0,'Tree destination is clear');put(1+p.x,8+p.y,2,p.t);}
    m.tilesetId=set.id;
    m.note=m.note.replace(/\n?wws:red-wood-home-v1[^\n]*/g,'');
    m.note += '\n'+marker+`: red-wood home at (${layout.x},${layout.y}), ${layout.w}x${layout.h} tiles; entrances (5,6) and (6,6).`;
    const entry=m.events.find(e=>e && e.name==='Enter home');
    assert(entry,'Existing home transfer is required');assert.equal(entry.x,5);assert.equal(entry.y,6);
    let second=m.events.find(e=>e && e.name==='Enter home — right door');
    if(!second){second=structuredClone(entry);second.id=m.events.length;second.name='Enter home — right door';second.x=6;m.events.push(second);}
    second.note=marker;
    write('Tilesets',sets);write('Map001',m);
}

function passage(map,x,y,bit){
    const flags=sets[map.tilesetId].flags;
    for(let z=3;z>=0;z--){const flag=flags[map.data[(z*map.height+y)*map.width+x]];
        if(flag&16)continue;if(!(flag&bit))return true;if((flag&bit)===bit)return false;}
    return false;
}
const blockedEvents=new Set(m.events.filter(e=>e && e.pages[0].priorityType===1 && !e.pages[0].through).map(e=>e.x+','+e.y));
function reachable(sx,sy,tx,ty){
    const q=[[sx,sy]],seen=new Set([sx+','+sy]);
    for(let i=0;i<q.length;i++){
        const [x,y]=q[i];if(x===tx&&y===ty)return true;
        for(const [dx,dy,bit,rev] of [[0,1,1,8],[-1,0,2,4],[1,0,4,2],[0,-1,8,1]]){
            const nx=x+dx,ny=y+dy,key=nx+','+ny;
            if(nx<0||ny<0||nx>=m.width||ny>=m.height||seen.has(key)||blockedEvents.has(key))continue;
            if(passage(m,x,y,bit)&&passage(m,nx,ny,rev)){seen.add(key);q.push([nx,ny]);}
        }
    }
    return false;
}
assert.equal(m.tilesetId,set.id);
for(let y=0;y<layout.h;y++)for(let x=0;x<layout.w;x++) {
    assert.equal(get(x+layout.x,y+layout.y,2),tile(x,y+1),'Complete building tile assembly');
    const entrance=y===layout.h-1 && layout.doors.includes(x);
    assert.equal(passage(m,x+layout.x,y+layout.y,15),entrance,'House footprint blocks except thresholds');
}
if(compact)for(let y=1;y<=6;y++)for(let x=2;x<10;x++) {
    if(x>=3&&x<=8&&y>=3)continue;
    for(const z of [1,2,3,4])assert.equal(get(x,y,z),0,'Former footprint is cleared');
    assert(passage(m,x,y,15),'Former footprint has no invisible collision');
}
for(const [x,y] of [[5,6],[6,6],[5,7],[19,6],[12,17],[12,10]])assert(reachable(system.startX,system.startY,x,y),'Reachable '+x+','+y);
const entries=m.events.filter(e=>e && (e.name==='Enter home'||e.note===marker));
assert.equal(entries.length,2);
for(const e of entries){const command=e.pages[0].list.find(c=>c.code===201);assert.deepEqual(command.parameters,[0,2,8,9,8,0]);assert.equal(e.pages[0].trigger,1);assert(passage(home,8,9,15));}
const exit=home.events.find(e=>e && e.name==='Return to courtyard').pages[0].list.find(c=>c.code===201);
assert.deepEqual(exit.parameters,[0,1,5,7,2,0]);
assert(m.events.some(e=>e && e.note==='wws:samurai-sparring'));
assert.equal(m.data.length,m.width*m.height*6);
console.log(JSON.stringify({map:'Village Courtyard',tileset:set.id,building:[layout.x,layout.y,layout.w,layout.h],entrances:[[5,6],[6,6]],return:[5,7],collision:'passed',navigation:'passed',sparring:'preserved'}));
