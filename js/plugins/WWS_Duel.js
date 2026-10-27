/*:
 * @target MZ
 * @plugindesc v1.23 Explicit solo/party encounters and saved three-slot formations.
 * @author WWS
 * @help
 * Enabled for troop 6 (Masanori), or troops with [WWS Duel] in their name.
 * Runs with up to three allies and three tagged enemies; other battles retain stock combat.
 * Monk group practice supplies battle-only Masanori and Shinsengumi allies.
 * Other encounters are solo unless tagged [WWS Party] in the troop name.
 * Solo encounters use Hayato when present, otherwise the party leader.
 * Three active slots: Center, Left, Right. Additional actors are reserves.
 * Formation assignments persist in saves; the menu Formation command swaps slots.
 * Actor notes <DuelActorSprite: SamuraiInstructor> / <DuelActorSprite: Shinsengumi>
 * select their rear party poses. Shinsengumi can choose Seigan and use Three Stage Thrust.
 * Troop 6 is always sparring. Other tagged troops are sparring unless their
 * name also contains [Bleeding]. Bleeding duels are controlled tests only.
 * One untimed action per turn: Quick Cut, Heavy Cut, or Change Stance.
 * Parry/Block (Defense) and Dodge (Speed) trigger automatically.
 * Parry coverage depends on the defender's form and the body area attacked.
 * Cuts then select Head, Torso, Arms or Legs; selecting a target is part of
 * that same action. Cancel on targets returns to actions without spending it.
 * Temporary injuries affect both fighters. Sparring has no bleeding.
 * Weapons/enemies may use <CuttingLevel: 1> through 5; default is 1.
 * Heavy Cut raises effective cutting level by one, capped at 5.
 * At starting stats in Chudan, torso cuts deal 140 Quick / 280 Heavy damage.
 * In nonlethal practice, the player cannot fall below 1 Health or lose.
 * Choose an opening form freely before round 1; the NPC chooses its own.
 * Later stance changes use the whole turn; forms persist across rounds.
 * Each ally previews their own forms before confirming.
 * Automatic reactions briefly show Kasumi/Waki during the attack.
 * Enemy note <DuelSprite: Shinsengumi> selects Shinsengumi-{Form}-v1 poses.
 * Optional <DuelSpriteVersion: 2> selects a versioned pose set.
 * Shinsengumi pauses for dialogue once at half HP, keeping his current form.
 * His exclusive Seigan grants Three Stage Thrust: after his cut is parried,
 * immediately strike the torso again with normal parry/dodge defenses. If
 * that second strike hits or is parried, a third torso strike allows only dodge.
 * Follow-ups use Quick Cut damage. A dodge ends the chain.
 * Custom pose sets use five transparent 288x288 images in img/enemies.
 * LegendaryRonin has one Two Sword guard; every cut strikes twice with fresh
 * defenses and injuries, one action/recovery cost, and the same selected area.
 * Arrows and Enter, or click cards. Defenses never spend an action.
 * Cancel in later stance/target selection returns free. Cancel at the opening
 * picker or on actions leaves sparring; opening selection cannot be skipped.
 * No engine files or database skills need modification.
 */
