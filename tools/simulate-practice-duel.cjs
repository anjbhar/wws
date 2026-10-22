// Seeded balance sampling through the actual duel BattleManager and Game_Action.
// Presentation pauses are skipped; attack, defense, wounds and initiative are real.
const { context, run } = require('./lib/duel-harness.cjs')();
const samples = Number(process.argv[2] || 2000);
if (!Number.isInteger(samples) || samples < 1) throw Error('Pass a positive integer sample count');
context.balanceSamples = samples;
context.balanceCandidates = process.argv.includes('--candidates') ? [
    [500,31,20,28], [520,31,20,28], [530,31,20,28], [540,31,20,28]
] : null;
const results = run(`
BattleManager.playVictoryMe=()=>{};BattleManager.playDefeatMe=()=>{};BattleManager.replayBgmAndBgs=()=>{};
const originalParams=$dataEnemies[6].params.slice();
const candidates=balanceCandidates || [[originalParams[0],originalParams[2],originalParams[3],originalParams[6]]];
const policies=['mixed','quick-torso','heavy-torso','seek-openings'];
const results=[];
for(const [hp,attack,defense,speed] of candidates){
    $dataEnemies[6].params=[hp,0,attack,defense,12,16,speed,20];
    const rows=[];
    for(const policy of policies){
        let wins=0,rounds=0,remaining=0,stalls=0,seed=20261020;
        Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
        for(let trial=0;trial<balanceSamples;trial++){
            $gameMessage.clear();log.texts.length=0;reset(6,true);let outcome=-1,steps=0;
            BattleManager.setEventCallback(result=>outcome=result);
            while(outcome<0&&steps++<500){
                const duel=BattleManager._wwsDuel,player=duel.battlers[0],enemy=duel.battlers[1];
                if(duel.mode==='action'&&policy==='mixed'&&Math.random()<.2){
                    BattleManager.wwsChooseAction('Change Stance');
                }else if(duel.mode==='stance'){
                    const forms=WwsDuelRules.stances;
                    const alternatives=forms.filter(form=>form!==player._wws.stance);
                    BattleManager.wwsChooseStance(duel.opening&&policy!=='mixed'?'Chudan':alternatives[Math.floor(Math.random()*alternatives.length)]);
                }else if(duel.mode==='action'){
                    const kind=policy==='heavy-torso'?'Heavy Cut':policy==='mixed'&&Math.random()<.35?'Heavy Cut':'Quick Cut';
                    const areas=['Head','Torso','Arms','Legs'];let area='Torso';
                    if(policy==='mixed')area=areas[Math.floor(Math.random()*4)];
                    if(policy==='seek-openings')area=areas.reduce((best,next)=>
                        WwsDuelRules.damage(player,enemy,false,next)*(1-WwsDuelRules.defense(enemy,player,false,next))>
                        WwsDuelRules.damage(player,enemy,false,best)*(1-WwsDuelRules.defense(enemy,player,false,best))?next:best,'Torso');
                    BattleManager.wwsChooseAction(kind,area);
                }else if(BattleManager._phase==='action')resolve();
                else if(duel.mode==='roundEnd')BattleManager.startInput();
                else if(['reveal','advance'].includes(duel.mode))BattleManager.wwsNext();
                else throw Error('Unexpected combat mode: '+duel.mode);
            }
            const duel=BattleManager._wwsDuel;
            if(outcome<0)stalls++;
            if(outcome===0)wins++;
            rounds+=duel.round;
            const survivor=duel.battlers.find(b=>b.isAlive());
            if(survivor)remaining+=survivor.hp/survivor.mhp;
        }
        rows.push({policy,playerWinPercent:Number((100*wins/balanceSamples).toFixed(1)),
            averageRounds:Number((rounds/balanceSamples).toFixed(1)),winnerHealthPercent:Number((100*remaining/balanceSamples).toFixed(1)),stalls});
    }
    results.push({enemy:{hp,attack,defense,speed},practicePlayerMinimumHp:1,samplesPerPolicy:balanceSamples,policies:rows});
}
$dataEnemies[6].params=originalParams;
results;
`);
console.log(JSON.stringify(results, null, 2));
