/*:
 * @target MZ
 * @plugindesc v1.0 WWS pause, equipment, inventory and supporting interfaces.
 * @author WWS
 * @base WWS_UI
 * @base WWS_Party
 * @orderAfter WWS_Party
 * @help Uses standard MZ action handlers and save formats. No plugin commands.
 */
(() => {
    "use strict";
    const U = WwsUI, C = U.colors, t = U.text, wrap = U.wrapped;
    const rect = (x, y, w, h) => new Rectangle(x, y, w, h);
    const W = () => Graphics.boxWidth, H = () => Graphics.boxHeight;
    const partyScreen = scene => scene.constructor.name === "Scene_WwsParty";
    const titles = { Scene_Menu: "The company", Scene_Equip: "Equipment", Scene_Item: "Inventory", Scene_Status: "Fighter", Scene_Skill: "Sword disciplines", Scene_Save: "Save your journey", Scene_Load: "Continue your journey", Scene_Options: "Options", Scene_Shop: "Merchant", Scene_GameEnd: "Leave the journey" };
    const background = Scene_MenuBase.prototype.createBackground;
    Scene_MenuBase.prototype.createBackground = function() {
        background.call(this);
        if (partyScreen(this)) return;
        this.setBackgroundOpacity(65);
        const shade = new Sprite(new Bitmap(W(), H()));
        shade.bitmap.gradientFillRect(0, 0, W(), H(), "rgba(12,18,17,0.88)", "rgba(36,34,26,0.96)", true);
        this.addChild(shade);
    };
    Scene_MenuBase.prototype.mainAreaTop = () => 104;
    Scene_MenuBase.prototype.mainAreaBottom = () => H() - 132;
    Scene_MenuBase.prototype.mainAreaHeight = function() { return this.mainAreaBottom() - this.mainAreaTop(); };
    Scene_MenuBase.prototype.helpAreaTop = () => H() - 116;
    Scene_MenuBase.prototype.helpAreaHeight = () => 96;
    Scene_MenuBase.prototype.helpWindowRect = () => rect(24, H() - 116, W() - 48, 96);
    Scene_MenuBase.prototype.createButtons = function() {
        const back = new U.Button("← Back", 108, () => {
            const active = this._windowLayer.children.find(w => w.active && w.visible && w.isHandled?.("cancel"));
            if (active) active.processCancel();
        });
        back.move(W() - 132, 28); this.addWindow(back); this._wwsBack = back;
        if (this.needsPageButtons()) {
            this._pageupButton = new U.Button("‹ Fighter", 112, () => { if (this.arePageButtonsEnabled()) this.previousActor(); });
            this._pagedownButton = new U.Button("Fighter ›", 112, () => { if (this.arePageButtonsEnabled()) this.nextActor(); });
            this._pageupButton.move(W() - 388, 28); this._pagedownButton.move(W() - 268, 28);
            this.addWindow(this._pageupButton); this.addWindow(this._pagedownButton);
        }
        const header = new Window_Base(rect(24, 8, W() - 440, 88)); header.opacity = 0;
        t(header, titles[this.constructor.name] || "Journey", 0, 0, header.innerWidth, 34, C.text, "left", true);
        t(header, "Arrows / click: select     Enter: confirm     Esc: back", 2, 43, header.innerWidth, 13, C.muted);
        this.addWindow(header);
    };
    // Pause menu: fixed three-position overview, with the saved Center/Left/Right mapping.
    Scene_Menu.prototype.commandWindowRect = () => rect(24, 104, 224, H() - 212);
    Scene_Menu.prototype.goldWindowRect = () => rect(24, H() - 92, 224, 64);
    Scene_Menu.prototype.createGoldWindow = function() { this._goldWindow = new Window_Base(this.goldWindowRect()); this.addWindow(this._goldWindow); t(this._goldWindow, `${$gameParty.gold()} ${TextManager.currencyUnit}`, 8, 5, this._goldWindow.innerWidth - 16, 20, C.gold, "right"); };
    Scene_Menu.prototype.statusWindowRect = () => rect(264, 104, W() - 288, H() - 212);
    Window_MenuCommand.prototype.itemHeight = () => 52;
    const addMenuCommand = Window_MenuCommand.prototype.addCommand;
    Window_MenuCommand.prototype.addCommand = function(name, symbol, enabled, ext) { addMenuCommand.call(this, ({item: "Inventory", skill: "Skills", equip: "Equipment", gameEnd: "Leave game"})[symbol] || name, symbol, enabled, ext); };
    class FighterCards extends Window_MenuStatus {
        update() { super.update(); const state = `${this.index()}:${this.active}`; if (this._wwsState !== state) { this._wwsState = state; this.refresh(); } }
        maxCols() { return 3; }
        maxItems() { return 3; }
        itemHeight() { return this.innerHeight; }
        actor(index) { return $gameParty.wwsFormation()[[1, 0, 2][index]]; }
        isCurrentItemEnabled() { return !!this.actor(this.index()); }
        processOk() { if (this.isCurrentItemEnabled()) super.processOk(); else SoundManager.playBuzzer(); }
        selectLast() { const index = [1, 0, 2].findIndex(i => $gameParty.wwsFormation()[i] === $gameParty.menuActor()); this.select(index < 0 ? 1 : index); }
        drawItem(index) {
            const r = this.itemRect(index), a = this.actor(index), x = r.x + 16, width = r.width - 32;
            U.panel(this, r, this.active && this.index() === index);
            t(this, ["LEFT", "CENTER", "RIGHT"][index], x, r.y + 12, width, 12, C.gold, "center");
            if (!a) { t(this, "Open position", x, r.y + 240, width, 23, C.muted, "center", true); wrap(this, "Awaiting a companion", x, r.y + 278, width, 15, 2, C.muted, "center"); return; }
            U.artwork(this, a, x, r.y + 250, width, 208);
            wrap(this, a.name(), x, r.y + 256, width, 25, 2, C.text, "center", true);
            t(this, `Level ${a.level} · ${a.currentClass().name}`, x, r.y + 322, width, 14, C.muted, "center");
            U.health(this, a, x, r.y + 360, width);
            t(this, `ATK ${a.atk}   DEF ${a.def}   SPD ${a.agi}`, x, r.y + 415, width, 15, C.muted, "center");
        }
    }
    Scene_Menu.prototype.createStatusWindow = function() { this._statusWindow = new FighterCards(this.statusWindowRect()); this.addWindow(this._statusWindow); };
    const menuCreate = Scene_Menu.prototype.create;
    Scene_Menu.prototype.create = function() {
        menuCreate.call(this);
        const info = new Window_Base(rect(264, H() - 92, W() - 288, 64)); this.addWindow(info);
        t(info, $gameMap.displayName() || $dataMapInfos[$gameMap.mapId()]?.name || "Journey", 8, 6, info.innerWidth - 190, 20, C.text, "left", true);
        t(info, `${$gameParty.allMembers().length} in company`, info.innerWidth - 190, 8, 182, 15, C.muted, "right");
    };
    // Equipment retains MZ's eligibility, slot locks and changeEquip transaction.
    Scene_Equip.prototype.statusWidth = () => 376;
    Scene_Equip.prototype.statusWindowRect = () => rect(24, 104, 376, H() - 236);
    Scene_Equip.prototype.commandWindowRect = () => rect(416, 104, W() - 440, 72);
    Scene_Equip.prototype.slotWindowRect = () => rect(416, 192, W() - 440, H() - 324);
    Scene_Equip.prototype.itemWindowRect = Scene_Equip.prototype.slotWindowRect;
    Window_EquipSlot.prototype.itemHeight = () => 58;
    Window_EquipItem.prototype.itemHeight = () => 58;
    Window_EquipStatus.prototype.refresh = function() {
        this.contents.clear(); const a = this._actor, next = this._tempActor;
        if (!a) return;
        const width = this.innerWidth - 24;
        wrap(this, a.name(), 12, 4, width, 25, 2, C.text, "left", true);
        t(this, `${WwsParty.position(a)} · Level ${a.level}`, 12, 70, width, 14, C.muted);
        const params = [0, 2, 3, 6];
        for (const id of [1, 4, 5, 7]) if (next && next.param(id) !== a.param(id)) params.push(id);
        const compact = params.length > 4, top = compact ? 216 : 258, stride = compact ? 27 : 36;
        U.artwork(this, a, 12, compact ? 180 : 222, width, compact ? 94 : 130);
        t(this, next ? "CURRENT  →  PREVIEW" : "CURRENT ATTRIBUTES", 12, compact ? 188 : 230, width, 12, C.gold);
        params.forEach((id, i) => {
            const y = top + i * stride, before = a.param(id), after = next?.param(id), diff = after - before;
            t(this, ({0:"Max Health",2:"Attack",3:"Defense",6:"Speed"})[id] || TextManager.param(id), 12, y, 132, 17, C.muted);
            t(this, before, 142, y, 54, 19, C.text, "right");
            if (next) t(this, `→ ${after} (${diff > 0 ? "+" : ""}${diff})`, 202, y, width - 190, 17, ColorManager.paramchangeTextColor(diff), "right");
        });
        t(this, next ? "Confirm to apply · Esc keeps your equipment" : "Choose a slot to compare equipment", 12, this.innerHeight - 28, width, 12, C.muted);
    };
    Window_EquipItem.prototype.drawItem = function(index) {
        const item = this.itemAt(index), r = this.itemLineRect(index);
        this.changePaintOpacity(this.isEnabled(item));
        if (item) { this.drawItemName(item, r.x, r.y, r.width - 76); this.drawItemNumber(item, r.x, r.y, r.width); }
        else t(this, "Remove equipment", r.x, r.y, r.width, 20, C.muted);
        this.changePaintOpacity(true);
    };
    const equipHelp = Window_EquipItem.prototype.updateHelp;
    Window_EquipItem.prototype.updateHelp = function() { equipHelp.call(this); if (!this.item()) this._helpWindow?.setText("Remove the equipment in this slot. Review the attribute changes before confirming."); };
    class LoadoutConfirm extends Window_Command {
        makeCommandList() { this.addCommand("Apply loadout", "apply"); this.addCommand("Keep current equipment", "cancel"); }
        itemHeight() { return 52; }
    }
    // Bulk operations are simulated with a detached party, so previewing cannot trade items.
    Scene_Equip.prototype.reviewLoadout = function(method) {
        const original = $gameParty, actor = JsonEx.makeDeepCopy(this.actor());
        try { $gameParty = JsonEx.makeDeepCopy(original); actor[method](); } finally { $gameParty = original; }
        this._statusWindow.setTempActor(actor);
        this._commandWindow.deactivate();
        this._helpWindow.setText(actor.equips().map((item, i) => `${$dataSystem.equipTypes[actor.equipSlots()[i]]}: ${item?.name || "Empty"}`).join("  ·  "));
        const dialog = new LoadoutConfirm(rect(464, 274, W() - 536, 140)); this._loadoutConfirm = dialog;
        const close = () => { dialog.deactivate(); dialog.hide(); this._statusWindow.setTempActor(null); this._commandWindow.activate(); this._helpWindow.clear(); };
        dialog.setHandler("apply", () => { this.actor()[method](); SoundManager.playEquip(); this._slotWindow.refresh(); close(); });
        dialog.setHandler("cancel", close); this.addWindow(dialog);
    };
    Scene_Equip.prototype.commandOptimize = function() { this.reviewLoadout("optimizeEquipments"); };
    Scene_Equip.prototype.commandClear = function() { this.reviewLoadout("clearEquipments"); };
    const equipPages = Scene_Equip.prototype.arePageButtonsEnabled;
    Scene_Equip.prototype.arePageButtonsEnabled = function() { return equipPages.call(this) && !this._loadoutConfirm?.active; };
    // Inventory descriptions wrap; categories, availability and effects stay with MZ.
    Scene_Item.prototype.categoryWindowRect = () => rect(24, 104, W() - 48, 72);
    Scene_Item.prototype.itemWindowRect = () => rect(24, 192, W() - 48, H() - 324);
    Window_ItemList.prototype.itemHeight = () => 56;
    const helpRefresh = Window_Help.prototype.refresh;
    Window_Help.prototype.refresh = function() {
        if (!U.isMenu()) { helpRefresh.call(this); return; }
        this.contents.clear();
        const value = this.convertEscapeCharacters(this._text || "").replace(/\x1b(?:[CI]\[\d+\]|[{}]|FS\[\d+\])/gi, "");
        wrap(this, value, 8, 3, this.innerWidth - 16, 18, Math.max(1, Math.floor((this.innerHeight - 3) / 23)));
    };
    const drawItems = Window_ItemList.prototype.drawAllItems;
    Window_ItemList.prototype.drawAllItems = function() { drawItems.call(this); if (!this.maxItems()) wrap(this, "No items in this category.", 16, 24, this.innerWidth - 32, 22, 2, C.muted, "left", true); };
    const itemHelp = Window_ItemList.prototype.updateHelp;
    Window_ItemList.prototype.updateHelp = function() {
        itemHelp.call(this);
        if (!this.item() && !this.maxItems()) this._helpWindow?.setText("This category is empty. Choose another category or go Back.");
    };
    Scene_ItemBase.prototype.actorWindowRect = () => rect(W() - 664, 104, 640, H() - 236);
    const showRecipients = Scene_ItemBase.prototype.showActorWindow;
    Scene_ItemBase.prototype.showActorWindow = function() {
        showRecipients.call(this); this._actorWindow.x = W() - 664;
        this._helpWindow.setText(`Choose a recipient for ${this.item().name}. Enter / click to use; Esc returns to the list.\n${this.item().description || ""}`);
    };
    Window_MenuActor.prototype.itemHeight = () => 128;
    Window_MenuActor.prototype.drawItem = function(index) {
        const a = this.actor(index), r = this.itemRect(index), x = r.x + 144, width = r.width - 164;
        if (!a) return;
        U.artwork(this, a, r.x + 8, r.y + 116, 120, 108);
        wrap(this, a.name(), x, r.y + 4, width, 22, 2, C.text, "left", true);
        t(this, `${WwsParty.position(a)} · Level ${a.level}`, x, r.y + 60, width, 13, C.muted);
        U.health(this, a, x, r.y + 83, width);
    };
    // Face images are never requested by any nonbattle fighter window.
    const faceImages = Window_StatusBase.prototype.loadFaceImages, face = Window_StatusBase.prototype.drawActorFace;
    Window_StatusBase.prototype.loadFaceImages = function() { if (SceneManager._scene instanceof Scene_Battle) faceImages.call(this); };
    Window_StatusBase.prototype.drawActorFace = function(actor, x, y, width = 144, height = 144) { if (SceneManager._scene instanceof Scene_Battle) face.call(this, actor, x, y, width, height); else U.artwork(this, actor, x, y + height, width, height); };
    const actorCreate = Scene_ItemBase.prototype.createActorWindow;
    Scene_ItemBase.prototype.createActorWindow = function() {
        this._recipientSummary = new Window_Base(rect(24, 104, W() - 48, H() - 236));
        this._recipientSummary.hide(); this.addWindow(this._recipientSummary); actorCreate.call(this);
    };
    const showActor = Scene_ItemBase.prototype.showActorWindow, hideActor = Scene_ItemBase.prototype.hideActorWindow;
    Scene_ItemBase.prototype.showActorWindow = function() {
        showActor.call(this); const w = this._recipientSummary, width = W() - 752;
        w.contents.clear(); w.show();
        t(w, DataManager.isSkill(this.item()) ? "USE ABILITY" : "USE ITEM", 16, 16, width, 12, C.gold);
        wrap(w, this.item().name, 16, 52, width, 29, 3, C.text, "left", true);
        if (DataManager.isItem(this.item())) t(w, `Quantity: ${$gameParty.numItems(this.item())}`, 16, 158, width, 17, C.muted);
        wrap(w, this.item().description, 16, 206, width, 18, 6, C.muted);
    };
    Scene_ItemBase.prototype.hideActorWindow = function() { hideActor.call(this); this._recipientSummary.hide(); };

    // Status displays the attributes used by WWS duels rather than stock magic stats.
    Scene_Status.prototype.statusWindowRect = () => rect(24, 104, 400, H() - 236);
    Scene_Status.prototype.statusParamsWindowRect = () => rect(440, 104, 296, H() - 236);
    Scene_Status.prototype.statusEquipWindowRect = () => rect(752, 104, W() - 776, H() - 236);
    Scene_Status.prototype.profileWindowRect = () => rect(24, H() - 116, W() - 48, 96);
    Window_Status.prototype.refresh = function() {
        Window_StatusBase.prototype.refresh.call(this); const a = this._actor; if (!a) return;
        const width = this.innerWidth - 24;
        wrap(this, a.name(), 12, 4, width, 29, 2, C.text, "left", true);
        t(this, `${WwsParty.position(a)} · Level ${a.level} · ${a.currentClass().name}`, 12, 86, width, 14, C.muted);
        U.artwork(this, a, 12, 324, width, 210);
        U.health(this, a, 12, 356, width);
        this.drawActorIcons(a, 12, 410, width);
    };
    Window_StatusParams.prototype.maxItems = () => 4;
    Window_StatusParams.prototype.itemHeight = () => 108;
    Window_StatusParams.prototype.drawItem = function(index) {
        if (!this._actor) return;
        const r = this.itemRect(index), id = [0, 2, 3, 6][index];
        t(this, ["MAX HEALTH", "ATTACK", "DEFENSE", "SPEED"][index], r.x + 12, r.y + 2, r.width - 24, 12, C.gold);
        t(this, this._actor.param(id), r.x + 12, r.y + 24, r.width - 24, 28, C.text, "left", true);
        wrap(this, ["How much damage you can withstand.", "Cut strength and pressure on weapon defenses.", "Automatic Parry / Block chance.", "Initiative and automatic Dodge chance."][index], r.x + 12, r.y + 62, r.width - 24, 14, 2, C.muted);
    };
    Window_StatusEquip.prototype.itemHeight = () => 82;
    Window_StatusEquip.prototype.drawItem = function(index) {
        const r = this.itemRect(index), item = this._actor.equips()[index];
        t(this, this.actorSlotName(this._actor, index).toUpperCase(), r.x + 12, r.y + 2, r.width - 24, 12, C.gold);
        wrap(this, item?.name || "Empty", r.x + 12, r.y + 27, r.width - 24, 20, 2, item ? C.text : C.muted, "left", true);
    };
    const refreshStatus = Scene_Status.prototype.refreshActor;
    Scene_Status.prototype.refreshActor = function() { refreshStatus.call(this); this._profileWindow.setText(WwsDuelRules.actorSpriteSet(this.actor()) === "Shinsengumi" ? "Seigan discipline · Three Stage Thrust: a parried cut can trigger two torso follow-ups. A dodge ends the chain; the third strike cannot be parried." : "Five sword forms · Choose an opening form for free. Later form changes use your turn. Parry / Block and Dodge happen automatically when attacked."); };

    // Forms are an inspection catalogue; learned database skills retain normal MZ use.
    const skillTypes = Window_SkillType.prototype.makeCommandList;
    Window_SkillType.prototype.makeCommandList = function() { if (this._actor && WwsDuelRules.actorSpriteSet(this._actor)) this.addCommand("Sword discipline", "wwsForms"); skillTypes.call(this); };
    Scene_Skill.prototype.skillTypeWindowRect = () => rect(24, 104, 224, H() - 236);
    Scene_Skill.prototype.statusWindowRect = () => rect(264, 104, W() - 288, 148);
    Scene_Skill.prototype.itemWindowRect = () => rect(264, 268, W() - 288, H() - 400);
    Window_SkillStatus.prototype.refresh = function() {
        Window_StatusBase.prototype.refresh.call(this); const a = this._actor; if (!a) return;
        U.artwork(this, a, 4, 116, 140, 110); wrap(this, a.name(), 156, 4, this.innerWidth - 176, 26, 2, C.text, "left", true);
        t(this, `Level ${a.level} · Health ${a.hp} / ${a.mhp} · MP ${a.mp} / ${a.mmp}`, 156, 79, this.innerWidth - 176, 17, C.muted);
    };
    const descriptions = {
        "Quick Cut": "A light cut with no recovery penalty. Choose an opponent, then Head, Torso, Arms or Legs. Hit chance and damage are shown while aiming.",
        "Heavy Cut": "Double the base cut damage and one higher cutting level. Recovery reduces your next initiative by 8. Choose a body area before committing.",
        "Automatic defenses": "Parry / Block compares the defender's Defense with the attacker's Attack. Dodge compares Speed. Your form and the targeted body area affect the actual chances. Defenses are automatic and use no turn.",
        "Three Stage Thrust": "Available to the Shinsengumi swordsman in Seigan. If his initial cut is parried, two torso follow-ups can trigger. A dodge ends the chain. The third strike cannot be parried; it can still be dodged."
    };
    class DisciplineList extends Window_Selectable {
        setActor(actor) {
            this._actor = actor;
            this._entries = [...WwsDuelRules.availableStances(actor), "Quick Cut", "Heavy Cut", "Automatic defenses"];
            if (WwsDuelRules.actorSpriteSet(actor) === "Shinsengumi") this._entries.push("Three Stage Thrust");
            this.refresh(); this.select(0); this.scrollTo(0, 0);
        }
        maxItems() { return this._entries?.length || 0; }
        itemHeight() { return 58; }
        drawItem(index) { const r = this.itemLineRect(index); t(this, this._entries[index], r.x, r.y + 6, r.width, 20, C.text, "left", true); }
        select(index) { super.select(index); this._onPreview?.(this._entries?.[index]); }
        isOkEnabled() { return false; }
    }
    class DisciplineDetails extends Window_Base {
        setEntry(actor, name) { this._actor = actor; this._name = name; this.refresh(); }
        refresh() {
            this.contents.clear(); if (!this._name || !this._actor) return;
            const width = this.innerWidth - 32, form = WwsDuelRules.formInfo(this._name);
            t(this, `${this._actor.name().toUpperCase()} · REFERENCE`, 16, 8, width, 12, C.gold);
            wrap(this, this._name, 16, 40, width, 30, 2, C.text, "left", true);
            if (form) {
                U.artwork(this, this._actor, 16, 250, width, 130, this._name);
                wrap(this, form.text.join("\n"), 16, 264, width, 18, 4, C.muted);
                wrap(this, this._name === "Seigan" ? "Seigan replaces Chudan for this fighter and enables Three Stage Thrust." : "Choose this form during a duel. The opening choice is free; later changes spend your turn.", 16, 366, width, 16, 3, C.text);
            } else wrap(this, descriptions[this._name], 16, 126, width, 20, 10, C.muted);
        }
    }
    const skillCreate = Scene_Skill.prototype.create;
    Scene_Skill.prototype.create = function() {
        skillCreate.call(this);
        this._disciplineList = new DisciplineList(rect(264, 104, 340, H() - 236));
        this._disciplineDetails = new DisciplineDetails(rect(620, 104, W() - 644, H() - 236));
        this._disciplineList._onPreview = name => this._disciplineDetails.setEntry(this.actor(), name);
        this._disciplineList.setActor(this.actor());
        this._disciplineList.setHandler("cancel", () => { this._disciplineList.deactivate(); this._skillTypeWindow.activate(); });
        this._disciplineList.setHandler("pageup", this.previousActor.bind(this)); this._disciplineList.setHandler("pagedown", this.nextActor.bind(this));
        this._skillTypeWindow.setHandler("wwsForms", () => { this._disciplineList.activate(); this._disciplineList.select(Math.max(0, this._disciplineList.index())); });
        this.addWindow(this._disciplineList); this.addWindow(this._disciplineDetails);
    };
    const skillUpdate = Scene_Skill.prototype.update;
    Scene_Skill.prototype.update = function() {
        skillUpdate.call(this); if (!this._disciplineList) return;
        const forms = this._skillTypeWindow.currentSymbol() === "wwsForms";
        this._disciplineList.visible = forms; this._disciplineDetails.visible = forms;
        this._statusWindow.visible = !forms; this._itemWindow.visible = !forms;
        if (forms) this._helpWindow.setText("Inspect your fighter's implemented forms and abilities. Forms are selected in combat; browsing here does not change them. PgUp / PgDn: switch fighter.");
    };
    const skillRefresh = Scene_Skill.prototype.refreshActor;
    Scene_Skill.prototype.refreshActor = function() { skillRefresh.call(this); this._disciplineList?.setActor(this.actor()); };
    const skillActorChange = Scene_Skill.prototype.onActorChange;
    Scene_Skill.prototype.onActorChange = function() { this._disciplineList?.deactivate(); skillActorChange.call(this); };
    // Additive save-list metadata; save contents and loading stay with DataManager.
    const saveInfo = DataManager.makeSavefileInfo;
    DataManager.makeSavefileInfo = function() {
        const info = saveInfo.call(this);
        info.wwsLocation = $gameMap.displayName() || $dataMapInfos[$gameMap.mapId()]?.name || "Journey";
        info.wwsCompany = $gameParty.wwsFormation().map(a => ({ name: a.name(), set: WwsDuelRules.actorSpriteSet(a), character: a.characterName(), index: a.characterIndex() }));
        return info;
    };
    Scene_File.prototype.helpWindowRect = () => rect(24, 104, W() - 48, 64);
    Scene_File.prototype.listWindowRect = () => rect(24, 184, W() - 48, H() - 208);
    Window_SavefileList.prototype.numVisibleRows = () => 3;
    Window_SavefileList.prototype.drawItem = function(index) {
        const id = this.indexToSavefileId(index), info = DataManager.savefileInfo(id), r = this.itemRectWithPadding(index);
        this.changePaintOpacity(this.isEnabled(id));
        const leftWidth = r.width - 512;
        t(this, id === 0 ? "Autosave" : `File ${id}`, r.x + 16, r.y + 8, leftWidth, 25, C.text, "left", true);
        if (!info) { t(this, "Empty slot", r.x + 16, r.y + 60, leftWidth, 18, C.muted); this.changePaintOpacity(true); return; }
        wrap(this, info.wwsLocation || "Location not recorded", r.x + 16, r.y + 46, leftWidth, 19, 2, C.muted);
        t(this, `Playtime  ${info.playtime || "—"}`, r.x + 16, r.y + 105, leftWidth, 16, C.gold);
        const members = info.wwsCompany || (info.characters || []).slice(0, 3).map(([character, index]) => ({character, index, name: "", set: null}));
        members.slice(0, 3).forEach((member, i) => {
            const actor = { isActor: () => true, actorId: () => -1, actor: () => ({note: member.set ? `<DuelActorSprite: ${member.set}>` : ""}), characterName: () => member.character, characterIndex: () => member.index };
            const x = r.x + r.width - 476 + i * 156;
            U.artwork(this, actor, x, r.y + 104, 144, 96);
            wrap(this, member.name, x, r.y + 106, 144, 14, 2, C.muted, "center");
        });
        this.changePaintOpacity(true);
    };
    Scene_Options.prototype.optionsWindowRect = () => rect(Math.floor(W() / 2 - 380), 104, 760, H() - 200);
    Window_Options.prototype.itemHeight = () => 64;
    Window_Options.prototype.drawItem = function(index) {
        const r = this.itemRectWithPadding(index), symbol = this.commandSymbol(index), value = this.getConfigValue(symbol);
        const names = {bgmVolume: "Music volume", bgsVolume: "Ambience volume", meVolume: "Jingle volume", seVolume: "Sound effects volume", alwaysDash: "Always dash", commandRemember: "Remember commands", touchUI: "Map touch controls"};
        this.changePaintOpacity(this.isCommandEnabled(index));
        t(this, names[symbol] || this.commandName(index), r.x + 16, r.y + 10, r.width - 250, 21);
        t(this, this.statusText(index), r.x + r.width - 210, r.y + 9, 190, 20, value ? C.gold : C.muted, "right");
        if (this.isVolumeSymbol(symbol)) {
            this.contents.fillRect(r.x + r.width - 200, r.y + 43, 180, 3, C.line);
            this.contents.fillRect(r.x + r.width - 200, r.y + 43, 180 * value / 100, 3, C.health);
        }
        this.changePaintOpacity(true);
    };
    const optionsCreate = Scene_Options.prototype.create;
    Scene_Options.prototype.create = function() { optionsCreate.call(this); this.createHelpWindow(); this._helpWindow.setText("Left / Right adjusts a setting. Enter or click toggles a setting or cycles its volume. Esc / Back saves your preferences and returns."); };
    // Title uses the existing courtyard and Hayato artwork, with standard MZ commands.
    Scene_Title.prototype.createBackground = function() {
        this._backSprite1 = new Sprite(ImageManager.loadBattleback1("EdoPracticeCourtyard-v1"));
        this._backSprite2 = new Sprite(new Bitmap(Graphics.width, Graphics.height));
        this._backSprite2.bitmap.gradientFillRect(0, 0, Graphics.width, Graphics.height, "rgba(12,18,17,0.97)", "rgba(12,18,17,0.48)");
        this.addChild(this._backSprite1); this.addChild(this._backSprite2);
    };
    Scene_Title.prototype.drawGameTitle = function() {
        const b = this._gameTitleSprite.bitmap;
        Object.assign(b, {fontFace: U.fonts.heading, fontSize: 64, textColor: C.text, outlineWidth: 0});
        b.drawText($dataSystem.gameTitle.toUpperCase(), 72, 136, W() - 144, 84, "left");
        b.fillRect(76, 240, 326, 2, C.gold);
        Object.assign(b, {fontFace: U.fonts.label, fontSize: 17, textColor: C.muted});
        b.drawText("Arrows / mouse to choose · Enter to confirm", 76, H() - 78, W() - 152, 30, "left");
    };
    const titleForeground = Scene_Title.prototype.createForeground;
    Scene_Title.prototype.createForeground = function() {
        titleForeground.call(this);
        const art = new Sprite(ImageManager.loadBitmap("img/battlers/", WwsDuelRules.playerImage($gameActors.actor(1), "Chudan")));
        art.anchor.set(.5, 1); art.move(W() * .70, H() - 106); art.scale.set(.85); this.addChild(art);
    };
    Scene_Title.prototype.commandWindowRect = () => rect(72, 316, 340, 216);
    Window_TitleCommand.prototype.itemHeight = () => 64;

    // Shops retain event goods, pricing, purchase-only flags and engine transactions.
    Scene_Shop.prototype.goldWindowRect = () => rect(W() - 328, 104, 304, 72);
    Scene_Shop.prototype.commandWindowRect = () => rect(24, 104, W() - 368, 72);
    Scene_Shop.prototype.dummyWindowRect = () => rect(24, 192, W() - 48, H() - 324);
    Scene_Shop.prototype.buyWindowRect = () => rect(24, 192, W() - 432, H() - 324);
    Scene_Shop.prototype.numberWindowRect = Scene_Shop.prototype.buyWindowRect;
    Scene_Shop.prototype.statusWindowRect = () => rect(W() - 392, 192, 368, H() - 324);
    Scene_Shop.prototype.categoryWindowRect = () => rect(24, 192, W() - 48, 72);
    Scene_Shop.prototype.sellWindowRect = () => rect(24, 280, W() - 48, H() - 412);
    Window_ShopBuy.prototype.itemHeight = () => 56;
    Window_ShopStatus.prototype.pageSize = () => 3;
    Window_ShopStatus.prototype.refresh = function() {
        this.contents.clear(); if (!this._item) return;
        const width = this.innerWidth - 24;
        t(this, `IN COMPANY  ·  ${$gameParty.numItems(this._item)}`, 12, 4, width, 13, C.gold);
        if (this.isEquipItem()) this.statusMembers().forEach((actor, i) => {
            const y = 38 + i * 100, current = this.currentEquippedItem(actor, this._item.etypeId), can = actor.canEquip(this._item);
            U.artwork(this, actor, 8, y + 78, 58, 72);
            wrap(this, actor.name(), 76, y, width - 64, 18, 2, can ? C.text : C.muted, "left", true);
            t(this, current?.name || "Empty slot", 76, y + 46, width - 64, 13, C.muted);
            if (can) {
                const copy = JsonEx.makeDeepCopy(actor), slot = actor.equipSlots().findIndex((type, j) => type === this._item.etypeId && actor.equips()[j] === current);
                if (slot >= 0) {
                    copy.forceChangeEquip(slot, this._item);
                    const change = id => { const d = copy.param(id) - actor.param(id); return `${d > 0 ? "+" : ""}${d}`; };
                    t(this, `ATK ${change(2)}  DEF ${change(3)}  SPD ${change(6)}`, 76, y + 70, width - 64, 13, C.gold);
                }
            } else t(this, "Cannot equip", 76, y + 70, width - 64, 13, C.accent);
        });
        else wrap(this, this._item.description, 12, 64, width, 18, 8, C.muted);
        if (this.maxPages() > 1 && this.isEquipItem()) t(this, `Shift / click: more fighters · ${this._pageIndex + 1}/${this.maxPages()}`, 12, this.innerHeight - 24, width, 12, C.muted);
    };
    Window_ShopNumber.prototype.createButtons = function() {
        this._buttons = [["−10", -10], ["−", -1], ["+", 1], ["+10", 10], ["Confirm", 0]].map(([name, delta]) => {
            const b = new U.Button(name, delta ? 64 : 112, () => { if (this.active) delta ? this.changeNumber(delta) : this.processOk(); });
            b._delta = delta; this.addInnerChild(b); return b;
        });
    };
    const shopCreate = Scene_Shop.prototype.create;
    Scene_Shop.prototype.create = function() { shopCreate.call(this); wrap(this._dummyWindow, "Buy supplies or sell items from your inventory.", 24, 30, this._dummyWindow.innerWidth - 48, 26, 3, C.muted, "left", true); };

    // Dialogue keeps its interpreter callbacks, escape codes and cancellation branches.
    Window_ChoiceList.prototype.createCancelButton = function() {
        this._cancelButton = new U.Button("← Back", 104, () => { if (this.active && this.isCancelEnabled()) this.processCancel(); });
        this._cancelButton.visible = false; this.addChild(this._cancelButton);
    };
    const nameFont = Window_NameBox.prototype.resetFontSettings;
    Window_NameBox.prototype.resetFontSettings = function() { nameFont.call(this); this.contents.fontFace = U.fonts.heading; this.contents.fontSize = 28; this.contents.outlineWidth = 0; };
    Window_GameEnd.prototype.itemHeight = () => 56;
    Scene_GameEnd.prototype.commandWindowRect = () => rect(Math.floor(W() / 2 - 240), 270, 480, 140);
    class Confirm extends Window_Command {
        makeCommandList() { this.addCommand("Confirm", "confirm"); this.addCommand("Cancel", "cancel"); }
        itemHeight() { return 54; }
    }
    U.confirm = (scene, question, apply, cancel) => {
        const panel = new Window_Base(rect(Math.floor(W() / 2 - 310), 222, 620, 220));
        wrap(panel, question, 20, 12, panel.innerWidth - 40, 25, 2, C.text, "left", true);
        const choices = new Confirm(rect(Math.floor(W() / 2 - 286), 314, 572, 132));
        choices.select(1); scene.addWindow(panel); scene.addWindow(choices);
        const close = () => { choices.deactivate(); choices.hide(); panel.hide(); };
        choices.setHandler("confirm", () => { close(); apply(); });
        choices.setHandler("cancel", () => { close(); cancel(); });
    };
    const returnToTitle = Scene_GameEnd.prototype.commandToTitle;
    Scene_GameEnd.prototype.commandToTitle = function() { this._commandWindow.deactivate(); U.confirm(this, "Return to the title? Unsaved progress will be lost.", () => returnToTitle.call(this), () => this._commandWindow.activate()); };
    const saveOk = Scene_Save.prototype.onSavefileOk;
    Scene_Save.prototype.onSavefileOk = function() {
        if (DataManager.savefileInfo(this.savefileId()) && this.isSavefileEnabled(this.savefileId())) {
            this._listWindow.deactivate(); U.confirm(this, `Overwrite File ${this.savefileId()} with this journey?`, () => saveOk.call(this), () => this._listWindow.activate());
        } else saveOk.call(this);
    };
    const shopNumberUpdate = Window_ShopNumber.prototype.update;
    Window_ShopNumber.prototype.update = function() { shopNumberUpdate.call(this); for (const b of this._buttons) b.setEnabled(this.active && (b._delta < 0 ? this._number > 1 : b._delta > 0 ? this._number < this._max : true)); };
    const shopDrawAll = Window_ShopBuy.prototype.drawAllItems;
    Window_ShopBuy.prototype.drawAllItems = function() { shopDrawAll.call(this); if (!this.maxItems()) wrap(this, "No goods available.", 16, 24, this.innerWidth - 32, 23, 2, C.muted, "left", true); };
    const skillDrawAll = Window_SkillList.prototype.drawAllItems;
    Window_SkillList.prototype.drawAllItems = function() { skillDrawAll.call(this); if (U.isMenu() && !this.maxItems()) wrap(this, "No learned abilities in this category.", 16, 24, this.innerWidth - 32, 22, 2, C.muted, "left", true); };
})();
