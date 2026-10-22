/*:
 * @target MZ
 * @plugindesc v1.2 Turn-based samurai duels: aimed cuts, wounds and safe sparring.
 * @author WWS
 * @help
 * Enabled for troop 6 (Masanori), or troops with [WWS Duel] in their name.
 * Only runs with one actor and one enemy; other battles retain stock combat.
 * Troop 6 is always sparring. Other tagged troops are sparring unless their
 * name also contains [Bleeding]. Bleeding duels are controlled tests only.
 * One untimed action per turn: Quick Cut, Heavy Cut, Guard, Parry or Dodge.
 * Cuts then select Head, Torso, Arms or Legs; selecting a target is part of
 * that same action. Cancel on targets returns to actions without spending it.
 * Temporary injuries affect both fighters. Sparring has no bleeding.
 * Weapons/enemies may use <CuttingLevel: 1> through 5; default is 1.
 * Heavy Cut raises effective cutting level by one, capped at 5.
 * Arrows and Enter, or click cards. Defenses last until your next turn.
 * Cancel during stance/action selection leaves a sparring match safely.
 * No engine files or database skills need modification.
 */
(() => {
    "use strict";
    const stances = ["Balanced", "Aggressive", "Defensive"];
    const actions = ["Quick Cut", "Heavy Cut", "Guard", "Parry", "Dodge"];
    const areas = ["Head", "Torso", "Arms", "Legs"];
    const locations = {
        Head: { power: 1.20, defense: 0.15 }, Torso: { power: 1, defense: 0 },
        Arms: { power: 0.85, defense: 0.05 }, Legs: { power: 0.85, defense: 0.05 }
    };
    const severityNames = ["", "Light", "Medium", "Heavy"];
    const injuryLevel = (b, area) => b._wws.injuries?.[area]?.severity || 0;
    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
    const stanceSpeed = s => s === "Aggressive" ? 3 : s === "Defensive" ? -3 : 0;
    const stancePower = s => s === "Aggressive" ? 1.15 : s === "Defensive" ? 0.85 : 1;
    // Pure rules are exposed for repeatable tests and tuning without a renderer.
    const rules = globalThis.WwsDuelRules = {
        initiative(b) { return b.agi + stanceSpeed(b._wws.stance) - b._wws.recovery - 2 * injuryLevel(b, "Legs"); },
        defense(b, attacker, heavy, area = "Torso") {
            return clamp(0.20 + (b.def - attacker.atk) * 0.002 +
                (b._wws.stance === "Defensive" ? 0.10 : b._wws.stance === "Aggressive" ? -0.10 : 0) +
                (heavy ? 0.15 : 0) + locations[area].defense - 0.05 * injuryLevel(b, "Head") +
                (b._wws.defense === "Parry" ? 0.30 : b._wws.defense === "Dodge" ? 0.50 : 0),
                0.05, b._wws.defense ? 0.90 : 0.60);
        },
        damage(a, b, heavy, area = "Torso") {
            return Math.max(1, Math.round(Math.max(1, 4 * a.atk - 2 * b.def) *
                stancePower(a._wws.stance) * (heavy ? 1.35 : 1) * locations[area].power *
                (1 - 0.10 * injuryLevel(a, "Arms")) * (b._wws.guard ? 0.5 : 1)));
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
    const setup = BattleManager.setup;
    BattleManager.setup = function(troopId, canEscape, canLose) {
        setup.call(this, troopId, canEscape, canLose);
        const troop = $gameTroop.troop();
        this._wwsDuel = null;
        if ((troopId === 6 || troop.name.includes("[WWS Duel]")) &&
            $gameParty.battleMembers().length === 1 && $gameTroop.members().length === 1 && !this.isTpb()) {
            const battlers = [$gameParty.battleMembers()[0], $gameTroop.members()[0]];
            for (const b of battlers) b._wws = { stance: "Balanced", guard: false, defense: null, recovery: 0, bleeding: 0, injuries: {} };
            this._wwsDuel = { battlers, round: 0, sparring: troopId === 6 || !troop.name.includes("[Bleeding]"),
                mode: "", order: [], pending: [], notice: "Choose a stance; both choices reveal together." };
        }
    };
    const startInput = BattleManager.startInput;
    BattleManager.startInput = function() {
        const d = this._wwsDuel;
        if (!d) return startInput.call(this);
        d.round++;
        d.enemyStance = stances[Math.floor(Math.random() * 3)];
        d.mode = "stance";
        d.notice = "Choose your stance. Opponent has committed.";
        this._phase = "wws";
        this._inputting = false;
    };
    BattleManager.wwsChooseStance = function(stance) {
        const d = this._wwsDuel;
        if (d.mode !== "stance") return;
        d.battlers[0]._wws.stance = stance;
        d.battlers[1]._wws.stance = d.enemyStance;
        const scores = d.battlers.map(b => rules.initiative(b));
        const first = scores[0] === scores[1] ? (d.round - 1) % 2 : scores[0] > scores[1] ? 0 : 1;
        d.order = [d.battlers[first], d.battlers[1 - first]];
        d.pending = d.order.slice();
        for (const b of d.battlers) b._wws.recovery = 0;
        $gameTroop.increaseTurn();
        d.mode = "reveal";
        d.remaining = 1.2;
        d.notice = `${stance} / ${d.enemyStance}. ${d.order[0].name()} acts first.`;
    };
    BattleManager.wwsNext = function() {
        const d = this._wwsDuel;
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
        b._wws.guard = false;
        b._wws.defense = null;
        this._subject = b;
        if (b.isActor()) {
            d.mode = "action";
            d.notice = "Choose one action. Take your time." + (d.sparring ? " Cancel leaves sparring." : "");
        } else {
            const weights = b._wws.stance === "Aggressive" ? [0.50, 0.35, 0.05, 0.05, 0.05] :
                b._wws.stance === "Defensive" ? [0.20, 0.10, 0.25, 0.25, 0.20] : [0.40, 0.20, 0.15, 0.15, 0.10];
            let roll = Math.random(), index = 0;
            while (index < weights.length - 1 && roll >= weights[index]) roll -= weights[index++];
            this.wwsChooseAction(actions[index]);
        }
    };
    BattleManager.wwsChooseAction = function(kind, area = null) {
        const d = this._wwsDuel, b = this._subject;
        if (!b || !actions.includes(kind) || !["action", "advance", "reveal"].includes(d.mode)) return;
        if (area !== null && !areas.includes(area)) return;
        d.kind = kind;
        if (["Guard", "Parry", "Dodge"].includes(kind)) {
            b._wws.guard = kind === "Guard";
            b._wws.defense = kind === "Guard" ? null : kind;
            d.notice = kind === "Guard" ? `${b.name()} guards until their next turn.` :
                `${b.name()} prepares to ${kind.toLowerCase()} until their next turn.`;
            this._logWindow.addText(d.notice);
            d.mode = "advance";
            d.remaining = 0.7;
            return;
        }
        if (b.isActor() && area === null) {
            d.mode = "target";
            d.notice = `${kind}: choose a body area. Cancel returns to actions.`;
            return;
        }
        if (area === null) {
            // Both fighters have identical target rules; the NPC favors its stance.
            const favored = b._wws.stance === "Aggressive" ? "Head" : b._wws.stance === "Defensive" ? "Arms" : "Torso";
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
        d.notice = "Choose one action. Take your time.";
    };
    BattleManager.wwsCommitCut = function(area) {
        const d = this._wwsDuel, b = this._subject, kind = d.kind;
        d.area = area;
        if (kind === "Heavy Cut") rules.recover(b, 8);
        const target = d.battlers.find(other => other !== b);
        d.target = target;
        d.defended = Math.random() < rules.defense(target, b, kind === "Heavy Cut", area);
        if (d.defended && target._wws.defense === "Dodge") rules.recover(target, 3);
        this.wwsAttack();
    };
    BattleManager.wwsAttack = function() {
        const d = this._wwsDuel;
        const action = new Game_Action(this._subject);
        action.setSkill(236);
        action.setTarget(0);
        this._subject._actions = [action];
        d.mode = "animation";
        d.notice = `${this._subject.name()}: ${d.kind} → ${d.area}. ` +
            (d.defended ? "Defense succeeded." : "The cut lands.");
        this._logWindow.addText(d.notice);
        this.startAction();
        this._subject.removeCurrentAction();
    };
    const phase = BattleManager.updatePhase;
    BattleManager.updatePhase = function(timeActive) {
        if (!this._wwsDuel || this._phase !== "wws") return phase.call(this, timeActive);
        const d = this._wwsDuel;
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
        result.evaded = d.defended;
        if (!d.defended) {
            const damage = rules.damage(subject, target, d.kind === "Heavy Cut", d.area);
            this._action.executeDamage(target, damage);
            if (!target._wws.guard && target.isAlive()) {
                const severity = rules.woundSeverity(rules.cuttingLevel(subject, d.kind === "Heavy Cut"), Math.random());
                rules.wound(target, d.area, severity, d.sparring);
                this._logWindow.addText(`${target.name()}: ${severityNames[severity]} ${d.area.toLowerCase()} ${d.sparring ? "practice impact" : "wound"}.`);
            }
        }
        this._logWindow.displayActionResults(subject, target);
    };
    const endAction = BattleManager.endAction;
    BattleManager.endAction = function() {
        if (!this._wwsDuel) return endAction.call(this);
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

    class Window_DuelCards extends Window_Command {
        initialize(rect) { this._mode = ""; super.initialize(rect); this.hide(); this.deactivate(); }
        maxCols() { return this._mode === "action" ? 5 : this._mode === "target" ? 4 : 3; }
        itemHeight() { return 100; }
        makeCommandList() {
            const names = this._mode === "stance" ? stances : this._mode === "action" ? actions : this._mode === "target" ? areas : [];
            for (const name of names) this.addCommand(name, "choose", true, name);
        }
        drawItem(index) {
            const rect = this.itemRect(index), name = this.commandName(index);
            this.contents.fontSize = 24;
            this.drawText(name, rect.x, rect.y + 4, rect.width, "center");
            const descriptions = {
                Balanced: ["Normal speed", "Normal damage / defense"],
                Aggressive: ["Speed +3 / damage +15%", "Harder to defend"],
                Defensive: ["Speed -3 / damage -15%", "Easier to defend"],
                "Quick Cut": ["Choose body area", "No recovery"],
                "Heavy Cut": ["+35% / deeper cuts", "Next initiative -8"],
                Head: ["+20% / evade +15 pts", "Injury: defense down"],
                Torso: ["Normal damage / evade", "Injury: recovery cost"],
                Arms: ["-15% / evade +5 pts", "Injury: damage down"],
                Legs: ["-15% / evade +5 pts", "Injury: speed down"],
                Guard: ["Half incoming damage", "Until next turn"],
                Parry: ["Avoid +30 points", "No recovery"],
                Dodge: ["Avoid +50 points", "Success: speed -3"]
            };
            this.contents.fontSize = this._mode === "action" ? 14 : 16;
            (descriptions[name] || []).forEach((line, n) =>
                this.drawText(line, rect.x + 5, rect.y + 38 + n * 24, rect.width - 10, "center"));
            this.resetFontSettings();
        }
        setMode(mode) {
            if (this._mode === mode) return;
            this._mode = mode;
            this.refresh();
            this.select(0);
            if (["stance", "action", "target"].includes(mode)) { this.show(); this.activate(); }
            else { this.hide(); this.deactivate(); }
        }
    }
    class Window_DuelHud extends Window_Base {
        refresh() {
            this.contents.clear();
            const d = BattleManager._wwsDuel;
            if (!d || d.mode === "finished") return;
            this.contents.fontSize = 19;
            d.battlers.forEach((b, i) => {
                const x = i * this.innerWidth / 2, w = this.innerWidth / 2;
                const hidden = d.mode === "stance" && i === 1;
                this.drawText(`${b.name()}   Health ${b.hp}/${b.mhp}`, x, 0, w);
                this.drawText(hidden ? "Stance: choosing" : `Stance: ${b._wws.stance}`, x, 25, w);
                const tags = [b._wws.guard ? "Guard: half damage" : "", b._wws.defense ? `${b._wws.defense}: ready until next turn` : "", b._wws.bleeding ? `Bleeding: ${b._wws.bleeding} ticks` : "",
                    b._wws.recovery ? `Next initiative -${b._wws.recovery}` : ""].filter(Boolean).join(" / ");
                this.contents.fontSize = 15;
                this.drawText(tags, x, 50, w);
                const injuries = Object.entries(b._wws.injuries).map(([area, injury]) => `${area} ${injury.severity}/${injury.rounds}r`).join(" / ");
                this.drawText(injuries ? `Injuries: ${injuries}` : "Injuries: none", x, 72, w);
                this.contents.fontSize = 19;
            });
            const order = d.mode === "stance" ? "Choose stance (untimed)" : d.order.map(b => b.name()).join(" → ");
            this.drawText(`Round ${d.round} | ${order}`, 0, 96, this.innerWidth);
            this.contents.fontSize = 16;
            this.drawText(d.notice, 0, 122, this.innerWidth);

        }
    }
    const createWindows = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function() {
        createWindows.call(this);
        if (!BattleManager._wwsDuel) return;
        this._duelHud = new Window_DuelHud(new Rectangle(0, 0, Graphics.boxWidth, 192));
        this._duelCards = new Window_DuelCards(new Rectangle(0, Graphics.boxHeight - 140, Graphics.boxWidth, 140));
        this._duelCards.setHandler("choose", () => {
            const choice = this._duelCards.currentExt(), mode = BattleManager._wwsDuel.mode;
            if (mode === "stance") BattleManager.wwsChooseStance(choice);
            else if (mode === "action") BattleManager.wwsChooseAction(choice);
            else if (mode === "target") BattleManager.wwsChooseTarget(choice);
        });
        this._duelCards.setHandler("cancel", () => {
            const d = BattleManager._wwsDuel;
            if (d.mode === "target") BattleManager.wwsCancelTarget();
            else if (d.sparring && BattleManager.canEscape() && ["stance", "action"].includes(d.mode)) {
                BattleManager.processPartyEscape();
            } else this._duelCards.activate();
        });
        this._logWindow.y = 192;
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
    const createEnemies = Spriteset_Battle.prototype.createEnemies;
    Spriteset_Battle.prototype.createEnemies = function() {
        createEnemies.call(this);
        if (BattleManager._wwsDuel) {
            // Reserve space above the front-view opponent for the duel HUD.
            for (const sprite of this._enemySprites) sprite.setHome(sprite._homeX, sprite._homeY + 90);
        }
    };
})();
