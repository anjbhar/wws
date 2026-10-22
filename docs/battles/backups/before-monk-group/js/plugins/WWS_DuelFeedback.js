/*:
 * @target MZ
 * @plugindesc v1.0 Localized impacts, defenses, damage, turn cues and animated duel Health.
 * @author WWS
 * @help
 * Load after WWS_Duel and WWS_DuelTargets. Presentation only: no combat rolls,
 * damage, initiative, action costs or Health-floor changes. Stock battles retain
 * their normal animations, sounds, logs and popups.
 */
(() => {
    'use strict';
    const injuryEffects = { Head: 'defense weakened', Torso: 'recovery slowed', Arms: 'weaker cuts', Legs: 'slower initiative' };
    const feedback = globalThis.WwsDuelFeedback = {
        events: [], bars: new Map(), scene: null, hitStop: 0, motionFrames: 0, turnHold: 0,
        reset() {
            this.events = []; this.bars.clear(); this.hitStop = 0; this.motionFrames = 0; this.turnHold = 0;
        },
        emit(event) {
            this.events.push({ age: 0, delay: 0, duration: 64, ...event });
            if (this.events.length > 32) this.events.shift();
        },
        turn(target) {
            this.turnHold = target.isActor() ? 22 : 0;
            this.emit({ type: 'turn', target, text: target.isActor() ? 'YOUR TURN' : `${target.name().toUpperCase()}'S TURN`, duration: 48 });
        },
        stance(target, stance) {
            this.emit({ type: 'stance', target, text: `${stance.toUpperCase()} · TURN USED`, duration: 64 });
        },
        protect(target) {
            this.emit({ type: 'protection', target, text: 'Practice protection · You cannot fall below 1 HP', delay: 28, duration: 150 });
        },
        injury(target, area, severity) {
            this.emit({ type: 'injury', target, area, severity, text: `${area} injured — ${injuryEffects[area]}`, delay: 20, duration: 82 });
        },
        impact(event) {
            this.emit({ type: 'impact', duration: 72, ...event });
            if (!this.scene) return;
            const rapid = event.lightlessStrike > 1 || (event.defense === 'Parry' &&
                globalThis.WwsDuelRules?.hasLightlessBlade(event.subject));
            this.hitStop = event.defense === 'Dodge' ? 0 : rapid ? 1 : event.heavy ? 6 : 3;
            this.motionFrames = rapid ? 4 : event.defense === 'Dodge' ? 26 : event.heavy ? 24 : 16;
            const sprite = this.sprite(event.target);
            if (sprite) {
                if (event.defense) sprite.updateBitmap?.();
                sprite._wwsFeedbackMotion = { kind: event.defense || 'Hit', heavy: event.heavy, age: 0, duration: this.motionFrames };
            }
            const name = event.defense === 'Parry' ? 'Parry' : event.defense === 'Dodge' ? 'Evasion1' : event.heavy ? 'Sword3' : 'Sword1';
            AudioManager.playSe({ name, volume: event.defense ? 68 : event.heavy ? 76 : 58, pitch: event.heavy ? 90 : 105, pan: event.target.isActor() ? -15 : 15 });
        },
        sprite(target) {
            const spriteset = this.scene?._spriteset;
            return spriteset?.findTargetSprite?.(target) || [...(spriteset?._actorSprites || []), ...(spriteset?._enemySprites || [])].find(sprite => sprite._battler === target);
        },
        health(target) {
            let bar = this.bars.get(target);
            if (!bar) { bar = { value: target.hp, trail: target.hp, target: target.hp, delay: 0 }; this.bars.set(target, bar); }
            return bar;
        },
        step() {
            if (this.hitStop > 0) this.hitStop--;
            else this.motionFrames = Math.max(0, this.motionFrames - 1);
            this.turnHold = Math.max(0, this.turnHold - 1);
            for (const event of this.events) event.age++;
            this.events = this.events.filter(event => event.age < event.delay + event.duration);
            for (const [target, bar] of this.bars) {
                if (bar.target !== target.hp) { bar.target = target.hp; bar.delay = 12; }
                bar.value += (bar.target - bar.value) * 0.22;
                if (Math.abs(bar.value - bar.target) < 0.25) bar.value = bar.target;
                if (bar.delay > 0) bar.delay--;
                else bar.trail += (bar.value - bar.trail) * 0.14;
                if (Math.abs(bar.trail - bar.value) < 0.25) bar.trail = bar.value;
            }
        }
    };
    const setup = BattleManager.setup;
    BattleManager.setup = function(...args) { setup.apply(this, args); feedback.reset(); feedback.scene = null; };
    const endBattle = BattleManager.endBattle;
    BattleManager.endBattle = function(result) { endBattle.call(this, result); feedback.reset(); feedback.scene = null; };
    const busy = BattleManager.isBusy;
    BattleManager.isBusy = function() {
        return !!(this._wwsDuel && feedback.scene && (feedback.hitStop > 0 || feedback.motionFrames > 0)) || busy.call(this);
    };

    // Stock addText, result and end-action waits otherwise separate each cut
    // by multiple 16-frame pauses, even when the follow-up has no wind-up.
    const messageSpeed = Window_BattleLog.prototype.messageSpeed;
    Window_BattleLog.prototype.messageSpeed = function() {
        const d = BattleManager._wwsDuel;
        const chainingParry = d?.defense === 'Parry' && d.target?._wws?.reaction === 'Parry' &&
            globalThis.WwsDuelRules?.hasLightlessBlade(BattleManager._subject);
        return d && (d.kind === 'Lightless Blade' || chainingParry) ? 2 : messageSpeed.call(this);
    };

    // Use one short wind-up; reveal defense, play the impact sound and draw the
    // slash at invokeAction, rather than announcing the result before the cut.
    const startAction = Window_BattleLog.prototype.startAction;
    Window_BattleLog.prototype.startAction = function(subject, action, targets) {
        if (!BattleManager._wwsDuel) return startAction.call(this, subject, action, targets);
        if (BattleManager._wwsDuel.kind === 'Lightless Blade') {
            // Follow-ups snap straight into the next cut without another wind-up.
            this.push('performAction', subject, action);
            return;
        }
        this.push('performActionStart', subject, action);
        this.push('waitForMovement');
        this.push('performAction', subject, action);
        this.push('wait');
    };
    const results = Window_BattleLog.prototype.displayActionResults;
    Window_BattleLog.prototype.displayActionResults = function(subject, target) {
        if (!BattleManager._wwsDuel) return results.call(this, subject, target);
        // Feedback draws a single number or defense label; no duplicate stock Miss.
        if (target.isDead()) this.push('performCollapse', target);
        this.push('wait');
    };
    const updateBattler = Sprite_Battler.prototype.update;
    Sprite_Battler.prototype.update = function() {
        const duel = BattleManager._wwsDuel;
        const custom = duel && feedback.scene && duel.battlers.includes(this._battler);
        if (custom && feedback.hitStop > 0) return;
        updateBattler.call(this);
        const motion = custom && this._wwsFeedbackMotion;
        if (!motion) return;
        const t = ++motion.age / motion.duration;
        if (t >= 1) { this._wwsFeedbackMotion = null; return; }
        const amount = motion.kind === 'Dodge' ? 34 : motion.kind === 'Parry' ? 4 : motion.heavy ? 12 : 6;
        this.x += Math.sin(Math.PI * t) * amount * (this._battler.isActor() ? -1 : 1);
        if (motion.kind === 'Dodge') this.y -= Math.sin(Math.PI * t) * 4;
    };

    class Window_DuelFeedback extends Window_Base {
        initialize(rect) { super.initialize(rect); this.opacity = 0; }
        lineHeight() { return 24; }
        point(target, area = 'Head') {
            const sprite = feedback.sprite(target);
            if (!sprite) return { x: target.isActor() ? Graphics.boxWidth * .26 : Graphics.boxWidth * .68, y: 330 };
            const pose = WwsDuelRules.pose(target);
            const regions = !target.isActor() && !$gameSystem.isSideView() && globalThis.WwsDuelTargets?.regions(target, pose)?.[area];
            let width = sprite.bitmap?.width || 288, height = sprite.bitmap?.height || 288;
            let x = width * .5, y = height * ({ Head: .32, Torso: .54, Arms: .50, Legs: .80 }[area] || .54);
            if (regions) { x = regions.reduce((sum, region) => sum + region[0], 0) / regions.length; y = regions.reduce((sum, region) => sum + region[1], 0) / regions.length; }
            const local = new Point(x - sprite.anchor.x * width, y - sprite.anchor.y * height);
            return sprite.toGlobal(local);
        }
        label(text, x, y, size, color, alpha = 1) {
            this.contents.paintOpacity = Math.round(alpha * 255);
            this.contents.fontFace = 'Arial'; this.contents.fontSize = size;
            this.contents.outlineColor = 'rgba(20,22,20,0.95)'; this.contents.outlineWidth = 3;
            this.contents.textColor = color;
            this.drawText(text, x - 220, y - 12, 440, 'center');
            this.contents.paintOpacity = 255;
        }
        update() {
            super.update();
            const d = BattleManager._wwsDuel;
            this.contents.clear();
            if (!d || d.mode === 'finished' || $gameMessage.isBusy()) return;
            feedback.step();
            for (const target of d.battlers) {
                feedback.health(target);
                const sprite = feedback.sprite(target), motion = sprite?._wwsFeedbackMotion;
                if (!sprite) continue;
                if (motion && motion.kind !== 'Dodge') {
                    const alpha = Math.round(90 * (1 - motion.age / motion.duration));
                    sprite.setBlendColor(motion.kind === 'Parry' ? [255,237,184,alpha] : [230,115,85,alpha]);
                    sprite._wwsFeedbackTint = true;
                } else if (sprite._wwsFeedbackTint) { sprite.setBlendColor([0,0,0,0]); sprite._wwsFeedbackTint = false; }
            }
            for (const event of feedback.events) {
                const age = event.age - event.delay;
                if (age < 0) continue;
                const alpha = Math.min(1, (event.duration - age) / 20);
                if (event.type === 'protection') {
                    this.label(event.text, Graphics.boxWidth / 2, Graphics.boxHeight - 184, 16, '#e9d4a7', alpha); continue;
                }
                const point = this.point(event.target, event.area);
                const x = Math.max(225, Math.min(Graphics.boxWidth - 225, point.x));
                const y = Math.max(165, Math.min(Graphics.boxHeight - 190, point.y));
                if (event.type === 'turn') { this.label(event.text, x, Math.max(158,y-58), 16, '#e9d4a7', Math.min(alpha, age / 5)); continue; }
                if (event.type === 'stance') { this.label(event.text, x, Math.max(158,y-36), 16, '#e9d4a7', alpha); continue; }
                if (event.type === 'injury') { this.label(event.text, x, y + 28 - age * .12, 15, '#e3b695', alpha); continue; }
                if (event.type !== 'impact') continue;
                if (event.defense) this.label(event.defense === 'Parry' ? 'Parried' : 'Dodged', x, y - 16 - age * .35, 22, event.defense === 'Parry' ? '#f5dfac' : '#cbd9d1', alpha);
                else this.label(String(event.damage), x, y - 12 - age * .45, event.heavy ? 40 : 30, event.heavy ? '#ffe0b1' : '#f5edda', alpha);
                const life = event.defense === 'Parry' ? 14 : event.heavy ? 10 : 7;
                if (age >= life || event.defense === 'Dodge') continue;
                const c = this.contents.context, t = age / life;
                c.save(); c.globalAlpha = (1-t)*.95; c.translate(point.x,point.y);
                if (event.defense === 'Parry') {
                    c.strokeStyle = '#ffe5a3'; c.lineWidth = 2;
                    for (let i=0;i<8;i++) { const angle=i*Math.PI/4, length=12+t*25; c.beginPath();c.moveTo(Math.cos(angle)*5,Math.sin(angle)*5);c.lineTo(Math.cos(angle)*length,Math.sin(angle)*length);c.stroke(); }
                } else {
                    // A brief blade glint: a curved, tapered silhouette rather
                    // than persistent straight lines painted across the body.
                    const length = event.heavy ? 54 : 36;
                    const width = event.heavy ? 4 : 2.5;
                    c.translate(0, 8);
                    c.rotate(event.target.isActor() ? -.65 : .65);
                    c.translate(length * (t - .5) * .18, 0);
                    const glint = c.createLinearGradient(-length / 2, 0, length / 2, 0);
                    glint.addColorStop(0, 'rgba(255,244,217,0)');
                    glint.addColorStop(.4, 'rgba(255,244,217,.85)');
                    glint.addColorStop(.65, 'rgba(255,253,242,1)');
                    glint.addColorStop(1, 'rgba(255,244,217,0)');
                    c.fillStyle = glint;
                    c.beginPath();
                    c.moveTo(-length / 2, 0);
                    c.quadraticCurveTo(0, -width * 2, length / 2, 0);
                    c.quadraticCurveTo(0, -width * .25, -length / 2, 0);
                    c.fill();
                }
                c.restore(); this.contents.baseTexture.update();
            }
        }
    }
    const create = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function() {
        create.call(this);
        if (!BattleManager._wwsDuel) return;
        feedback.scene = this;
        for (const target of BattleManager._wwsDuel.battlers) feedback.health(target);
        // Content origin lands at (0,0); the transparent layer never accepts input.
        this._duelFeedback = new Window_DuelFeedback(new Rectangle(-12,-12,Graphics.boxWidth+24,Graphics.boxHeight+24));
        // A full-screen WindowLayer entry would stencil out every HUD window.
        // Render this transparent, noninteractive overlay above the layer instead.
        this.addChild(this._duelFeedback);
    };
    const visibility = Scene_Battle.prototype.updateVisibility;
    Scene_Battle.prototype.updateVisibility = function() {
        visibility.call(this);
        if (!this._duelCards || !BattleManager._wwsDuel) return;
        this._logWindow.visible = false;
        if (BattleManager._wwsDuel.mode === 'action' && feedback.turnHold > 0) {
            this._duelCards.hide(); this._duelCards.deactivate(); this._feedbackTurnBlocked = true;
        } else if (this._feedbackTurnBlocked && BattleManager._wwsDuel.mode === 'action' && !$gameMessage.isBusy()) {
            this._duelCards.show(); this._duelCards.activate(); this._feedbackTurnBlocked = false;
        }
    };
    const logVisibility = Scene_Battle.prototype.updateLogWindowVisibility;
    Scene_Battle.prototype.updateLogWindowVisibility = function() {
        if (BattleManager._wwsDuel) this._logWindow.visible = false;
        else logVisibility.call(this);
    };
})();
