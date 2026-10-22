/*:
 * @target MZ
 * @plugindesc v1.14 Free opening form; later stance changes use a turn.
 * @author WWS
 * @help
 * Enabled for troop 6 (Masanori), or troops with [WWS Duel] in their name.
 * Only runs with one actor and one enemy; other battles retain stock combat.
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
 * Actor 1 previews each form on the stance cards before confirming.
 * Automatic reactions briefly show Kasumi/Waki during the attack.
 * Enemy note <DuelSprite: Shinsengumi> selects Shinsengumi-{Form}-v1 poses.
 * Optional <DuelSpriteVersion: 2> selects a versioned pose set.
 * Shinsengumi speaks before drawing a second sword at half HP; one fixed stance.
 * Custom pose sets use five transparent 288x288 images in img/enemies.
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
    // Enemy-only phase: never offered among the player's five forms.
    forms.TwoSword = { ...forms.Chudan };
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
    const playerImage = pose => `Samurai-${pose}Back-v2`;
    // Crown and sole landmarks exclude blades and raised hands. Each pose uses
    // its character's neutral body height and sole baseline, without stretching.
    const spriteSizes = {
        Samurai: { width: 480, height: 384, poses: {
            Chudan: [88, 367], Jodan: [88, 367], Gedan: [88, 367],
            Kasumi: [108, 367], Waki: [88, 367]
        } },
        SamuraiInstructor: { width: 288, height: 288, poses: {
            Chudan: [31, 267], Jodan: [51, 267], Gedan: [32, 267],
            Kasumi: [36, 267], Waki: [48, 267]
        } },
        Shinsengumi: { width: 288, height: 288, poses: {
            Chudan: [24, 266], Jodan: [54, 266], Gedan: [32, 267],
            Kasumi: [54, 266], Waki: [56, 266], TwoSword: [32, 270]
        } }
    };
    // Pure rules are exposed for repeatable tests and tuning without a renderer.
    const rules = globalThis.WwsDuelRules = {
        stances: stances.slice(),
        actions: actions.slice(),
        spriteLayout(b, pose = this.pose(b)) {
            const set = b?.isActor() ? (b.actorId() === 1 ? "Samurai" : null) : this.enemySpriteSet(b);
            const size = spriteSizes[set], landmarks = size?.poses[pose];
            if (!landmarks) return null;
            const [crown, foot] = landmarks;
            const [neutralCrown, neutralFoot] = size.poses.Chudan;
            const scale = (neutralFoot - neutralCrown) / (foot - crown);
            const baseline = size.height - neutralFoot;
            return { scale, anchorY: (foot + baseline / scale) / size.height,
                width: size.width, height: size.height, crown, foot, baseline };
        },
        applySpriteLayout(sprite, b, pose) {
            const layout = this.spriteLayout(b, pose);
            if (!layout) return;
            sprite.scale.x = sprite.scale.y = layout.scale;
            sprite.anchor.y = layout.anchorY;
        },
        availableStances(b) { return b._wws?.twoSword ? ["TwoSword"] : stances.slice(); },
        updateBossPhase(b) {
            const d = BattleManager._wwsDuel;
            if (!d || d.mode === "finished" || !d.battlers.includes(b) || !b._wws ||
                b._wws.twoSword || b._wws.twoSwordPending || this.enemySpriteSet(b) !== "Shinsengumi" ||
                b.hp <= 0 || b.hp > b.mhp / 2) return;
            // Let the current cut and its feedback finish before the dialogue.
            b._wws.twoSwordPending = true;
        },
        enemySpriteSet(b) {
            if (!b?.isEnemy()) return null;
            const match = (b.enemy().note || "").match(/<DuelSprite:\s*([A-Za-z0-9_-]+)\s*>/i);
            return match ? match[1] : b.enemyId() === 6 ? "SamuraiInstructor" : null;
        },
        enemyImage(b, pose = this.pose(b)) {
            const set = this.enemySpriteSet(b);
            const version = (b.enemy().note || "").match(/<DuelSpriteVersion:\s*([1-9][0-9]*)\s*>/i)?.[1] || "1";
            return set ? `${set}-${pose}-v${version}` : null;
        },
        pose(b) {
            if (b._wws?.twoSword) return "TwoSword";
            if (b._wws?.reaction === "Parry") return "Kasumi";
            if (b._wws?.reaction === "Dodge") return "Waki";
            return stances.includes(b._wws?.stance) ? b._wws.stance : "Chudan";
        },
        playerPose(b) {
            const d = BattleManager._wwsDuel;
            return d && d.mode === "stance" && d.battlers[0] === b && stances.includes(d.previewStance) ? d.previewStance : this.pose(b);
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
        return !!(d && d.battlers[0] === this && this._wws && this.actorId() === 1 && !$gameSystem.isSideView()) || actorSpriteVisible.call(this);
    };
    const practiceProtected = battler => {
        const d = BattleManager._wwsDuel;
        return !!(d && d.sparring && d.mode !== "finished" && battler._wws && d.battlers[0] === battler);
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
        setup.call(this, troopId, canEscape, canLose);
        const troop = $gameTroop.troop();
        this._wwsDuel = null;
        if ((troopId === 6 || troop.name.includes("[WWS Duel]")) &&
            $gameParty.battleMembers().length === 1 && $gameTroop.members().length === 1 && !this.isTpb()) {
            const battlers = [$gameParty.battleMembers()[0], $gameTroop.members()[0]];
            for (const b of battlers) b._wws = { stance: null, reaction: null, recovery: 0, bleeding: 0, injuries: {} };
            this._wwsDuel = { battlers, round: 0, sparring: troopId === 6 || !troop.name.includes("[Bleeding]"),
                opening: true, mode: "", order: [], pending: [], notice: "Choose your opening form. No turn cost." };
        }
    };
    const startInput = BattleManager.startInput;
    BattleManager.startInput = function() {
        const d = this._wwsDuel;
        if (!d) return startInput.call(this);
        this._logWindow.clear(); // Old action text must not cover the form previews.
        d.activeBattler = null;
        if (d.opening) {
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
            this._subject = d.battlers[0];
            d.mode = "stance";
            d.previewStance = d.previewStance || stances[0];
            d.notice = "Choose your opening form. No turn cost.";
            this._phase = "wws";
            this._inputting = false;
            return;
        }
        d.round++;
        d.previewStance = null;
        const scores = d.battlers.map(b => rules.initiative(b));
        const first = scores[0] === scores[1] ? (d.round - 1) % 2 : scores[0] > scores[1] ? 0 : 1;
        d.order = [d.battlers[first], d.battlers[1 - first]];
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
            if (d.mode !== "stance" || b !== d.battlers[0] || !stances.includes(stance)) return;
            b._wws.stance = stance;
            d.battlers[1]._wws.stance = stances[Math.randomInt(stances.length)];
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
        const b = d.pending.shift();
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
        if (b.isActor()) {
            d.mode = "action";
            d.notice = "Attack or change stance. Each uses your turn." + (d.sparring ? " Cancel leaves sparring." : "");
        } else {
            const weights = form(b).weights;
            let roll = Math.random(), index = 0;
            // Stance changes cost the NPC its attack too; it keeps its form 80% of turns.
            if (!b._wws.twoSword && roll < .2) {
                const alternatives = stances.filter(stance => stance !== b._wws.stance);
                this.wwsChooseStance(alternatives[Math.min(3, Math.floor(roll / .2 * 4))]);
                return;
            }
            if (!b._wws.twoSword) roll = (roll - .2) / .8;
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
            d.mode = "target";
            d.notice = `${kind}: choose a body area. Cancel returns to actions.`;
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
    BattleManager.wwsCancelTarget = function() {
        const d = this._wwsDuel;
        if (d.mode !== "target") return;
        d.mode = "action";
        d.notice = "Attack or change stance. Each uses your turn.";
    };
    BattleManager.wwsCommitCut = function(area) {
        const d = this._wwsDuel, b = this._subject, kind = d.kind;
        d.area = area;
        if (kind === "Heavy Cut") rules.recover(b, 8);
        const target = d.battlers.find(other => other !== b);
        d.target = target;
        d.defense = rules.defenseOutcome(target, b, kind === "Heavy Cut", area, Math.random());
        this.wwsAttack();
    };
    BattleManager.wwsAttack = function() {
        const d = this._wwsDuel;
        const action = new Game_Action(this._subject);
        action.setSkill(236);
        action.setTarget(0);
        this._subject._actions = [action];
        d.mode = "animation";
        d.notice = `${this._subject.name()}: ${d.kind} → ${d.area}.`;
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
        if (d.mode === "bossDialogue") {
            if ($gameMessage.isBusy()) return;
            const { battler, mode, remaining } = d.bossTransition;
            if (battler.isAlive() && battler._wws) {
                battler._wws.twoSwordPending = false;
                battler._wws.twoSword = true;
                battler._wws.stance = "TwoSword";
                this._logWindow.addText(`${battler.name()} draws his short sword. Two-Sword Guard!`);
                globalThis.WwsDuelFeedback?.emit({ type: "stance", target: battler, text: "TWO-SWORD GUARD", duration: 120 });
            }
            d.bossTransition = null;
            d.mode = mode;
            d.remaining = Math.max(remaining || 0, 0.8);
            return;
        }
        const boss = d.battlers.find(b => b._wws?.twoSwordPending && b.isAlive());
        if (boss && !$gameMessage.isBusy()) {
            d.bossTransition = { battler: boss, mode: d.mode, remaining: d.remaining };
            d.mode = "bossDialogue";
            $gameMessage.setFaceImage("", 0);
            $gameMessage.setBackground(0);
            $gameMessage.setPositionType(2);
            $gameMessage.setSpeakerName(boss.name());
            $gameMessage.add("You've held your ground. Good.");
            $gameMessage.add("Now let me show you my two-sword style.");
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
            const damage = rules.damage(subject, target, d.kind === "Heavy Cut", d.area);
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
        globalThis.WwsDuelFeedback?.impact({ subject, target, area: d.area, heavy: d.kind === "Heavy Cut", defense: d.defense, damage: Math.max(0, beforeHp - target.hp) });
        if (injuryChange) globalThis.WwsDuelFeedback?.injury(target, injuryChange.area, injuryChange.severity);
        this._logWindow.displayActionResults(subject, target);
    };
    const endAction = BattleManager.endAction;
    BattleManager.endAction = function() {
        if (!this._wwsDuel) return endAction.call(this);
        this._wwsDuel.target._wws.reaction = null;
        this._logWindow.endAction(this._subject);
        this._subject.setActionState("done");
        this._subject = null;
        this._phase = "wws";
        this._wwsDuel.mode = "advance";
        this._wwsDuel.remaining = 0.5;
    };
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
        maxCols() { return this._mode === "target" ? 4 : this._mode === "action" ? actions.length + 1 : stances.length; }
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
            if (!this.contents || !["stance", "action", "target"].includes(this._mode)) return;
            const opening = BattleManager._wwsDuel?.opening;
            ui.textAt(this, this._mode === "stance" ? (opening ? "CHOOSE OPENING FORM · FREE" : "CHANGE FORM · USES YOUR TURN") : this._mode === "target" ? "CHOOSE YOUR TARGET" : "YOUR TURN", 16, 2, 340, 12, ui.muted);
            const cancel = opening ? (BattleManager._wwsDuel.sparring && BattleManager.canEscape() ? "     Esc  Leave" : "") : "     Esc  " + (["target", "stance"].includes(this._mode) ? "Back" : "Leave");
            ui.textAt(this, "← →  Select     Enter  Confirm" + cancel, this.innerWidth - 440, 2, 424, 12, ui.muted, "right");
        }
        makeCommandList() {
            const names = this._mode === "stance" ? stances : this._mode === "action" ? [...actions, "Change Stance"] : this._mode === "target" ? areas : [];
            for (const name of names) this.addCommand(name, "choose", this._mode !== "stance" || BattleManager._wwsDuel?.opening || name !== BattleManager._wwsDuel?.battlers[0]._wws.stance, name);
        }
        drawItem(index) {
            const rect = this.itemRect(index), name = this.commandName(index);
            const selected = this.index() === index;
            this.contents.fillRect(rect.x, rect.y, rect.width, rect.height, selected ? "rgba(113,65,50,0.65)" : ui.ink);
            this.contents.fillRect(rect.x, rect.y + rect.height - 2, rect.width, 2, selected ? ui.accent : ui.line);
            ui.textAt(this, name, rect.x + 16, rect.y + 2, rect.width - 32, 23, ui.text, "left", true);
            const descriptions = { "Quick Cut": "Light cut · No recovery", "Heavy Cut": "Double damage · Recovery −8", "Change Stance": "Choose a new form · Uses this turn",
                Head: "More damage · Weaken defense", Torso: "Steady damage · Slow recovery",
                Arms: "Weaken their cuts", Legs: "Reduce their speed" };
            const summary = forms[name]?.text[0] || descriptions[name] || "";
            ui.textAt(this, summary, rect.x + 16, rect.y + 28, rect.width - 32, 13, ui.muted);
            if (forms[name]) ui.textAt(this, name === BattleManager._wwsDuel?.battlers[0]._wws.stance ? "Current form" : forms[name].text[1], rect.x + 16, rect.y + 48, rect.width - 32, 12, ui.muted);
            if (this._mode === "target") {
                const d = BattleManager._wwsDuel;
                const chances = rules.defenseChances(d.battlers[1], d.battlers[0], d.kind === "Heavy Cut", name);
                const damage = rules.damage(d.battlers[0], d.battlers[1], d.kind === "Heavy Cut", name);
                ui.textAt(this, `${damage} damage · ${Math.round((1 - chances.Parry - chances.Dodge) * 100)}% hit`, rect.x + 16, rect.y + 48, rect.width - 32, 14, ui.text);
            }
        }
        setMode(mode) {
            if (this._mode === mode) return;
            this._mode = mode;
            this.refresh();
            const current = BattleManager._wwsDuel?.battlers[0]._wws?.stance;
            this.select(mode === "stance" ? Math.max(0, stances.indexOf(current)) : 0);
            if (["stance", "action", "target"].includes(mode)) { this.show(); this.activate(); }
            else { this.hide(); this.deactivate(); }
        }
        update() {
            super.update();
            const d = BattleManager._wwsDuel;
            if (this._mode === "stance" && this.active && d?.mode === "stance" && stances.includes(this.currentExt())) {
                d.previewStance = this.currentExt();
            }
        }
    }
    class Window_DuelHud extends Window_Base {
        initialize(rect) { super.initialize(rect); this.opacity = 0; }
        lineHeight() { return 24; }
        refresh() {
            const d = BattleManager._wwsDuel;
            if (!d || d.mode === "finished") return;
            const health = d.battlers.map(b => globalThis.WwsDuelFeedback?.health(b) || { value: b.hp, trail: b.hp });
            const key = JSON.stringify([d.mode, d.round, d.previewStance, d.activeBattler?.name(), d.order.map(b => b.name()), d.battlers.map((b, i) =>
                [b.hp, b.mhp, Math.round(health[i].value), Math.round(health[i].trail), b._wws.stance, b._wws.recovery, b._wws.bleeding, b._wws.injuries])]);
            if (this._drawn === key) return;
            this._drawn = key;
            this.contents.clear();
            const w = Math.min(360, this.innerWidth * 0.32);
            d.battlers.forEach((b, i) => {
                const x = i === 0 ? 0 : this.innerWidth - w;
                                ui.panel(this, x, 0, w, 100);
                if (d.activeBattler === b) this.contents.fillRect(x, 0, w, 2, ui.accent);
                ui.textAt(this, b.name(), x + 16, 8, w * 0.55, 24, ui.text, "left", true);
                const stance = i === 0 && d.mode === "stance" ? `${d.previewStance || b._wws.stance} · preview` : b._wws.stance || (i === 0 ? "Choose a form" : "Unrevealed");
                ui.textAt(this, stance === "TwoSword" ? "Two-Sword Guard" : stance, x + w * 0.48, 10, w * 0.52 - 16, 13, ui.muted, "right");
                this.contents.fillRect(x + 16, 42, w - 32, 4, "#42483f");
                this.contents.fillRect(x + 16, 42, Math.round((w - 32) * health[i].trail / b.mhp), 4, "#dbc49c");
                this.contents.fillRect(x + 16, 42, Math.round((w - 32) * health[i].value / b.mhp), 4, i === 0 ? "#9eaf91" : ui.accent);
                ui.textAt(this, `${b.hp} / ${b.mhp}`, x + 16, 48, w - 32, 13, ui.muted);
                const tags = Object.entries(b._wws.injuries).map(([area, injury]) => `${area}: ${severityNames[injury.severity].toLowerCase()} ${injury.rounds}r`);
                if (b._wws.recovery) tags.push(`Recovery −${b._wws.recovery}`);
                if (b._wws.bleeding) tags.push(`Bleeding ${b._wws.bleeding}`);
                if (tags.length) ui.textAt(this, tags.join(" · "), x + 16, 72, w - 32, 12, "#d6ad8b");
            });
            const centerX = w + 20, centerW = this.innerWidth - 2 * w - 40;
            ui.panel(this, centerX + (centerW - 220) / 2, 0, 220, 78);
            ui.textAt(this, d.sparring ? "PRACTICE DUEL" : "DUEL", centerX, 0, centerW, 11, ui.muted, "center");
            ui.textAt(this, d.opening ? "Opening form" : `Round ${String(d.round).padStart(2, "0")}`, centerX, 22, centerW, 25, ui.text, "center", true);
            const turn = d.mode === "stance" ? "Choose your form" : d.activeBattler ? (d.activeBattler.isActor() ? "Your turn" : `${d.activeBattler.name()}'s turn`) : d.order[0] === d.battlers[0] ? "You act first" : `${d.battlers[1].name()} acts first`;
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
                if (rules.enemySpriteSet(b) === "Shinsengumi") ImageManager.loadEnemy(rules.enemyImage(b, "TwoSword"));
            }
        }
        if (BattleManager._wwsDuel.battlers[0].actorId() === 1 && !$gameSystem.isSideView()) {
            for (const pose of poses) ImageManager.loadBitmap("img/battlers/", playerImage(pose));
        }
        this._duelHud = new Window_DuelHud(new Rectangle(20, 16, Graphics.boxWidth - 40, 126));
        this._duelCards = new Window_DuelCards(ui.bottomRect());
        this._duelCards.setHandler("choose", () => {
            const choice = this._duelCards.currentExt(), mode = BattleManager._wwsDuel.mode;
            if (mode === "stance") BattleManager.wwsChooseStance(choice);
            else if (mode === "action") BattleManager.wwsChooseAction(choice);
            else if (mode === "target") BattleManager.wwsChooseTarget(choice);
        });
        this._duelCards.setHandler("cancel", () => {
            const d = BattleManager._wwsDuel;
            if (d.mode === "target") BattleManager.wwsCancelTarget();
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
        this._duelHud.visible = !$gameMessage.isBusy() && d.mode !== "finished";
    };
    // Register a real battler sprite so slash animations and damage popups find
    // actor 1. Form previews change only the image, never combat state.
    class Sprite_DuelPlayer extends Sprite_Battler {
        initialize(battler) {
            super.initialize(battler);
            this.updateBitmap();
            this._damageFlash = 0;
            this.setHome(Graphics.width * 0.26, Graphics.height - 154);
        }
        updateBitmap() {
            const pose = rules.playerPose(this._battler);
            if (pose !== this._pose) {
                this._pose = pose;
                this.bitmap = ImageManager.loadBitmap("img/battlers/", playerImage(pose));
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
        if (d && !$gameSystem.isSideView() && d.battlers[0].actorId() === 1) {
            const sprite = new Sprite_DuelPlayer(d.battlers[0]);
            this._actorSprites.push(sprite);
            this._battleField.addChild(sprite);
        }
    };
    const createEnemies = Spriteset_Battle.prototype.createEnemies;
    Spriteset_Battle.prototype.createEnemies = function() {
        createEnemies.call(this);
        if (BattleManager._wwsDuel) {
            const playerVisible = !$gameSystem.isSideView() && BattleManager._wwsDuel.battlers[0].actorId() === 1;
            // Reserve the lower-left foreground for the player and keep both
            // fighters between the HUD and action cards.
            for (const sprite of this._enemySprites) sprite.setHome(
                Graphics.width * (playerVisible ? 0.68 : 0.5), Graphics.height - (playerVisible ? 220 : 180));
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
        }
    };
})();