(() => {
    "use strict";
    const forms = {
        Chudan: { speed: 0, power: 1, defense: 0, parry: 0, dodge: 0,
            coverage: { Head: 0.45, Torso: 0.55, Arms: 0.50, Legs: -0.02 },
            weights: [2 / 3, 1 / 3], target: "Torso",
            text: ["Upper body covered / legs open", "Normal speed / damage", "Normal defense"] },
        Jodan: { speed: 3, power: 1.15, defense: -0.10, parry: 0, dodge: 0,
            coverage: { Head: 0.60, Torso: 0, Arms: -0.04, Legs: -0.10 },
            weights: [10 / 17, 7 / 17], target: "Head",
            text: ["Head covered / legs exposed", "+3 speed / +15% damage", "Defense -10 points"] },
        Gedan: { speed: -3, power: 0.85, defense: 0.10, parry: 0, dodge: 0,
            coverage: { Head: -0.12, Torso: 0, Arms: 0.45, Legs: 0.55 },
            weights: [2 / 3, 1 / 3], target: "Arms",
            text: ["Legs covered / head exposed", "-3 speed / -15% damage", "Defense +10 points"] },
        Kasumi: { speed: -1, power: 0.95, defense: 0, parry: 0.10, dodge: 0,
            coverage: { Head: 0.48, Torso: 0.45, Arms: 0.52, Legs: -0.16 },
            weights: [5 / 7, 2 / 7], target: "Arms",
            text: ["Upper body / legs exposed", "-1 speed / -5% damage", "Auto parry +10 points"] },
        Waki: { speed: 2, power: 0.95, defense: -0.05, parry: 0, dodge: 0.10,
            coverage: { Head: -0.06, Torso: -0.03, Arms: 0.53, Legs: 0.60 },
            weights: [7 / 11, 4 / 11], target: "Legs",
            text: ["Lower guard / head open", "+2 speed / -5% damage", "Defense -5 / Auto dodge +10"] }
    };
    const stances = Object.keys(forms);
    // Shinsengumi's special form replaces Chudan for his party actor.
    forms.Seigan = { ...forms.Chudan };
    // The ronin keeps one guard; its advantage is two independent cuts per action.
    forms["Two Sword"] = { ...forms.Chudan };
    const actions = ["Quick Cut", "Heavy Cut"];
    const areas = ["Head", "Torso", "Arms", "Legs"];
    const poses = stances;
    const locations = {
        Head: { power: 1.20, defense: 0.15 }, Torso: { power: 1, defense: 0 },
        Arms: { power: 0.85, defense: 0.05 }, Legs: { power: 0.85, defense: 0.05 }
    };
    const severityNames = ["", "Light", "Medium", "Heavy"];
    const injuryLevel = (b, area) => b._wws.injuries?.[area]?.severity || 0;
    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
    const form = b => forms[b._wws?.stance] || forms.Chudan;
    const playerImage = (pose, b) => {
        const set = rules.actorSpriteSet(b);
        return `${set || "Samurai"}-${pose}Back-v${set === "SamuraiInstructor" ? 1 : 2}`;
    };
    // Crown and sole landmarks exclude blades and raised hands. Each pose uses
    // its character's neutral body height and sole baseline, without stretching.
    const spriteSizes = {
        Samurai: { width: 480, height: 384, poses: {
            Chudan: [88, 367], Jodan: [88, 367], Gedan: [88, 367],
            Kasumi: [108, 367], Waki: [88, 367]
        } },
        SamuraiInstructorBack: { width: 480, height: 384, poses: {
            Chudan: [88, 367], Jodan: [88, 367], Gedan: [88, 367], Kasumi: [108, 367], Waki: [88, 367]
        } },
        ShinsengumiBack: { width: 480, height: 384, poses: {
            Chudan: [88, 367], Jodan: [88, 367], Gedan: [88, 367], Kasumi: [108, 367], Waki: [88, 367], Seigan: [88, 367]
        } },
        SamuraiInstructor: { width: 288, height: 288, poses: {
            Chudan: [31, 267], Jodan: [51, 267], Gedan: [32, 267],
            Kasumi: [36, 267], Waki: [48, 267]
        } },
        Shinsengumi: { width: 288, height: 288, poses: {
            Chudan: [24, 266], Jodan: [54, 266], Gedan: [32, 267],
            Kasumi: [54, 266], Waki: [56, 266], Seigan: [29, 267]
        } },
        LegendaryRonin: { width: 288, height: 288, static: true, poses: { Chudan: [31, 267] } },
        WarriorMonkMasked: { width: 288, height: 384, static: true, poses: { Chudan: [132, 367] } },
        WarriorMonkUnmasked: { width: 288, height: 384, static: true, poses: { Chudan: [132, 367] } }
    };
    // Pure rules are exposed for repeatable tests and tuning without a renderer.
    const rules = globalThis.WwsDuelRules = {
        stances: stances.slice(),
        formInfo(name) { const form = forms[name]; return form ? { ...form, text: form.text.slice(), coverage: { ...form.coverage } } : null; },
        actions: actions.slice(),
        enemies() { return BattleManager._wwsDuel?.battlers.filter(b => b.isEnemy()) || []; },
        allies() { return BattleManager._wwsDuel?.allies || []; },
        actor() {
            const d=BattleManager._wwsDuel;
            return BattleManager._subject?.isActor() ? BattleManager._subject : d?.activeBattler?.isActor() ? d.activeBattler : this.allies()[0];
        },
        lane(b) {
            const team = b.isActor() ? this.allies() : this.enemies();
            const index = team.indexOf(b);
            return b.isActor() ? [1,0,2][index] : team.length === 1 ? 1 : team.length === 2 ? [0,2][index] : index;
        },
        position(b) { return ["Left", "Center", "Right"][this.lane(b)]; },
        legalTargets(b = this.actor()) {
            if(!b)return [];
            const opponents=(b.isActor()?this.enemies():this.allies()).filter(target=>target.isAlive());
            // Partial formations cannot strand a fighter or give one side immunity.
            const team = (b.isActor() ? this.allies() : this.enemies()).filter(member => member.isAlive());
            if (team.length < 3 || opponents.length < 3) return opponents;
            const lane=this.lane(b);
            return opponents.filter(target=>lane===1||this.lane(target)===1||this.lane(target)===lane);
        },
        canExecute(attacker, target, kind = "Quick Cut") {
            return kind === "Quick Cut" && !!attacker?.isActor() && !!target?.isEnemy() && target.isAlive() && target.hp < 200;
        },
        cutName(attacker, target, kind) {
            return this.canExecute(attacker, target, kind) ? "Execute" : kind;
        },
        playerTarget() {
            const d = BattleManager._wwsDuel;
            const legal=this.legalTargets();
            return legal.includes(d?.enemyTarget) ? d.enemyTarget : legal[0];
        },
        // Fixed six-slot stage: adding a teammate never shifts another fighter.
        formationSlot(side, index, width = Graphics.width, height = Graphics.height) {
            // Keep opponents just behind their opposite allies, below the HUD.
            const slots = side === "allies" ? [[.32,.75],[.17,.68],[.16,.79]] : [[.78,.65],[.64,.70],[.79,.75]];
            const count = side === "allies" ? this.allies().length : this.enemies().length;
            const slot = side === "enemies" ? count === 1 ? 1 : count === 2 ? [0,2][index] : index : index;
            const [x,y] = slots[slot];
            return {x:width*x,y:height*y};
        },
        spriteLayout(b, pose = this.pose(b)) {
            const actorSet = this.actorSpriteSet(b);
            const set = b?.isActor() ? (actorSet === "Samurai" ? actorSet : actorSet && actorSet + "Back") : this.enemySpriteSet(b);
            const size = spriteSizes[set], landmarks = size?.static ? size.poses.Chudan : size?.poses[pose];
            if (!landmarks) return null;
            const [crown, foot] = landmarks;
            const [neutralCrown, neutralFoot] = size.poses.Chudan;
            const stageScale = BattleManager._wwsDuel?.multi ? .74 : 1;
            const scale = (neutralFoot - neutralCrown) / (foot - crown) * stageScale;
            const baseline = (size.height - neutralFoot) * stageScale;
            return { scale, anchorY: (foot + baseline / scale) / size.height,
                width: size.width, height: size.height, crown, foot, baseline };
        },
        applySpriteLayout(sprite, b, pose) {
            const layout = this.spriteLayout(b, pose);
            if (!layout) return;
            sprite.scale.x = sprite.scale.y = layout.scale;
            sprite.anchor.y = layout.anchorY;
        },
        availableStances(b) {
            if (this.enemySpriteSet(b) === "LegendaryRonin") return ["Two Sword"];
            if (this.actorSpriteSet(b) === "Shinsengumi") return stances.map(stance => stance === "Chudan" ? "Seigan" : stance);
            return this.enemySpriteSet(b) === "Shinsengumi" ? [...stances, "Seigan"] : stances.slice();
        },
        actorSpriteSet(b) {
            if (!b?.isActor()) return null;
            return (b.actor().note || "").match(/<DuelActorSprite:\s*([A-Za-z0-9_-]+)\s*>/i)?.[1] || (b.actorId() === 1 ? "Samurai" : null);
        },
        playerImage(b, pose = this.playerPose(b)) { return playerImage(pose, b); },
        enemyStance(b, roll) {
            // Seigan gets 70%; each of his other five forms gets 6%.
            // Include the current form so he tends to stay in his preferred guard.
            if (this.enemySpriteSet(b) === "Shinsengumi") {
                return roll >= .3 ? "Seigan" : stances[Math.min(stances.length - 1, Math.floor(roll / .3 * stances.length))];
            }
            const available = this.availableStances(b);
            return available[Math.min(available.length - 1, Math.floor(roll * available.length))];
        },
        hasLightlessBlade(b) {
            return (this.enemySpriteSet(b) === "Shinsengumi" || this.actorSpriteSet(b) === "Shinsengumi") && b._wws?.stance === "Seigan";
        },
        hasTwoSwordAttack(b) {
            return this.enemySpriteSet(b) === "LegendaryRonin";
        },
        lightlessDefense(target, attacker, strike, roll) {
            if (strike === 3) {
                return roll < this.defenseChances(target, attacker, false, "Torso").Dodge ? "Dodge" : null;
            }
            return this.defenseOutcome(target, attacker, false, "Torso", roll);
        },
        updateBossPhase(b) {
            const d = BattleManager._wwsDuel;
            if (!d || d.mode === "finished" || !d.battlers.includes(b) || !b._wws ||
                b._wws.midBattleSpoken || b._wws.midBattlePending || this.enemySpriteSet(b) !== "Shinsengumi" ||
                b.hp <= 0 || b.hp > b.mhp / 2) return;
            // Let the current cut and its feedback finish before the dialogue.
            b._wws.midBattlePending = true;
        },
        enemySpriteSet(b) {
            if (!b?.isEnemy()) return null;
            const match = (b.enemy().note || "").match(/<DuelSprite:\s*([A-Za-z0-9_-]+)\s*>/i);
            return match ? match[1] : b.enemyId() === 6 ? "SamuraiInstructor" : null;
        },
        enemyImage(b, pose = this.pose(b)) {
            const fixed = (b.enemy().note || "").match(/<DuelStaticSprite:\s*([A-Za-z0-9_-]+)\s*>/i);
            if (fixed) return fixed[1];
            const set = this.enemySpriteSet(b);
            if (set === "Shinsengumi" && pose === "Seigan") return "Shinsengumi-Seigan-v1";
            const version = (b.enemy().note || "").match(/<DuelSpriteVersion:\s*([1-9][0-9]*)\s*>/i)?.[1] || "1";
            return set ? `${set}-${pose}-v${version}` : null;
        },
        pose(b) {
            if (b._wws?.reaction === "Parry") return "Kasumi";
            if (b._wws?.reaction === "Dodge") return "Waki";
            return this.availableStances(b).includes(b._wws?.stance) ? b._wws.stance : "Chudan";
        },
        playerPose(b) {
            const d = BattleManager._wwsDuel;
            return d && d.mode === "stance" && this.actor() === b && this.availableStances(b).includes(d.previewStance) ? d.previewStance : this.pose(b);
        },
        initiative(b) { return b.agi + form(b).speed - b._wws.recovery - 2 * injuryLevel(b, "Legs"); },
        defenseChances(b, attacker, heavy = false, area = "Torso") {
            // One probability distribution: a cut can trigger only one reaction.
            // Each stat difference contributes 0.2 percentage points per point.
            const shared = (form(b).defense + (heavy ? 0.15 : 0) +
                locations[area].defense - 0.05 * injuryLevel(b, "Head")) / 2;
            const chances = {
                Parry: clamp(0.15 + (b.def - attacker.atk) * 0.002 + form(b).parry + form(b).coverage[area] + shared, 0.01, 0.80),
                Dodge: clamp(0.05 + (b.agi - attacker.agi) * 0.002 + form(b).dodge + shared, 0.01, 0.55)
            };
            // Preserve strong parry coverage when both defenses reach the cap.
            // Always leave at least a 10% opening, even with extreme stats.
            chances.Dodge = Math.min(chances.Dodge, 0.90 - chances.Parry);
            return chances;
        },
        defense(b, attacker, heavy, area = "Torso") {
            return Object.values(this.defenseChances(b, attacker, heavy, area)).reduce((sum, chance) => sum + chance, 0);
        },
        defenseOutcome(b, attacker, heavy, area, roll) {
            for (const [kind, chance] of Object.entries(this.defenseChances(b, attacker, heavy, area))) {
                if (roll < chance) return kind;
                roll -= chance;
            }
            return null;
        },
        damage(a, b, heavy, area = "Torso") {
            return Math.max(1, Math.round(Math.max(1, 4 * a.atk - 2 * b.def) * (5 / 3) *
                form(a).power * (heavy ? 2 : 1) * locations[area].power *
                (1 - 0.10 * injuryLevel(a, "Arms"))));
        },
        cuttingLevel(b, heavy) {
            const records = b.isActor() ? b.weapons() : [b.enemy()];
            const level = Math.max(1, ...records.map(record => {
                const match = (record.note || "").match(/<CuttingLevel:\s*([1-5])\s*>/i);
                return match ? Number(match[1]) : 1;
            }));
            return Math.min(5, level + (heavy ? 1 : 0));
        },
        woundSeverity(level, roll) {
            // Original outline: 80/18/2, 70/26/4, 60/34/6, 50/42/8, 40/50/10.
            const light = (90 - 10 * clamp(level, 1, 5)) / 100;
            const heavy = 0.02 * clamp(level, 1, 5);
            return roll < light ? 1 : roll < 1 - heavy ? 2 : 3;
        },
        wound(b, area, severity, sparring) {
            const injuries = b._wws.injuries;
            injuries[area] = { severity: Math.max(severity, injuryLevel(b, area)), rounds: 2 };
            // Practice impacts never bleed. Torso trauma adds a one-off recovery cost.
            if (area === "Torso") this.recover(b, severity);
            if (!sparring && severity >= 2) this.bleed(b, severity === 3 ? 3 : 2);
        },
        tickInjuries(battlers) {
            for (const b of battlers) for (const [area, injury] of Object.entries(b._wws.injuries)) {
                if (--injury.rounds <= 0) delete b._wws.injuries[area];
            }
        },
        recover(b, amount) { b._wws.recovery = Math.min(11, b._wws.recovery + amount); },
        bleed(b, rounds = 2) { b._wws.bleeding = Math.max(b._wws.bleeding, rounds); },
        tickBleeding(battlers) {
            // Compute everyone first; the caller checks the outcome after all ticks.
            const ticks = battlers.filter(b => b.isAlive() && b._wws.bleeding > 0)
                .map(b => ({ b, damage: Math.max(1, Math.floor(b.mhp * 0.05)) }));
            for (const { b, damage } of ticks) { b._wws.bleeding--; b.gainHp(-damage); }
            return ticks;
        }
    };
    const battlerName = Game_Enemy.prototype.battlerName;
    Game_Enemy.prototype.battlerName = function() {
        if (this._wws && !$gameSystem.isSideView() && rules.enemySpriteSet(this)) {
            return rules.enemyImage(this);
        }
        return battlerName.call(this);
    };
    const actorSpriteVisible = Game_Actor.prototype.isSpriteVisible;
    Game_Actor.prototype.isSpriteVisible = function() {
        const d = BattleManager._wwsDuel;
        return !!(d && d.allies.includes(this) && this._wws && rules.actorSpriteSet(this) && !$gameSystem.isSideView()) || actorSpriteVisible.call(this);
    };
    // Keep combat capacity consistent with the engine, followers and reserves.
    Game_Party.prototype.maxBattleMembers = function() { return 3; };
    Game_Party.prototype.wwsFormation = function() {
        const active = this.allMembers().slice(0, this.maxBattleMembers());
        const ids = active.map(actor => actor.actorId());
        const saved = Array.isArray(this._wwsFormation) ? this._wwsFormation : [];
        const slots = [0,1,2].map(index => ids.includes(saved[index]) && saved.indexOf(saved[index]) === index ? saved[index] : null);
        for (const id of ids) if (!slots.includes(id)) slots[slots.indexOf(null)] = id;
        // Compact empty slots so a lone member always occupies the center.
        this._wwsFormation = slots.filter(id => id !== null);
        return this._wwsFormation.map(id => active.find(actor => actor.actorId() === id));
    };
    Game_Party.prototype.setWwsFormation = function(ids) {
        const active = this.allMembers().slice(0, this.maxBattleMembers()).map(actor => actor.actorId());
        if (!Array.isArray(ids) || ids.length !== active.length || new Set(ids).size !== ids.length || ids.some(id => !active.includes(id))) return false;
        this._wwsFormation = ids.slice();
        $gamePlayer?.refresh();
        return true;
    };
    Game_Party.prototype.allBattleMembers = function() { return this.wwsFormation(); };
    const swapPartyOrder = Game_Party.prototype.swapOrder;
    Game_Party.prototype.swapOrder = function(index1, index2) {
        const before = this.wwsFormation().map(actor => actor.actorId());
        const first = this._actors[index1], second = this._actors[index2];
        swapPartyOrder.call(this, index1, index2);
        this._wwsFormation = before.map(id => id === first ? second : id === second ? first : id);
        this.wwsFormation();
        $gamePlayer.refresh();
    };
    // Make the stock Formation menu's combat meaning visible, including reserves.
    if (typeof Window_MenuStatus !== "undefined") {
        const drawMenuStatus = Window_MenuStatus.prototype.drawItemStatus;
        Window_MenuStatus.prototype.drawItemStatus = function(index) {
            drawMenuStatus.call(this, index);
            const slot = $gameParty.wwsFormation().indexOf(this.actor(index));
            const rect = this.itemRect(index), size = this.contents.fontSize;
            this.contents.fontSize = 18;
            this.contents.fillRect(rect.x + 2, rect.y + rect.height - 28, 140, 26, "rgba(24,29,28,0.94)");
            this.drawText(["Center", "Left", "Right"][slot] || "Reserve", rect.x + 6, rect.y + rect.height - 33, 132, "center");
            this.contents.fontSize = size;
        };
    }
    const actorIndex=Game_Actor.prototype.index;
    Game_Actor.prototype.index=function(){const d=BattleManager._wwsDuel;return d&&!d.partyRestored&&d.allies.includes(this)?d.allies.indexOf(this):actorIndex.call(this);};
    const partyMembers=Game_Party.prototype.members,battleMembers=Game_Party.prototype.battleMembers;
    const temporaryParty=()=>{const d=BattleManager._wwsDuel;return d&&!d.partyRestored&&($gameParty.inBattle()||d.startingParty||d.endingParty)?d.allies:null;};
    Game_Party.prototype.members=function(){return temporaryParty()||partyMembers.call(this);};
    Game_Party.prototype.battleMembers=function(){return temporaryParty()||battleMembers.call(this);};
    const partyStart=Game_Party.prototype.onBattleStart;
    Game_Party.prototype.onBattleStart=function(advantageous){
        const d=BattleManager._wwsDuel;if(d)d.startingParty=true;
        try{partyStart.call(this,advantageous);}finally{if(d)d.startingParty=false;}
    };
    const partyEnd=Game_Party.prototype.onBattleEnd;
    Game_Party.prototype.onBattleEnd=function(){
        const d=BattleManager._wwsDuel;if(d)d.endingParty=true;
        try{partyEnd.call(this);}finally{if(d){d.partyRestored=true;d.endingParty=false;}}
    };
    const actionSubject=Game_Action.prototype.subject,actionTargets=Game_Action.prototype.makeTargets;
    Game_Action.prototype.subject=function(){return this._wwsSubject||actionSubject.call(this);};
    Game_Action.prototype.makeTargets=function(){
        if(this._wwsSubject)return rules.legalTargets(this._wwsSubject).includes(this._wwsTarget)?[this._wwsTarget]:[];
        return actionTargets.call(this);
    };
    function practiceCompanions(hero) {
        return ["SamuraiInstructor", "Shinsengumi"].map(set => {
            const record = $dataActors.find(actor => actor?.note.includes(`<DuelActorSprite: ${set}>`));
            if (!record) throw new Error(`Missing monk practice actor: ${set}`);
            // Fresh battle-only instances never change the saved party or guests.
            const guest = new Game_Actor(record.id);
            guest.changeLevel(hero.level, false);
            guest.recoverAll();
            return guest;
        });
    }
    const practiceProtected = battler => {
        const d = BattleManager._wwsDuel;
        return !!(d && d.sparring && d.mode !== "finished" && battler._wws && d.allies.includes(battler));
    };
    // Clamp before the engine checks for death, covering direct HP changes and
    // round-end effects as well as incoming cuts. Stock/lethal battles are unchanged.
    const refreshBattler = Game_BattlerBase.prototype.refresh;
    Game_BattlerBase.prototype.refresh = function() {
        if (practiceProtected(this)) {
            this._hp = Math.max(1, this._hp);
            const d = BattleManager._wwsDuel;
            if (this._hp === 1 && !d.protectionShown) {
                d.protectionShown = true;
                globalThis.WwsDuelFeedback?.protect(this);
            }
        }
        refreshBattler.call(this);
        rules.updateBossPhase(this);
    };
    const gainHp = Game_Battler.prototype.gainHp;
    Game_Battler.prototype.gainHp = function(value) {
        if (practiceProtected(this) && value < 0) value = Math.max(value, 1 - this.hp);
        gainHp.call(this, value);
    };
    const setup = BattleManager.setup;
    BattleManager.setup = function(troopId, canEscape, canLose) {
        this._wwsDuel = null;
        setup.call(this, troopId, canEscape, canLose);
        const troop = $gameTroop.troop();
        const partyBattle = troop.name.includes('[WWS Party]') || troop.name.includes('[WWS Monk Group]');
        const active = $gameParty.battleMembers().slice();
        const hero = $gameParty.allMembers().find(actor => actor.actorId() === 1) || active[0];
        const allies = partyBattle ? active : hero ? [hero] : [];
        if ((troopId === 6 || troop.name.includes("[WWS Duel]") || partyBattle) &&
            allies.length>=1&&allies.length<=3 && $gameTroop.members().length >= 1 && $gameTroop.members().length <= 3 && !this.isTpb()) {
            const temporaryAllies=allies.length===1&&allies[0].actorId()===1&&troop.name.includes('[WWS Monk Group]');
            if(temporaryAllies)allies.push(...practiceCompanions(allies[0]));
            const battlers = [...allies, ...$gameTroop.members()];
            for (const b of battlers) b._wws = { stance: null, reaction: null, recovery: 0, bleeding: 0, injuries: {} };
            this._wwsDuel = { battlers, allies,temporaryAllies,openingIndex:0, multi: battlers.length > 2, round: 0, sparring: troopId === 6 || !troop.name.includes("[Bleeding]"),
                opening: true, mode: "", order: [], pending: [], notice: "Choose your opening form. No turn cost." };
        }
    };
    const checkBattleEnd=BattleManager.checkBattleEnd;
    BattleManager.checkBattleEnd=function(){
        if(checkBattleEnd.call(this))return true;
        const d=this._wwsDuel;
        // End a stalemate only if no surviving fighter has a legal target.
        if(d?.multi&&!d.opening&&d.mode!=="finished"&&d.battlers.some(b=>b.isAlive())&&!d.battlers.some(b=>b.isAlive()&&rules.legalTargets(b).length)){
            $gameMessage.add("Neither side can reach the remaining opponents. The fight ends in a draw.");
            this.endBattle(1);return true;
        }
        return false;
    };
    const startInput = BattleManager.startInput;
    BattleManager.startInput = function() {
        const d = this._wwsDuel;
        if (!d) return startInput.call(this);
        this._logWindow.clear(); // Old action text must not cover the form previews.
        d.activeBattler = null;
        if (d.opening) {
            if (!d.introShown && d.multi) {
                d.introShown = true;
                d.mode = "openingDialogue";
                this._phase = "wws";
                this._inputting = false;
                $gameMessage.setFaceImage("", 0);
                $gameMessage.setBackground(0);
                $gameMessage.setPositionType(2);
                $gameMessage.setSpeakerName("Group practice");
                $gameMessage.add("Each fighter gets one turn per round. Choose a form for each ally.");
                $gameMessage.add("Flanks can attack their opposite or the center. Centers can attack anyone.");
                $gameMessage.add("When either team has fewer than three fighters, everyone can target any opponent.");
                $gameMessage.add("Choose an opponent, then a body area. Defeat them all to win.");
                return;
            }
            if (!d.introShown && rules.enemySpriteSet(d.battlers[1]) === "Shinsengumi") {
                d.introShown = true;
                d.mode = "openingDialogue";
                this._phase = "wws";
                this._inputting = false;
                $gameMessage.setFaceImage("", 0);
                $gameMessage.setBackground(0);
                $gameMessage.setPositionType(2);
                $gameMessage.setSpeakerName(d.battlers[1].name());
                $gameMessage.add("Draw your blade. Let me see the strength of your resolve.");
                $gameMessage.add("Keep your guard steady. I won't hold back.");
                return;
            }
            // No round, initiative, recovery or turn is spent before confirmation.
            this._subject = d.allies[d.openingIndex];
            d.activeBattler=this._subject;
            d.mode = "stance";
            d.previewStance = d.previewStance || stances[0];
            d.notice = "Choose your opening form. No turn cost.";
            this._phase = "wws";
            this._inputting = false;
            return;
        }
        d.round++;
        d.previewStance = null;
        const living = d.battlers.filter(b => b.isAlive());
        const offset = (d.round - 1) % living.length;
        d.order = living.map((b, i) => ({ b, speed: rules.initiative(b), tie: (i - offset + living.length) % living.length }))
            .sort((a, b) => b.speed - a.speed || a.tie - b.tie).map(entry => entry.b);
        d.pending = d.order.slice();
        for (const b of d.battlers) b._wws.recovery = 0;
        $gameTroop.increaseTurn();
        d.mode = "reveal";
        d.remaining = .4;
        d.notice = `${d.order[0].name()} acts first. Attack or change stance.`;
        this._phase = "wws";
        this._inputting = false;
    };
    BattleManager.wwsChooseStance = function(stance) {
        const d = this._wwsDuel, b = this._subject;
        if (d?.opening) {
            if (d.mode !== "stance" || b !== d.allies[d.openingIndex] || !rules.availableStances(b).includes(stance)) return;
            b._wws.stance = stance;
            d.openingIndex++;
            d.previewStance=null;
            if(d.openingIndex<d.allies.length){this.startInput();return;}
            for (const enemy of rules.enemies()) enemy._wws.stance = rules.enemyStance(enemy, Math.random());
            d.opening = false;
            d.previewStance = null;
            this._subject = null;
            this.startInput();
            return;
        }
        if (!d || !b || !(b.isActor() ? d.mode === "stance" : ["advance", "reveal"].includes(d.mode)) ||
            !rules.availableStances(b).includes(stance) || stance === b._wws.stance) return;
        b._wws.stance = stance;
        d.previewStance = null;
        d.kind = "Change Stance";
        d.mode = "advance";
        d.remaining = .65;
        d.notice = `${b.name()} changes to ${stance}. Turn used.`;
        this._logWindow.clear();
        this._logWindow.addText(d.notice);
        globalThis.WwsDuelFeedback?.stance(b, stance);
        this._subject = null;
    };
    BattleManager.wwsCancelStance = function() {
        const d = this._wwsDuel;
        if (!d || d.mode !== "stance" || d.opening) return;
        d.previewStance = null;
        d.mode = "action";
        d.notice = "Attack or change stance. Each uses your turn.";
    };
    BattleManager.wwsNext = function() {
        const d = this._wwsDuel;
        if (d.opening) return;
        if (this.checkBattleEnd()) return;
        let b;
        do { b = d.pending.shift(); } while (b && !b.isAlive());
        if (!b) {
            for (const { b: target, damage } of rules.tickBleeding(d.battlers)) {
                target.startDamagePopup();
                this._logWindow.addText(`${target.name()} bleeds for ${damage} Health.`);
            }
            if (d.battlers.every(target => !target.isAlive()) && d.sparring) {
                $gameMessage.add("A draw. Both fighters lower their swords.");
                // Existing loss branch restores both combat readiness and map control.
                this.endBattle(2);
                return;
            }
            if (this.checkBattleEnd()) return;
            rules.tickInjuries(d.battlers);
            for (const target of d.battlers) target.onTurnEnd();
            d.mode = "roundEnd";
            d.remaining = 0.6;
            return;
        }
        this._subject = b;
        d.activeBattler = b;
        globalThis.WwsDuelFeedback?.turn(b);
        if(!rules.legalTargets(b).length){
            this._subject=null;d.mode="advance";d.remaining=.4;
            d.notice=`${b.name()} holds position. No reachable opponents.`;return;
        }
        if (b.isActor()) {
            d.mode = "action";
            d.notice = "Attack or change stance. Each uses your turn." + (d.sparring ? " Cancel leaves sparring." : "");
        } else {
            const weights = form(b).weights;
            let roll = Math.random(), index = 0;
            // Reconsider form on 20% of turns. Keeping the same form allows an
            // attack; actually changing form still spends the whole turn.
            if (rules.availableStances(b).length === 1) {
                // A fixed guard always attacks, including rolls in the usual
                // stance-change range. Never spend a turn changing to undefined.
            } else if (roll < .2 && rules.enemySpriteSet(b) === "Shinsengumi") {
                const next = rules.enemyStance(b, roll / .2);
                if (next !== b._wws.stance) {
                    this.wwsChooseStance(next);
                    return;
                }
                roll /= .2;
            } else if (roll < .2) {
                const alternatives = rules.availableStances(b).filter(stance => stance !== b._wws.stance);
                this.wwsChooseStance(alternatives[Math.min(alternatives.length - 1, Math.floor(roll / .2 * alternatives.length))]);
                return;
            } else roll = (roll - .2) / .8;
            while (index < weights.length - 1 && roll >= weights[index]) roll -= weights[index++];
            this.wwsChooseAction(actions[index]);
        }
    };
    BattleManager.wwsChooseAction = function(kind, area = null) {
        const d = this._wwsDuel, b = this._subject;
        if (d && b?.isActor() && d.mode === "action" && kind === "Change Stance") {
            d.mode = "stance";
            d.previewStance = b._wws.stance;
            d.notice = "Change stance uses this turn. Cancel returns for free.";
            return;
        }
        if (!b || !actions.includes(kind) || !["action", "advance", "reveal"].includes(d.mode)) return;
        if (area !== null && !areas.includes(area)) return;
        d.kind = kind;
        if (b.isActor() && area === null) {
            const enemies = rules.legalTargets(b);
            if(!enemies.length)return;
            d.enemyPreview = null;
            d.enemyTarget = enemies.length === 1 ? enemies[0] : null;
            if (rules.canExecute(b, d.enemyTarget, kind)) {
                this.wwsCommitCut("Head");
                return;
            }
            d.mode = enemies.length > 1 ? "opponent" : "target";
            d.notice = `${kind}: ${enemies.length > 1 ? "choose an opponent, then a body area" : "choose a body area"}. Cancel returns to actions.`;
            return;
        }
        if (area === null) {
            // Both fighters have identical target rules; the NPC favors its stance.
            const favored = form(b).target;
            const roll = Math.random();
            area = roll < 0.55 ? favored : areas[Math.min(3, Math.floor((roll - 0.55) / 0.45 * 4))];
        }
        this.wwsCommitCut(area);
    };
    BattleManager.wwsChooseTarget = function(area) {
        const d = this._wwsDuel;
        if (d.mode !== "target" || !areas.includes(area)) return;
        this.wwsCommitCut(area);
    };
    BattleManager.wwsChooseOpponent = function(index) {
        const d = this._wwsDuel;
        if (!d || d.mode !== "opponent") return;
        const enemy = rules.legalTargets().find(b => b.index() === index);
        if (!enemy) return;
        d.enemyTarget = enemy;
        d.enemyPreview = null;
        if (rules.canExecute(this._subject, enemy, d.kind)) {
            this.wwsCommitCut("Head");
            return;
        }
        d.mode = "target";
        d.notice = `${d.kind}: choose a body area on ${enemy.name()}.`;
    };
    BattleManager.wwsCancelTarget = function() {
        const d = this._wwsDuel;
        if (!["target", "opponent"].includes(d.mode)) return;
        if (d.mode === "target" && rules.legalTargets().length > 1) {
            d.mode = "opponent";
            d.enemyTarget = null;
            d.notice = "Choose an opponent. No turn spent.";
        } else {
            d.mode = "action";
            d.enemyTarget = null;
            d.notice = "Attack or change stance. Each uses your turn.";
        }
    };
    BattleManager.wwsCommitCut = function(area) {
        const d = this._wwsDuel, b = this._subject, kind = d.kind;
        const legal=rules.legalTargets(b);
        const target = b.isActor() ? rules.playerTarget() : legal.length===1?legal[0]:legal[Math.floor(Math.random()*legal.length)];
        if (!legal.includes(target)) return;
        if (rules.canExecute(b, target, kind)) d.kind = "Execute";
        d.lightlessStrike = 1;
        d.twoSwordStrike = rules.hasTwoSwordAttack(b) ? 1 : 0;
        d.area = d.kind === "Execute" ? "Head" : area;
        if (kind === "Heavy Cut") rules.recover(b, 8);
        d.target = target;
        d.defense = d.kind === "Execute" ? null : rules.defenseOutcome(target, b, kind === "Heavy Cut", area, Math.random());
        this.wwsAttack();
    };
    BattleManager.wwsAttack = function() {
        const d = this._wwsDuel;
        const action = new Game_Action(this._subject);
        action._wwsSubject=this._subject;action._wwsTarget=d.target;
        action.setSkill(236);
        action.setTarget(d.target.index());
        this._subject._actions = [action];
        d.mode = "animation";
        d.notice = d.kind === "Execute" ? `${this._subject.name()}: Execute → ${d.target.name()}.` : `${this._subject.name()}: ${d.kind}${d.twoSwordStrike ? " · " + d.twoSwordStrike + "/2" : ""} → ${d.area}.`;
        this._logWindow.clear();
        this._logWindow.addText(d.notice);
        this.startAction();
        this._subject.removeCurrentAction();
    };
    const phase = BattleManager.updatePhase;
    BattleManager.updatePhase = function(timeActive) {
        if (!this._wwsDuel || this._phase !== "wws") return phase.call(this, timeActive);
        const d = this._wwsDuel;
        if (d.mode === "finished") return;
        if (d.mode === "openingDialogue") {
            if (!$gameMessage.isBusy()) this.startInput();
            return;
        }
        if (d.mode === "lightlessDialogue") {
            if ($gameMessage.isBusy()) return;
            const { mode, remaining } = d.lightlessTransition;
            d.lightlessTransition = null;
            d.mode = mode;
            d.remaining = Math.max(remaining || 0, 0.8);
            return;
        }
        const teacher = d.battlers.find(b => b._wws?.lightlessExplanationPending && b.isAlive());
        if (teacher && !$gameMessage.isBusy()) {
            // Let the final strike settle before explaining the technique.
            teacher._wws.lightlessExplanationDelay -= 1 / 60;
            if (teacher._wws.lightlessExplanationDelay > 0) return;
            teacher._wws.lightlessExplanationPending = false;
            teacher._wws.lightlessExplained = true;
            d.lightlessTransition = { mode: d.mode, remaining: d.remaining };
            d.mode = "lightlessDialogue";
            $gameMessage.setFaceImage("", 0);
            $gameMessage.setBackground(0);
            $gameMessage.setPositionType(2);
            $gameMessage.setSpeakerName(teacher.name());
            $gameMessage.add("It's called Three Stage Thrust. When you parry my blade,");
            $gameMessage.add("I can strike twice more in an instant.");
            return;
        }
        if (d.mode === "bossDialogue") {
            if ($gameMessage.isBusy()) return;
            const { battler, mode, remaining } = d.bossTransition;
            if (battler.isAlive() && battler._wws) {
                battler._wws.midBattlePending = false;
                battler._wws.midBattleSpoken = true;
            }
            d.bossTransition = null;
            d.mode = mode;
            d.remaining = Math.max(remaining || 0, 0.8);
            return;
        }
        const boss = d.battlers.find(b => b._wws?.midBattlePending && b.isAlive());
        if (boss && !$gameMessage.isBusy()) {
            d.bossTransition = { battler: boss, mode: d.mode, remaining: d.remaining };
            d.mode = "bossDialogue";
            $gameMessage.setFaceImage("", 0);
            $gameMessage.setBackground(0);
            $gameMessage.setPositionType(2);
            $gameMessage.setSpeakerName(boss.name());
            $gameMessage.add("You've held your ground. Good.");
            $gameMessage.add("A parry is only the beginning. Watch for the blade that follows.");
            return;
        }
        // Scene calls only while active, and manager only while messages/animations are idle.
        // MZ schedules simulation updates at 60 Hz, including on faster displays.
        const dt = 1 / 60;
        if (["reveal", "advance", "roundEnd"].includes(d.mode)) {
            d.remaining -= dt;
            if (d.remaining <= 0) {
                if (d.mode === "roundEnd") this.startInput();
                else this.wwsNext();
            }
        }
    };
    const invoke = BattleManager.invokeAction;
    BattleManager.invokeAction = function(subject, target) {
        const d = this._wwsDuel;
        if (!d) return invoke.call(this, subject, target);
        target.clearResult();
        subject.clearResult();
        const result = target.result();
        result.used = true;
        result.physical = true;
        result.evaded = d.defense === "Parry" || d.defense === "Dodge";
        target._wws.reaction = d.defense;
        const beforeHp = target.hp;
        let injuryChange = null;
        if (!result.evaded) {
            const damage = d.kind === "Execute" ? target.hp : rules.damage(subject, target, d.kind === "Heavy Cut", d.area);
            this._action.executeDamage(target, damage);
            if (target.isAlive()) {
                const severity = rules.woundSeverity(rules.cuttingLevel(subject, d.kind === "Heavy Cut"), Math.random());
                const previous = injuryLevel(target, d.area);
                rules.wound(target, d.area, severity, d.sparring);
                if (severity > previous) {
                    injuryChange = { area: d.area, severity };
                    this._logWindow.addText(`${target.name()}: ${severityNames[severity]} ${d.area.toLowerCase()} ${d.sparring ? "practice impact" : "wound"}.`);
                }
            }
        }
        const outcome = { Parry: "Parried", Dodge: "Dodged" };
        this._logWindow.addText(d.defense ? `${target.name()}: ${outcome[d.defense]}.` : `${target.name()} takes ${beforeHp - target.hp} damage.`);
        globalThis.WwsDuelFeedback?.impact({ subject, target, area: d.kind === "Execute" ? "Neck" : d.area, execute: d.kind === "Execute", heavy: d.kind === "Heavy Cut", defense: d.defense, damage: Math.max(0, beforeHp - target.hp), lightlessStrike: d.kind === "Three Stage Thrust" ? d.lightlessStrike : 0, twoSwordStrike: d.twoSwordStrike || 0 });
        if (injuryChange) globalThis.WwsDuelFeedback?.injury(target, injuryChange.area, injuryChange.severity);
        this._logWindow.displayActionResults(subject, target);
    };
    const endAction = BattleManager.endAction;
    BattleManager.endAction = function() {
        if (!this._wwsDuel) return endAction.call(this);
        const d = this._wwsDuel;
        d.target._wws.reaction = null;
        this._logWindow.endAction(this._subject);
        // The second blade follows hits, parries AND dodges. It stays within
        // the same turn and uses the same cut/area, with fresh defense and injury
        // rolls evaluated against the state left by the first impact.
        if (d.twoSwordStrike === 1 && rules.hasTwoSwordAttack(this._subject) &&
            this._subject.isAlive() && d.target.isAlive()) {
            d.twoSwordStrike = 2;
            d.defense = rules.defenseOutcome(d.target, this._subject, d.kind === "Heavy Cut", d.area, Math.random());
            this.wwsAttack();
            return;
        }
        d.twoSwordStrike = 0;
        // The initial cut must be parried. Strike two continues on a hit or
        // parry, with at most two follow-ups in this same turn.
        const continuesLightless = d.defense === "Parry" ||
            (d.lightlessStrike === 2 && d.kind === "Three Stage Thrust" && !d.defense);
        if (continuesLightless && d.lightlessStrike < 3 && rules.hasLightlessBlade(this._subject) &&
            this._subject.isAlive() && d.target.isAlive()) {
            d.lightlessStrike++;
            d.kind = "Three Stage Thrust";
            d.area = "Torso";
            d.defense = rules.lightlessDefense(d.target, this._subject, d.lightlessStrike, Math.random());
            this.wwsAttack();
            globalThis.WwsDuelFeedback?.emit({ type: "stance", target: this._subject,
                text: `THREE STAGE THRUST · ${d.lightlessStrike}/3${d.lightlessStrike === 3 ? " · DODGE ONLY" : ""}`, duration: 48 });
            return;
        }
        if (d.kind === "Three Stage Thrust" && this._subject.isEnemy() && !this._subject._wws.lightlessExplained) {
            this._subject._wws.lightlessExplanationPending = true;
            this._subject._wws.lightlessExplanationDelay = 0.75;
        }
        d.lightlessStrike = 0;
        this._subject.setActionState("done");
        this._subject = null;
        this._phase = "wws";
        this._wwsDuel.mode = "advance";
        this._wwsDuel.remaining = 0.5;
    };
    // Suppress stock ending jingles even when an older save overrides the
    // database's empty victory/defeat music settings.
    for (const method of ["playVictoryMe", "playDefeatMe"]) {
        const playEndingMe = BattleManager[method];
        BattleManager[method] = function() {
            if (!this._wwsDuel) return playEndingMe.call(this);
        };
    }
    const battleEnd = BattleManager.endBattle;
    BattleManager.endBattle = function(result) {
        if (this._wwsDuel) {
            this._wwsDuel.mode = "finished";
            for (const b of this._wwsDuel.battlers) delete b._wws;
        }
        battleEnd.call(this, result);
    };

    const ui = globalThis.WwsDuelUI = {
        ink: "rgba(24,29,28,0.94)", text: "#f0e7d4", muted: "#b7b7a7", accent: "#b86c54", line: "#51574e",
        textAt(window, text, x, y, width, size = 16, color = this.text, align = "left", serif = false) {
            window.contents.fontFace = serif ? "Georgia" : "Arial";
            window.contents.fontSize = size;
            window.contents.outlineWidth = 0;
            window.contents.textColor = color;
            window.drawText(text, x, y, width, align);
        },
        panel(window, x = 0, y = 0, width = window.innerWidth, height = window.innerHeight) {
            window.contents.fillRect(x, y, width, height, this.ink);
            window.contents.fillRect(x, y, width, 1, this.line);
        },
        bottomRect() { return new Rectangle(20, Graphics.boxHeight - 156, Graphics.boxWidth - 40, 140); }
    };
    class Window_DuelCards extends Window_Command {
        initialize(rect) { this._mode = ""; super.initialize(rect); this.opacity = 0; this.hide(); this.deactivate(); }
        lineHeight() { return 24; }
        maxCols() { return this._mode === "opponent" ? Math.max(1, rules.legalTargets().length) : this._mode === "target" ? 4 : this._mode === "action" ? actions.length + 1 : rules.availableStances(rules.actor()).length; }
        itemHeight() { return 76; }
        itemRect(index) {
            const width = this.innerWidth / this.maxCols();
            return new Rectangle(index * width + 8, 32, width - 16, 76);
        }
        drawItemBackground() {}
        drawAllItems() { ui.panel(this); super.drawAllItems(); }
        refreshCursor() { this.setCursorRect(0, 0, 0, 0); }
        select(index) {
            const changed = this.index() !== index;
            super.select(index);
            if (changed && this.contents) this.refresh();
        }
        refresh() {
            super.refresh();
            if (!this.contents || !["stance", "action", "target", "opponent"].includes(this._mode)) return;
            const opening = BattleManager._wwsDuel?.opening;
            const targetTitle = BattleManager._wwsDuel?.multi ? `BODY AREA · ${rules.playerTarget()?.name() || ""}` : "CHOOSE YOUR TARGET";
            const actorLabel=BattleManager._wwsDuel?.allies.length>1?`${rules.actor().name().toUpperCase()} · `:"";
            ui.textAt(this, this._mode === "stance" ? actorLabel+(opening ? "CHOOSE OPENING FORM · FREE" : "CHANGE FORM · USES YOUR TURN") : this._mode === "opponent" ? actorLabel+"CHOOSE AN OPPONENT" : this._mode === "target" ? targetTitle : actorLabel+"YOUR TURN", 16, 2, 620, 12, ui.muted);
            const cancel = opening ? (BattleManager._wwsDuel.sparring && BattleManager.canEscape() ? "     Esc  Leave" : "") : "     Esc  " + (["target", "stance", "opponent"].includes(this._mode) ? "Back" : "Leave");
            ui.textAt(this, "← →  Select     Enter  Confirm" + cancel, this.innerWidth - 440, 2, 424, 12, ui.muted, "right");
        }
        makeCommandList() {
            if (this._mode === "opponent") {
                for (const enemy of rules.legalTargets()) this.addCommand(enemy.name(), "choose", true, enemy.index());
                return;
            }
            const names = this._mode === "stance" ? rules.availableStances(rules.actor()) : this._mode === "action" ? [...actions, "Change Stance"] : this._mode === "target" ? areas : [];
            for (const name of names) {
                const targets = name === "Quick Cut" && !BattleManager._wwsDuel?.multi ? rules.legalTargets() : [];
                const count = targets.filter(target => rules.canExecute(rules.actor(), target)).length;
                const label = count ? (count === targets.length ? "Execute" : "Quick Cut / Execute") : name;
                this.addCommand(label, "choose", this._mode !== "stance" || BattleManager._wwsDuel?.opening || name !== rules.actor()?._wws.stance, name);
            }
        }
        drawItem(index) {
            const rect = this.itemRect(index), name = this.commandName(index);
            const selected = this.index() === index;
            this.contents.fillRect(rect.x, rect.y, rect.width, rect.height, selected ? "rgba(113,65,50,0.65)" : ui.ink);
            this.contents.fillRect(rect.x, rect.y + rect.height - 2, rect.width, 2, selected ? ui.accent : ui.line);
            ui.textAt(this, name, rect.x + 16, rect.y + 2, rect.width - 32, 23, ui.text, "left", true);
            const descriptions = { "Execute": "Sure hit · Defeats enemy", "Quick Cut / Execute": "Execute enemies below 200 HP", "Quick Cut": "Light cut · No recovery", "Heavy Cut": "Double damage · Recovery −8", "Change Stance": "Choose a new form · Uses this turn",
                Head: "More damage · Weaken defense", Torso: "Steady damage · Slow recovery",
                Arms: "Weaken their cuts", Legs: "Reduce their speed" };
            const summary = name === "Seigan" ? "Parried cut → Three Stage Thrust" : forms[name]?.text[0] || descriptions[name] || "";
            ui.textAt(this, summary, rect.x + 16, rect.y + 28, rect.width - 32, 13, ui.muted);
            if (forms[name]) ui.textAt(this, name === rules.actor()?._wws.stance ? "Current form" : forms[name].text[1], rect.x + 16, rect.y + 48, rect.width - 32, 12, ui.muted);
            if (this._mode === "opponent") {
                const enemy = rules.enemies().find(b => b.index() === this._list[index].ext);
                ui.textAt(this, `${enemy.hp} / ${enemy.mhp} Health · ${enemy._wws.stance}`, rect.x + 16, rect.y + 30, rect.width - 32, 15, ui.muted);
                const execute = selected && rules.canExecute(rules.actor(), enemy, BattleManager._wwsDuel.kind);
                ui.textAt(this, execute ? "Execute · Sure hit · Defeats enemy" : "Select opponent, then choose a body area", rect.x + 16, rect.y + 52, rect.width - 32, 13, ui.muted);
            }
            if (this._mode === "target") {
                const d = BattleManager._wwsDuel;
                const target = rules.playerTarget();
                const chances = rules.defenseChances(target, rules.actor(), d.kind === "Heavy Cut", name);
                const damage = rules.damage(rules.actor(), target, d.kind === "Heavy Cut", name);
                const execute = rules.canExecute(rules.actor(), target, d.kind);
                ui.textAt(this, execute ? "Execute · 100% hit · Defeats enemy" : `${damage} damage · ${Math.round((1 - chances.Parry - chances.Dodge) * 100)}% hit`, rect.x + 16, rect.y + 48, rect.width - 32, 14, ui.text);
            }
        }
        setMode(mode) {
            const actor=rules.actor();
            if (this._mode === mode&&this._modeActor===actor) return;
            this._modeActor=actor;
            this._mode = mode;
            this.refresh();
            const current = actor?._wws?.stance;
            this.select(mode === "stance" ? Math.max(0, rules.availableStances(actor).indexOf(current)) : 0);
            if (["stance", "action", "target", "opponent"].includes(mode)) { this.show(); this.activate(); }
            else { this.hide(); this.deactivate(); }
        }
        update() {
            super.update();
            const d = BattleManager._wwsDuel;
            if (this._mode === "opponent" && this.active && d?.mode === "opponent") {
                d.enemyPreview = rules.legalTargets().find(b => b.index() === this.currentExt());
            }
            if (this._mode === "stance" && this.active && d?.mode === "stance" && rules.availableStances(rules.actor()).includes(this.currentExt())) {
                d.previewStance = this.currentExt();
            }
        }
    }
    class Window_DuelHud extends Window_Base {
        initialize(rect) { super.initialize(rect); this.opacity = 0; }
        lineHeight() { return 24; }
        refreshTeams(d, health) {
            const width = Math.floor(this.innerWidth * .27), gap = 18;
            for (const [side,team] of [[0,d.battlers.filter(b=>b.isActor())],[1,rules.enemies()]]) {
                const x = side ? this.innerWidth-width : 0;
                team.forEach((b,index)=>{
                    const y=index*50, bar=health[d.battlers.indexOf(b)];
                    const selected=(d.mode==="opponent" ? d.enemyPreview : d.mode==="target" ? d.enemyTarget : d.activeBattler)===b;
                    ui.panel(this,x,y,width,48);
                    if(selected)this.contents.fillRect(x,y,width,2,ui.accent);
                    ui.textAt(this,b.name(),x+12,y-5,width*.61,18,b.isAlive()?ui.text:ui.muted,"left",true);
                    const stance=!b.isAlive()?"Defeated":b===rules.actor()&&d.mode==="stance"?d.previewStance||"Choose form":b._wws.stance||"Unrevealed";
                    ui.textAt(this,stance,x+width*.64,y-5,width*.36-12,12,ui.muted,"right");
                    const barWidth=width*.36;
                    this.contents.fillRect(x+12,y+24,barWidth,3,"#42483f");
                    this.contents.fillRect(x+12,y+24,barWidth*bar.trail/b.mhp,3,"#dbc49c");
                    this.contents.fillRect(x+12,y+24,barWidth*bar.value/b.mhp,3,side?ui.accent:"#9eaf91");
                    ui.textAt(this,rules.position(b),x+width*.44,y+10,width*.19,11,ui.muted);
                    ui.textAt(this,`${b.hp} / ${b.mhp}`,x+width*.64,y+10,width*.36-12,11,ui.muted,"right");
                    const tags=Object.entries(b._wws.injuries).map(([area,injury])=>`${area}: ${severityNames[injury.severity].toLowerCase()} ${injury.rounds}r`);
                    if(b._wws.recovery)tags.push(`Recovery −${b._wws.recovery}`);
                    if(b._wws.bleeding)tags.push(`Bleeding ${b._wws.bleeding}`);
                    if(tags.length)ui.textAt(this,tags.join(" · "),x+12,y+27,width-24,11,"#d6ad8b");
                });
            }
            const x=width+gap,w=this.innerWidth-2*(width+gap);
            // Match the single duel's small round/turn display.
            ui.panel(this,x+(w-220)/2,0,220,78);
            ui.textAt(this,d.sparring?"GROUP PRACTICE":"GROUP BATTLE",x,0,w,11,ui.muted,"center");
            ui.textAt(this,d.opening?"Opening form":`Round ${String(d.round).padStart(2,"0")}`,x,22,w,25,ui.text,"center",true);
            const turn=d.mode==="stance"?(d.allies.length>1?`${rules.actor().name()}: choose form`:"Choose your form"):d.activeBattler?(d.activeBattler.isActor()&&d.allies.length===1?"Your turn":`${d.activeBattler.name()}'s turn`):"Next turn";
            ui.textAt(this,turn,x,52,w,13,ui.muted,"center");
        }
        refresh() {
            const d = BattleManager._wwsDuel;
            if (!d || d.mode === "finished") return;
            const health = d.battlers.map(b => globalThis.WwsDuelFeedback?.health(b) || { value: b.hp, trail: b.hp });
            const key = JSON.stringify([d.mode, d.round, d.previewStance, d.enemyPreview?.index(), d.enemyTarget?.index(), d.activeBattler?.name(), d.order.map(b => b.name()), d.battlers.map((b, i) =>
                [b.hp, b.mhp, Math.round(health[i].value), Math.round(health[i].trail), b._wws.stance, b._wws.recovery, b._wws.bleeding, b._wws.injuries])]);
            if (this._drawn === key) return;
            this._drawn = key;
            this.contents.clear();
            if(d.multi){this.refreshTeams(d,health);return;}
            const w = d.multi ? Math.min(285, this.innerWidth * (d.battlers.length > 3 ? 0.19 : 0.23)) : Math.min(360, this.innerWidth * 0.32);
            const enemyStart = this.innerWidth - (d.battlers.length - 1) * w - (d.battlers.length - 2) * 12;
            d.battlers.forEach((b, i) => {
                const x = i === 0 ? 0 : d.multi ? enemyStart + (i - 1) * (w + 12) : this.innerWidth - w;
                ui.panel(this, x, 0, w, 100);
                const selected = d.multi && (d.mode === "opponent" ? d.enemyPreview : d.mode === "target" ? d.enemyTarget : null) === b;
                if (d.activeBattler === b || selected) this.contents.fillRect(x, 0, w, 2, ui.accent);
                ui.textAt(this, b.name(), x + 16, 8, w * (d.multi && i ? 0.64 : 0.55), d.multi ? 20 : 24, b.isAlive() ? ui.text : ui.muted, "left", true);
                const stance = !b.isAlive() ? "Defeated" : i === 0 && d.mode === "stance" ? `${d.previewStance || b._wws.stance} · preview` : b._wws.stance || (i === 0 ? "Choose a form" : "Unrevealed");
                ui.textAt(this, stance, x + w * (d.multi && i ? 0.66 : 0.48), 10, w * (d.multi && i ? 0.34 : 0.52) - 16, d.multi ? 12 : 13, ui.muted, "right");
                this.contents.fillRect(x + 16, 42, w - 32, 4, "#42483f");
                this.contents.fillRect(x + 16, 42, Math.round((w - 32) * health[i].trail / b.mhp), 4, "#dbc49c");
                this.contents.fillRect(x + 16, 42, Math.round((w - 32) * health[i].value / b.mhp), 4, i === 0 ? "#9eaf91" : ui.accent);
                ui.textAt(this, `${b.hp} / ${b.mhp}`, x + 16, 48, w - 32, 13, ui.muted);
                const tags = Object.entries(b._wws.injuries).map(([area, injury]) => `${area}: ${severityNames[injury.severity].toLowerCase()} ${injury.rounds}r`);
                if (b._wws.recovery) tags.push(`Recovery −${b._wws.recovery}`);
                if (b._wws.bleeding) tags.push(`Bleeding ${b._wws.bleeding}`);
                if (tags.length) ui.textAt(this, tags.join(" · "), x + 16, 72, w - 32, 12, "#d6ad8b");
            });
            const centerX = w + 20, centerW = d.multi ? enemyStart - centerX - 20 : this.innerWidth - 2 * w - 40;
            ui.panel(this, centerX + (centerW - 220) / 2, 0, 220, 78);
            ui.textAt(this, d.multi ? (d.sparring ? "GROUP PRACTICE" : "GROUP BATTLE") : d.sparring ? "PRACTICE DUEL" : "DUEL", centerX, 0, centerW, 11, ui.muted, "center");
            ui.textAt(this, d.opening ? "Opening form" : `Round ${String(d.round).padStart(2, "0")}`, centerX, 22, centerW, 25, ui.text, "center", true);
            const turn = d.mode === "stance" ? "Choose your form" : d.activeBattler ? (d.activeBattler.isActor() ? "Your turn" : `${d.activeBattler.name()}'s turn`) : d.order[0] === d.battlers[0] ? "You act first" : `${d.order[0]?.name() || d.battlers[1].name()} acts first`;
            ui.textAt(this, turn, centerX, 52, centerW, 13, ui.muted, "center");
        }
    }
    const createWindows = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function() {
        createWindows.call(this);
        if (!BattleManager._wwsDuel) return;
        if (!$gameSystem.isSideView()) {
            // Warm each opponent's own poses before later swaps.
            for (const b of BattleManager._wwsDuel.battlers.filter(b => rules.enemySpriteSet(b))) {
                for (const pose of poses) ImageManager.loadEnemy(rules.enemyImage(b, pose));
                if (rules.enemySpriteSet(b) === "Shinsengumi") ImageManager.loadEnemy(rules.enemyImage(b, "Seigan"));
            }
        }
        if (!$gameSystem.isSideView()) {
            for (const ally of rules.allies().filter(b => rules.actorSpriteSet(b)))
                for (const pose of rules.availableStances(ally)) ImageManager.loadBitmap("img/battlers/", playerImage(pose, ally));
        }
        this._duelHud = new Window_DuelHud(new Rectangle(20, 16, Graphics.boxWidth - 40, BattleManager._wwsDuel.multi ? 174 : 126));
        this._duelCards = new Window_DuelCards(ui.bottomRect());
        this._duelCards.setHandler("choose", () => {
            const choice = this._duelCards.currentExt(), mode = BattleManager._wwsDuel.mode;
            if (mode === "stance") BattleManager.wwsChooseStance(choice);
            else if (mode === "action") BattleManager.wwsChooseAction(choice);
            else if (mode === "opponent") BattleManager.wwsChooseOpponent(choice);
            else if (mode === "target") BattleManager.wwsChooseTarget(choice);
        });
        this._duelCards.setHandler("cancel", () => {
            const d = BattleManager._wwsDuel;
            if (["target", "opponent"].includes(d.mode)) BattleManager.wwsCancelTarget();
            else if (d.mode === "stance" && !d.opening) BattleManager.wwsCancelStance();
            else if (d.sparring && BattleManager.canEscape() && ["stance", "action"].includes(d.mode)) {
                BattleManager.processPartyEscape();
            } else this._duelCards.activate();
        });
        this._logWindow.y = 144;
        this._logWindow.opacity = 0;
        this._logWindow.maxLines = () => 2;
        const resetLogFont = this._logWindow.resetFontSettings;
        this._logWindow.resetFontSettings = function() {
            resetLogFont.call(this);
            this.contents.fontFace = "Arial";
            this.contents.fontSize = 17;
        };
        this.addWindow(this._duelHud);
        this.addWindow(this._duelCards);
    };
    const visibility = Scene_Battle.prototype.updateVisibility;
    Scene_Battle.prototype.updateVisibility = function() {
        if (!this._duelHud) return visibility.call(this);
        for (const w of [this._statusWindow, this._partyCommandWindow, this._actorCommandWindow]) { w.hide(); w.deactivate(); }
        if (this._cancelButton) this._cancelButton.visible = false;
        const d = BattleManager._wwsDuel;
        this._duelHud.refresh();
        this._duelCards.setMode($gameMessage.isBusy() ? "message" : d.mode);
        this._duelHud.visible = d.mode !== "finished";
    };
    // Register a real battler sprite so slash animations and damage popups find
    // each ally. Form previews change only the image, never combat state.
    class Sprite_DuelPlayer extends Sprite_Battler {
        initialize(battler) {
            super.initialize(battler);
            this.updateBitmap();
            this._damageFlash = 0;
            const home=BattleManager._wwsDuel.multi?rules.formationSlot("allies",rules.allies().indexOf(battler)):{x:Graphics.width*.26,y:Graphics.height-154};
            this.setHome(home.x,home.y);
        }
        updateBitmap() {
            const pose = rules.playerPose(this._battler);
            if (pose !== this._pose) {
                this._pose = pose;
                this.bitmap = ImageManager.loadBitmap("img/battlers/", playerImage(pose, this._battler));
                rules.applySpriteLayout(this, this._battler, pose);
            }
        }
        update() {
            super.update();
            const b = this._battler;
            if (!b) return;
            if (b.isMotionRequested()) {
                if (b.motionType() === "damage") this._damageFlash = 12;
                b.clearMotion();
            }
            if (b.isWeaponAnimationRequested()) b.clearWeaponAnimation();
            if (this._damageFlash > 0) {
                this.setBlendColor([255, 64, 64, this._damageFlash * 12]);
                this._damageFlash--;
            } else this.setBlendColor([0, 0, 0, 0]);
            this.opacity = b.isDead() ? 128 : 255;
        }
        damageOffsetY() { return -180; }
    }
    const createActors = Spriteset_Battle.prototype.createActors;
    Spriteset_Battle.prototype.createActors = function() {
        createActors.call(this);
        const d = BattleManager._wwsDuel;
        if (d && !$gameSystem.isSideView()) {
            for(const ally of d.allies.filter(b => rules.actorSpriteSet(b))){
                const sprite = new Sprite_DuelPlayer(ally);
                this._actorSprites.push(sprite);
                this._battleField.addChild(sprite);
            }
            // Paint the back rank first so the front rank remains readable.
            for(const fighter of [...this._enemySprites,...this._actorSprites].filter(s=>s._battler).sort((a,b)=>a._homeY-b._homeY))this._battleField.addChild(fighter);
        }
    };
    const createEnemies = Spriteset_Battle.prototype.createEnemies;
    Spriteset_Battle.prototype.createEnemies = function() {
        createEnemies.call(this);
        if (BattleManager._wwsDuel) {
            const playerVisible = !$gameSystem.isSideView() && BattleManager._wwsDuel.allies.some(b => rules.actorSpriteSet(b));
            // Reserve the lower-left foreground for the player and keep all
            // fighters between the HUD and action cards.
            for (const sprite of this._enemySprites) {
                const home=BattleManager._wwsDuel.multi?rules.formationSlot("enemies",sprite._battler.index()):{x:Graphics.width*(playerVisible ? .68 : .5),y:Graphics.height-(playerVisible?220:180)};
                sprite.setHome(home.x,home.y);
            }
            if (!$gameSystem.isSideView()) for (const sprite of this._enemySprites) {
                if (!rules.enemySpriteSet(sprite._battler)) continue;
                // Scale the complete sprite, including its target markers. Native
                // hit regions still map through worldTransform for mouse input.
                const updateBitmap = sprite.updateBitmap;
                sprite.updateBitmap = function() {
                    updateBitmap.call(this);
                    rules.applySpriteLayout(this, this._battler);
                };
                rules.applySpriteLayout(sprite, sprite._battler);
            }
            if (BattleManager._wwsDuel.multi) for (const sprite of this._enemySprites) {
                const marker=new Sprite(new Bitmap(160,44));marker.x=-80;marker.y=-18;
                const c=marker.bitmap.context;c.strokeStyle="#f0d49c";c.lineWidth=4;c.beginPath();c.ellipse(80,22,72,15,0,0,Math.PI*2);c.stroke();marker.bitmap.baseTexture.update();
                sprite.addChild(marker);marker.visible=false;
                // A pointer stays legible when the rear rank's feet overlap.
                const pointer=new Sprite(new Bitmap(26,20));pointer.x=-13;
                const p=pointer.bitmap.context;p.fillStyle="#f0d49c";p.beginPath();p.moveTo(2,2);p.lineTo(24,2);p.lineTo(13,18);p.closePath();p.fill();pointer.bitmap.baseTexture.update();
                sprite.addChild(pointer);pointer.visible=false;
                const update = sprite.update;
                sprite.update = function() {
                    update.call(this);
                    const d = BattleManager._wwsDuel;
                    const selected = d && (d.mode === "opponent" ? d.enemyPreview : d.mode === "target" ? d.enemyTarget : null) === this._battler;
                    marker.visible=!!selected&&this._battler.isAlive();
                    pointer.visible=marker.visible;
                    const layout=rules.spriteLayout(this._battler);
                    pointer.y=layout?layout.crown-layout.anchorY*layout.height-28:-250;
                };
            }
        }
    };
})();
