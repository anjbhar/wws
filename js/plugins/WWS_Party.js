/*:
 * @target MZ
 * @plugindesc v1.0 Party screen with saved positions, reserves and fighter details.
 * @author WWS
 * @base WWS_Duel
 * @base WWS_UI
 * @orderAfter WWS_Duel
 * @orderAfter WWS_UI
 * @help
 * Replaces the menu's Formation entry with Party, available with one actor.
 * Select a fighter, then another active fighter or reserve to swap them.
 * Left/Right browse positions; Down/Up or Tab switch between positions/reserves.
 * Mouse/touch selection and scrolling are supported. Escape cancels a pending
 * swap, then returns to the menu. No recruitment or starting-party changes.
 * Uses WWS_Duel's saved Center/Left/Right formation and three-active limit.
 */
(() => {
    "use strict";
    const { colors, text, wrapped, panel, artwork } = WwsUI;
    const positions = ["Center", "Left", "Right"];
    const visualSlots = [1, 0, 2];
    const reserves = () => $gameParty.allMembers().filter(actor => !$gameParty.wwsFormation().includes(actor));
    const position = actor => positions[$gameParty.wwsFormation().indexOf(actor)] || "Reserve";

    // All writes go through the established formation API; merely browsing is inert.
    globalThis.WwsParty = {
        reserves, position,
        swap(firstId, secondId) {
            if (!$gameSystem.isFormationEnabled() || firstId === secondId) return false;
            const members = $gameParty.allMembers();
            const first = members.find(actor => actor.actorId() === firstId), second = members.find(actor => actor.actorId() === secondId);
            if (!first || !second || !first.isFormationChangeOk() || !second.isFormationChangeOk()) return false;
            const active = $gameParty.wwsFormation();
            if (!active.includes(first) && !active.includes(second)) return false;
            $gameParty.swapOrder(members.indexOf(first), members.indexOf(second));
            return true;
        }
    };

    class Window_PartyPanel extends Window_Base {
        initialize(rect) { super.initialize(rect); this.opacity = 0; }
        updatePadding() { this.padding = 8; }
        lineHeight() { return 24; }
    }
    class Window_PartyList extends Window_Selectable {
        initialize(rect) { super.initialize(rect); this.opacity = 0; this._canRepeat = false; }
        lineHeight() { return 24; }
        maxCols() { return 3; }
        drawItemBackground() {}
        refreshCursor() { this.setCursorRect(0, 0, 0, 0); }
        select(index) {
            const previous = this.index();
            super.select(index);
            if (this.contents) this.refresh();
            if (index !== previous && this.active) this._onPreview?.(this.actor(index));
        }
        actor() { return null; }
        isCurrentItemEnabled() { return !!this.actor(this.index()); }
        isTouchOkEnabled() { return this.isOpenAndActive() && this.isOkEnabled(); }
        processTouch() {
            if (!this.active && TouchInput.isTriggered() && this.hitIndex() >= 0) this._onFocus?.(this);
            super.processTouch();
        }
        setSource(actorId) { this._sourceId = actorId; this.refresh(); }
        destroy(options) { this._partyDisposed = true; super.destroy(options); }
    }
    class Window_PartySlots extends Window_PartyList {
        maxItems() { return 3; }
        itemHeight() { return this.innerHeight; }
        itemRect(index) {
            const width = Math.floor(this.innerWidth / 3);
            return new Rectangle(index * width + 5, index === 1 ? 0 : 18, width - 10, this.innerHeight - 20);
        }
        actor(index = this.index()) { return $gameParty.wwsFormation()[visualSlots[index]] || null; }
        cursorDown() { this._onReserve?.(); }
        cursorUp() {}
        drawItem(index) {
            const r = this.itemRect(index), actor = this.actor(index);
            panel(this, r, this.active && this.index() === index, actor && actor.actorId() === this._sourceId);
            text(this, positions[visualSlots[index]].toUpperCase(), r.x + 12, r.y + 8, r.width - 24, 12, colors.gold, "center");
            if (!actor) {
                text(this, "+", r.x, r.y + 85, r.width, 42, colors.line, "center", true);
                text(this, "Open position", r.x + 12, r.y + 177, r.width - 24, 20, colors.muted, "center", true);
                text(this, "Awaiting a companion", r.x + 12, r.y + 212, r.width - 24, 12, colors.muted, "center");
                return;
            }
            artwork(this, actor, r.x + 10, r.y + 178, r.width - 20, 152);
            wrapped(this, actor.name(), r.x + 12, r.y + 177, r.width - 24, 20, 2, colors.text, "center", true);
            text(this, `Level ${actor.level}  ·  ${actor.hp} / ${actor.mhp} Health`, r.x + 12, r.y + 232, r.width - 24, 12, colors.muted, "center");
            const bar = r.width - 40;
            this.contents.fillRect(r.x + 20, r.y + 263, bar, 4, colors.line);
            this.contents.fillRect(r.x + 20, r.y + 263, bar * actor.hpRate(), 4, colors.health);
        }
    }
    class Window_PartyReserves extends Window_PartyList {
        maxItems() { return reserves().length; }
        itemHeight() { return 60; }
        actor(index = this.index()) { return reserves()[index] || null; }
        cursorUp(wrap) {
            if (this.index() < this.maxCols()) this._onActive?.();
            else super.cursorUp(wrap);
        }
        drawAllItems() {
            super.drawAllItems();
            if (!this.maxItems()) {
                text(this, "No companions in reserve", 16, 14, this.innerWidth - 32, 20, colors.muted, "left", true);
                text(this, "Your companions will appear here when the active formation is full.", 16, 47, this.innerWidth - 32, 14, colors.muted);
            }
        }
        drawItem(index) {
            const r = this.itemRect(index), actor = this.actor(index);
            if (!actor) return;
            panel(this, r, this.active && this.index() === index, actor.actorId() === this._sourceId);
            artwork(this, actor, r.x + 4, r.y + r.height - 3, 46, r.height - 6);
            wrapped(this, actor.name(), r.x + 56, r.y + 2, r.width - 66, 15, 2);
            text(this, `Lv ${actor.level}  ·  ${actor.hp}/${actor.mhp}`, r.x + 56, r.y + 36, r.width - 66, 11, colors.muted);
        }
    }
    class Window_PartyDetails extends Window_PartyPanel {
        setActor(actor) { if (this._actor !== actor) { this._actor = actor; this.refresh(); } }
        refresh() {
            this.contents.clear();
            panel(this, new Rectangle(0, 0, this.innerWidth, this.innerHeight));
            const actor = this._actor, x = 20, width = this.innerWidth - 40;
            text(this, "FIGHTER DETAILS", x, 12, width, 11, colors.gold);
            if (!actor) {
                text(this, "An open position", x, 62, width, 28, colors.text, "left", true);
                wrapped(this, "Companions already in your company can fill the active formation. Your first fighter takes the center.", x, 116, width, 17, 4, colors.muted);
                return;
            }
            wrapped(this, actor.name(), x, 38, width, 29, 2, colors.text, "left", true);
            text(this, `${position(actor)}  ·  ${actor.currentClass().name}  ·  Level ${actor.level}`, x, 111, width, 14, colors.muted);
            text(this, "HEALTH", x, 145, width / 2, 11, colors.muted);
            text(this, `${actor.hp} / ${actor.mhp}`, x, 140, width, 18, colors.text, "right");
            this.contents.fillRect(x, 171, width, 4, colors.line);
            this.contents.fillRect(x, 171, width * actor.hpRate(), 4, colors.health);
            [["Attack", actor.atk], ["Defense", actor.def], ["Speed", actor.agi]].forEach(([label, value], i) => {
                const left = x + i * width / 3;
                text(this, value, left, 189, width / 3, 25, colors.text, "left", true);
                text(this, label, left, 219, width / 3, 12, colors.muted);
            });
            text(this, "EQUIPMENT", x, 252, width, 11, colors.gold);
            actor.equips().forEach((item, i) => {
                const label = $dataSystem.equipTypes[actor.equipSlots()[i]] || "Equipment";
                text(this, label, x, 272 + i * 23, width * .40, 13, colors.muted);
                text(this, item?.name || "—", x + width * .40, 272 + i * 23, width * .60, 14);
            });
            const seigan = WwsDuelRules.actorSpriteSet(actor) === "Shinsengumi";
            text(this, seigan ? "SPECIAL ABILITY" : "SWORD DISCIPLINE", x, 398, width, 11, colors.gold);
            text(this, seigan ? "Three Stage Thrust" : "Five sword forms", x, 420, width, 21, colors.text, "left", true);
            wrapped(this, seigan ? "In Seigan, a parried cut can trigger two torso follow-ups. A dodge ends the chain." : "Choose a free opening form. Later changes use a turn; parries and dodges happen automatically.", x, 450, width, 14, 3, colors.muted);
        }
    }
    class Scene_WwsParty extends Scene_MenuBase {
        createButtons() { const back = new WwsUI.Button("← Back", 108, () => { SoundManager.playCancel(); this.back(); }); back.move(Graphics.boxWidth - 132, 28); this.addWindow(back); }
        create() {
            super.create();
            Graphics._wwsPartyFit = true;
            Graphics._updateAllElements();
            this._sourceId = null;
            const width = Graphics.boxWidth, height = Graphics.boxHeight;
            this._leftWidth = Math.floor((width - 88) * .64);
            this._header = new Window_PartyPanel(new Rectangle(24, 18, width - 48, 114));
            this._slots = new Window_PartySlots(new Rectangle(24, 144, this._leftWidth, 336));
            this._reserves = new Window_PartyReserves(new Rectangle(24, 516, this._leftWidth, height - 576));
            this._details = new Window_PartyDetails(new Rectangle(this._leftWidth + 44, 144, width - this._leftWidth - 68, height - 204));
            this._footer = new Window_PartyPanel(new Rectangle(24, height - 48, width - 48, 44));
            for (const window of [this._header, this._slots, this._reserves, this._details, this._footer]) this.addWindow(window);
            this._slots._onReserve = () => this.focus(this._reserves);
            this._reserves._onActive = () => this.focus(this._slots);
            for (const window of [this._slots, this._reserves]) {
                window.setHandler("ok", () => this.choose(window));
                window.setHandler("cancel", () => this.back());
                window._onFocus = target => this.focus(target);
                window._onPreview = actor => this._details.setActor(actor);
            }
            this._slots.select(1);
            this._reserves.select(0);
            this.focus(this._slots);
            this.refreshScreen();
        }
        createBackground() {
            super.createBackground();
            this.setBackgroundOpacity(72);
            const shade = new Sprite(new Bitmap(Graphics.boxWidth, Graphics.boxHeight));
            shade.bitmap.gradientFillRect(0, 0, Graphics.boxWidth, Graphics.boxHeight, "rgba(12,18,17,0.85)", "rgba(36,34,26,0.94)", true);
            this.addChild(shade);
        }
        focus(window) {
            if (window === this._reserves && !window.maxItems()) return;
            this._slots.deactivate();this._reserves.deactivate();
            window.activate();
            this._focus = window;
            this._details.setActor(window.actor());
            this._slots.refresh();this._reserves.refresh();
        }
        refreshScreen() {
            const h = this._header, width = h.innerWidth;
            h.contents.clear();
            text(h, "Party", 0, 2, width, 42, colors.text, "left", true);
            text(h, "Arrange your companions for the road ahead.", 2, 57, width - 180, 15, colors.muted);
            text(h, `ACTIVE FORMATION  ·  ${$gameParty.wwsFormation().length} / 3`, 2, 78, width, 12, colors.gold);
            text(h, `${$gameParty.allMembers().length} in company`, width - 180, 57, 180, 14, colors.muted, "right");
            // Reserve heading remains stationary while the list scrolls.
            if (!this._reserveTitle) {
                this._reserveTitle = new Window_PartyPanel(new Rectangle(24, 482, this._leftWidth, 34));
                this.addWindow(this._reserveTitle);
            }
            this._reserveTitle.contents.clear();
            text(this._reserveTitle, `RESERVES  ·  ${reserves().length}`, 2, -2, this._leftWidth - 24, 12, colors.gold);
            for (const window of [this._slots, this._reserves]) window.setSource(this._sourceId);
            this._details._actor = undefined;this._details.setActor(this._focus.actor());
            this._footer.contents.clear();
            const source = $gameParty.allMembers().find(actor => actor.actorId() === this._sourceId);
            const hint = source ? position(source) === "Reserve" ? `Field ${source.name()}  ·  Choose an active fighter to swap.  Esc: cancel` : `Move ${source.name()}  ·  Choose an active fighter or reserve to swap.  Esc: cancel` : "← → Browse   ↑ ↓ / Tab: active & reserves   Enter / click: select a fighter   Esc: back";
            text(this._footer, !$gameSystem.isFormationEnabled() ? "Formation is locked here. Browse your companions; Esc returns to the menu." : hint, 2, -2, this._footer.innerWidth - 4, 14, source ? colors.gold : colors.muted);
        }
        choose(window) {
            const actor = window.actor();
            if (!actor || !$gameSystem.isFormationEnabled() || !actor.isFormationChangeOk()) { SoundManager.playBuzzer();this.focus(window);return; }
            if (!this._sourceId) this._sourceId = actor.actorId();
            else if (this._sourceId === actor.actorId()) this._sourceId = null;
            else if (WwsParty.swap(this._sourceId, actor.actorId())) this._sourceId = null;
            else SoundManager.playBuzzer();
            this.focus(window);this.refreshScreen();
        }
        back() {
            if (this._sourceId) { this._sourceId = null;this.focus(this._focus);this.refreshScreen(); }
            else if (!this._closing) { this._closing = true;this.popScene(); }
        }
        update() {
            super.update();
            if (Input.isTriggered("tab")) { this.focus(this._focus === this._slots ? this._reserves : this._slots);SoundManager.playCursor(); }
        }
        terminate() {
            super.terminate();
            Graphics._wwsPartyFit = false;
            Graphics._updateAllElements();
        }
    }
    globalThis.Scene_WwsParty = Scene_WwsParty;
    // Fit this menu inside smaller windows without changing the player's stretch setting.
    const updateRealScale = Graphics._updateRealScale;
    Graphics._updateRealScale = function() {
        updateRealScale.call(this);
        if (this._wwsPartyFit && this.width > 0 && this.height > 0) {
            this._realScale = Math.min(this._realScale, window.innerWidth / this.width, window.innerHeight / this.height);
        }
    };
    Window_MenuCommand.prototype.addFormationCommand = function() {
        if (this.needsCommand("formation")) this.addCommand("Party", "wwsParty", this.areMainCommandsEnabled());
    };
    const createCommands = Scene_Menu.prototype.createCommandWindow;
    Scene_Menu.prototype.createCommandWindow = function() {
        createCommands.call(this);
        this._commandWindow.setHandler("wwsParty", () => SceneManager.push(Scene_WwsParty));
    };
})();
