/*:
 * @target MZ
 * @plugindesc v1.0 Shared WWS menu palette, panels, artwork and controls.
 * @author WWS
 * @base WWS_Duel
 * @orderAfter WWS_Duel
 * @help Presentation only. Load before WWS_Party and WWS_Menus.
 */
(() => {
    "use strict";
    const colors = { ink: "#181d1c", text: "#f0e7d4", muted: "#b7b7a7", line: "#51574e", accent: "#b86c54", health: "#9eaf91", gold: "#dbc49c", selected: "#343a32" };
    const ui = globalThis.WwsUI = { colors, fonts: { label: "Arial", heading: "Georgia" }, gap: 16, margin: 24 };
    // Soft lacquered surfaces: slight depth and warm edge light, without hard rules.
    function rounded(ctx, x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + width, y, x + width, y + height, r);
        ctx.arcTo(x + width, y + height, x, y + height, r); ctx.arcTo(x, y + height, x, y, r);
        ctx.arcTo(x, y, x + width, y, r); ctx.closePath();
    }
    ui.surface = (bitmap, rect, selected = false, source = false, quiet = false) => {
        if (rect.width <= 8 || rect.height <= 8) return;
        const ctx = bitmap.context, x = rect.x + 2, y = rect.y + 2, width = rect.width - 4, height = rect.height - 4;
        ctx.save();
        rounded(ctx, x, y, width, height, quiet ? 7 : 12);
        if (!quiet) { ctx.shadowColor = "rgba(0,0,0,0.32)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3; }
        const fill = ctx.createLinearGradient(x, y, x, y + height);
        fill.addColorStop(0, selected ? "#41483a" : quiet ? "rgba(47,54,46,0.28)" : "#2b322c");
        fill.addColorStop(1, selected ? "#293329" : quiet ? "rgba(25,32,27,0.12)" : "#18211d");
        ctx.fillStyle = fill; ctx.fill(); ctx.shadowColor = "transparent";
        ctx.lineWidth = 1;
        ctx.strokeStyle = source ? "rgba(219,196,156,0.85)" : selected ? "rgba(219,196,156,0.48)" : quiet ? "rgba(219,196,156,0.035)" : "rgba(219,196,156,0.20)";
        ctx.stroke();
        if (!quiet) {
            rounded(ctx, x + 2, y + 2, width - 4, height - 4, 10);
            const edge = ctx.createLinearGradient(x, y, x, y + height);
            edge.addColorStop(0, "rgba(240,231,212,0.07)"); edge.addColorStop(.25, "rgba(240,231,212,0)");
            ctx.strokeStyle = edge; ctx.stroke();
        }
        ctx.restore(); bitmap.baseTexture.update();
    };
    ui.text = (w, value, x, y, width, size = 16, color = colors.text, align = "left", serif = false) => {
        Object.assign(w.contents, { fontFace: serif ? ui.fonts.heading : ui.fonts.label, fontSize: size, textColor: color, outlineWidth: 0 });
        w.contents.drawText(String(value), x, y, width, size + 8, align);
    };
    ui.wrapped = (w, value, x, y, width, size = 18, maxLines = 3, color = colors.text, align = "left", serif = false) => {
        Object.assign(w.contents, { fontFace: serif ? ui.fonts.heading : ui.fonts.label, fontSize: size });
        const lines = [];
        for (const paragraph of String(value).split("\n")) {
            let line = "";
            for (const word of paragraph.split(/\s+/)) {
                const next = line ? `${line} ${word}` : word;
                if (line && w.textWidth(next) > width) { lines.push(line); line = word; } else line = next;
            }
            lines.push(line);
        }
        lines.slice(0, maxLines).forEach((line, i) => ui.text(w, line + (i === maxLines - 1 && lines.length > maxLines ? "…" : ""), x, y + i * (size + 5), width, size, color, align, serif));
    };
    ui.panel = (w, r, selected = false, source = false) => {
        ui.surface(w.contents, r, selected, source);
    };
    ui.artwork = (w, actor, x, bottom, width, height, pose) => {
        if (!actor) return;
        const set = WwsDuelRules.actorSpriteSet(actor), rear = ["Samurai", "SamuraiInstructor", "Shinsengumi"].includes(set);
        const image = rear ? ImageManager.loadBitmap("img/battlers/", WwsDuelRules.playerImage(actor, pose || (set === "Shinsengumi" ? "Seigan" : "Chudan"))) : ImageManager.loadCharacter(actor.characterName());
        if (!image.isReady()) {
            w._wwsPendingArt ||= new Set();
            if (!w._wwsPendingArt.has(image)) {
                w._wwsPendingArt.add(image);
                image.addLoadListener(() => { w._wwsPendingArt.delete(image); if (!w._wwsDisposed && !w._destroyed && !w._partyDisposed) w.refresh(); });
            }
            return;
        }
        let sx = 0, sy = 0, sw = image.width, sh = image.height;
        if (!rear) {
            const big = ImageManager.isBigCharacter(actor.characterName()), index = actor.characterIndex();
            sw /= big ? 3 : 12; sh /= big ? 4 : 8;
            sx = ((big ? 0 : index % 4 * 3) + 1) * sw; sy = (big ? 0 : Math.floor(index / 4) * 4) * sh;
        }
        const scale = Math.min(width / sw, height / sh, rear ? 1 : 2);
        w.contents.blt(image, sx, sy, sw, sh, x + (width - sw * scale) / 2, bottom - sh * scale, sw * scale, sh * scale);
    };
    ui.health = (w, actor, x, y, width) => {
        ui.text(w, "HEALTH", x, y, width / 2, 12, colors.muted);
        ui.text(w, `${actor.hp} / ${actor.mhp}`, x, y, width, 16, colors.text, "right");
        w.contents.fillRect(x, y + 29, width, 5, colors.line);
        w.contents.fillRect(x, y + 29, width * actor.hpRate(), 5, colors.health);
    };
    class Button extends Sprite_Clickable {
        constructor(label, width, action) { super(); this.bitmap = new Bitmap(width, 40); this._action = action; this._label = label; this.paint(false); }
        paint(hover) { this.bitmap.clear(); ui.surface(this.bitmap, {x:0,y:0,width:this.bitmap.width,height:40}, hover, false, !hover); Object.assign(this.bitmap, {fontFace: ui.fonts.label, fontSize: 17, textColor: colors.text, outlineWidth: 0}); this.bitmap.drawText(this._label, 0, 0, this.bitmap.width, 40, "center"); }
        onMouseEnter() { this.paint(true); }
        onMouseExit() { this.paint(false); }
        setEnabled(enabled) { this._enabled = enabled; this.opacity = enabled ? 255 : 100; }
        onClick() { if (this._enabled !== false) this._action(); }
    }
    ui.Button = Button;
    ui.isMenu = () => SceneManager._scene instanceof Scene_MenuBase || SceneManager._scene instanceof Scene_Title;
    const resetFont = Window_Base.prototype.resetFontSettings;
    Window_Base.prototype.resetFontSettings = function() {
        resetFont.call(this);
        if (!(SceneManager._scene instanceof Scene_Battle) || this instanceof Window_Message || this instanceof Window_ChoiceList) {
            Object.assign(this.contents, {fontFace: ui.fonts.label, fontSize: this instanceof Window_Message ? 28 : this instanceof Window_ChoiceList ? 28 : 20, outlineWidth: 0});
        }
    };
    const messageRect = Scene_Message.prototype.messageWindowRect;
    Scene_Message.prototype.messageWindowRect = function() {
        const r = messageRect.call(this);
        r.width = Graphics.boxWidth - 48;
        r.x = Math.round((Graphics.boxWidth - r.width) / 2);
        // Four readable lines; overflow continues through MZ's normal page pause.
        const line = 28 + Math.max(8, Window_Base.prototype.lineHeight.call({}) - $gameSystem.mainFontSize());
        r.height = line * 4 + $gameSystem.windowPadding() * 2 + 8;
        return r;
    };
    const messagePlacement = Window_Message.prototype.updatePlacement;
    Window_Message.prototype.updatePlacement = function() {
        messagePlacement.call(this);
        this.x = Math.round((Graphics.boxWidth - this.width) / 2);
        if (this._positionType === 2) this.y -= 24;
        if (this._positionType === 0) this.y = 24 + ($gameMessage.speakerName() ? 58 : 0);
    };
    const messageCharacter = Window_Message.prototype.processCharacter;
    Window_Message.prototype.processCharacter = function(state) {
        if (!state.rtl && state.text[state.index] === " ") {
            const nextWord = state.text.slice(state.index).match(/^ +[^\s\x1b]+/);
            const used = state.x + this.textWidth(state.buffer);
            if (nextWord && used > state.startX && used + this.textWidth(nextWord[0]) > this.innerWidth - 4) {
                this.flushTextState(state);
                state.index += nextWord[0].length - nextWord[0].trimStart().length;
                this.processNewLine(state);
                return;
            }
        }
        messageCharacter.call(this, state);
    };
    Window_NameBox.prototype.resetFontSettings = function() {
        Window_Base.prototype.resetFontSettings.call(this);
        Object.assign(this.contents, {fontFace: ui.fonts.label, fontSize: 22, textColor: colors.gold, outlineWidth: 0});
    };
    Window_NameBox.prototype.lineHeight = () => 28;
    Window_NameBox.prototype.windowHeight = function() { return 28 + this.padding * 2; };
    const namePlacement = Window_NameBox.prototype.updatePlacement;
    Window_NameBox.prototype.updatePlacement = function() {
        namePlacement.call(this);
        const message = this._messageWindow;
        this.y = Math.max(0, message.y - this.height - 6);
    };
    const choicePlacement = Window_ChoiceList.prototype.updatePlacement;
    Window_ChoiceList.prototype.updatePlacement = function() {
        choicePlacement.call(this);
        const message = this._messageWindow;
        const position = $gameMessage.choicePositionType();
        this.x = message.x + (message.width - this.width) * position / 2;
        this.x = Math.max(0, Math.min(this.x, Graphics.boxWidth - this.width));
    };
    const destroyWindow = Window_Base.prototype.destroy;
    Window_Base.prototype.destroy = function(options) { this._wwsDisposed = true; destroyWindow.call(this, options); };
    // Draw panels directly rather than tinting the stock blue windowskin.
    Window.prototype._refreshBack = function() {
        const b = new Bitmap(Math.max(1, this._width), Math.max(1, this._height));
        ui.surface(b, {x:0,y:0,width:this._width,height:this._height});
        this._backSprite.bitmap = b; this._backSprite.setFrame(0, 0, b.width, b.height); this._backSprite.move(0, 0);
    };
    Window.prototype._refreshFrame = function() {
        const b = new Bitmap(Math.max(1, this._width), Math.max(1, this._height));
        this._frameSprite.bitmap = b; this._frameSprite.setFrame(0, 0, b.width, b.height);
        for (const child of this._frameSprite.children) child.visible = false;
    };
    Window.prototype._refreshCursor = function() {
        const r = this._cursorRect, b = new Bitmap(Math.max(1, r.width), Math.max(1, r.height));
        ui.surface(b, {x:0,y:0,width:r.width,height:r.height}, true);
        this._cursorSprite.bitmap = b; this._cursorSprite.setFrame(0, 0, r.width, r.height);
        for (const child of this._cursorSprite.children) child.visible = false;
    };
    Window_Selectable.prototype.drawBackgroundRect = function(r) { ui.surface(this.contentsBack, r, false, false, true); };
    ColorManager.normalColor = () => colors.text;
    ColorManager.systemColor = () => colors.gold;
    ColorManager.hpGaugeColor1 = () => colors.health;
    ColorManager.hpGaugeColor2 = () => colors.health;
    ColorManager.paramchangeTextColor = value => value > 0 ? colors.health : value < 0 ? colors.accent : colors.muted;
    const scale = Graphics._updateRealScale;
    Graphics._updateRealScale = function() { scale.call(this); if (this.width && this.height) this._realScale = Math.min(this._realScale, window.innerWidth / this.width, window.innerHeight / this.height); };
})();
