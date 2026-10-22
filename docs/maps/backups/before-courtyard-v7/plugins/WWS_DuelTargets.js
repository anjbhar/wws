/*:
 * @target MZ
 * @plugindesc v1.5 Character-specific body targets with live hit and damage.
 * @author WWS
 * @help
 * Load after WWS_Duel. Quick/Heavy Cut opens body markers for supported pose sets.
 * Hover/click a body region, or use arrows and Enter. Escape/right-click backs out.
 * Damage and injury effects remain in the bottom panel. No timing requirement.
 * Each area shows hit chance after automatic defenses and damage on a hit.
 * Other enemy artwork and side-view battles retain the original target cards.
 */
(() => {
    'use strict';
    const areas = ['Head', 'Torso', 'Arms', 'Legs'];
    // Ellipses use native 288px pose coordinates: center x/y, radius x/y.
    // Paired limbs are one logical target. These are generous invisible hit areas.
    const poses = {
        Chudan: {Head:[[140,76,24,28]],Torso:[[144,124,27,32]],Arms:[[115,125,23,25],[165,134,22,24]],Legs:[[111,221,30,44],[177,220,30,44]]},
        Jodan: {Head:[[139,90,24,28]],Torso:[[137,128,26,29]],Arms:[[108,88,26,43],[120,60,22,26]],Legs:[[113,220,30,44],[173,220,30,44]]},
        Gedan: {Head:[[168,76,24,28]],Torso:[[166,121,27,30]],Arms:[[146,143,24,24],[187,138,23,26]],Legs:[[139,222,30,44],[204,222,30,44]]},
        Kasumi: {Head:[[147,77,24,27]],Torso:[[151,128,27,30]],Arms:[[178,111,24,30],[143,103,22,29]],Legs:[[105,218,35,44],[195,216,35,44]]},
        Waki: {Head:[[138,83,24,28]],Torso:[[141,129,27,30]],Arms:[[153,141,24,24],[176,154,22,22]],Legs:[[115,220,30,44],[180,222,30,44]]}
    };
    const profiles = {
        SamuraiInstructor: poses,
        Shinsengumi: {
            TwoSword: {Head:[[144,66,23,25]],Torso:[[150,112,26,28]],Arms:[[110,125,22,22],[208,145,21,22]],Legs:[[113,221,29,39],[197,220,29,39]]},
            Chudan: {Head:[[137,67,23,27]],Torso:[[142,112,27,28]],Arms:[[123,127,22,22],[158,136,22,22]],Legs:[[106,220,29,40],[177,220,29,40]]},
            Jodan: {Head:[[139,91,23,25]],Torso:[[142,133,26,27]],Arms:[[101,83,24,35],[118,62,20,22]],Legs:[[111,222,29,40],[174,222,29,40]]},
            Gedan: {Head:[[139,74,23,26]],Torso:[[142,117,26,29]],Arms:[[126,144,21,23],[155,139,21,23]],Legs:[[109,222,28,40],[177,222,28,40]]},
            Kasumi: {Head:[[140,85,23,25]],Torso:[[148,138,27,29]],Arms:[[178,117,22,28],[157,115,21,27]],Legs:[[98,226,31,34],[191,226,31,34]]},
            Waki: {Head:[[128,89,22,25]],Torso:[[131,133,25,26]],Arms:[[145,152,21,20],[167,157,21,20]],Legs:[[114,229,27,32],[176,230,27,32]]}
        }
    };
    function regions(battler, pose) {
        const profile = profiles[WwsDuelRules.enemySpriteSet(battler)];
        return profile ? profile[pose] || profile.Chudan : null;
    }
    const effects = {
        Head: 'More damage. A wound weakens their defense.',
        Torso: 'Reliable damage. A wound slows their recovery.',
        Arms: 'Less damage. A wound weakens their cuts.',
        Legs: 'Less damage. A wound reduces their speed.'
    };
    function hit(pose, x, y, battler = null) {
        let best=null, distance=Infinity;
        const body=battler ? regions(battler,pose) : poses[pose] || poses.Chudan;
        if(!body)return null;
        for(const area of areas)for(const [cx,cy,rx,ry] of body[area]) {
            const d=((x-cx)/rx)**2+((y-cy)/ry)**2;
            if(d<=1 && d<distance){best=area;distance=d;}
        }
        return best;
    }
    function hitChances(attacker, defender, heavy) {
        return Object.fromEntries(areas.map(area => [area,
            1 - WwsDuelRules.defense(defender, attacker, heavy, area)]));
    }
    function pick(pose, x, y, battler = null) {
        return areas.find((area,index)=>x>=238 && x<=458 && Math.abs(y-(68+index*46))<=17) || hit(pose,x,y,battler);
    }
    globalThis.WwsDuelTargets = { hit, poses, profiles, regions, hitChances, pick };
    class Window_DuelTargets extends Window_Base {
        initialize(rect, scene) {
            super.initialize(rect);
            this.opacity=0;
            this._scene=scene;
            this._area='Torso';
            this._wasTarget=false;
            this.hide();
        }
        enemySprite() {
            const d=BattleManager._wwsDuel;
            if(!d || $gameSystem.isSideView())return null;
            return this._scene._spriteset._enemySprites.find(s=>s._battler===d.battlers[1] && regions(s._battler,WwsDuelRules.pose(s._battler)));
        }
        supported() {return !!this.enemySprite();}
        lineHeight() {return 24;}
        stop() {this.hide();if(this._markers)this._markers.visible=false;}
        refresh() {
            this.contents.clear();
            const d=BattleManager._wwsDuel;
            const [attacker,defender]=d.battlers;
            const chances=WwsDuelRules.defenseChances(defender,attacker,d.kind==='Heavy Cut',this._area);
            const ui=WwsDuelUI;
            ui.panel(this);
            ui.textAt(this,`${d.kind.toUpperCase()}  /  CHOOSE A TARGET`,16,2,440,12,ui.muted);
            ui.textAt(this,'Point or ← →  Select     Enter  Strike     Esc  Back',this.innerWidth-440,2,424,12,ui.muted,'right');
            ui.textAt(this,this._area,16,34,this.innerWidth-320,27,ui.text,'left',true);
            const damage=WwsDuelRules.damage(attacker,defender,d.kind==='Heavy Cut',this._area);
            ui.textAt(this,`${damage} damage · ${effects[this._area]}`,16,70,this.innerWidth-360,15,ui.muted);
            ui.textAt(this,`${Math.round((1-chances.Parry-chances.Dodge)*100)}% hit`,this.innerWidth-260,34,244,27,ui.text,'right',true);
            ui.textAt(this,`Parry/Block ${Math.round(chances.Parry*100)}%  ·  Dodge ${Math.round(chances.Dodge*100)}%`,this.innerWidth-340,70,324,13,ui.muted,'right');
        }
        drawMarkers(sprite, pose) {
            // Padding keeps callouts outside the body without clipping them.
            const padX=128,padY=16;
            if(!this._markers){
                this._markers=new Sprite(new Bitmap(640,320));
                sprite.addChild(this._markers);
            }
            this._markers.x=-sprite.anchor.x*288-padX;
            this._markers.y=-sprite.anchor.y*288-padY;
            this._markers.visible=true;
            const bitmap=this._markers.bitmap;
            const d=BattleManager._wwsDuel;
            const chances=hitChances(d.battlers[0],sprite._battler,d.kind==='Heavy Cut');
            const percentages=Object.fromEntries(areas.map(area=>[area,Math.round(chances[area]*100)]));
            const damages=Object.fromEntries(areas.map(area=>[area,WwsDuelRules.damage(d.battlers[0],sprite._battler,d.kind==='Heavy Cut',area)]));
            const key=JSON.stringify([sprite._battler.enemyId(),pose,this._area,percentages,damages]);
            if(this._drawn===key)return;
            this._drawn=key;
            bitmap.clear();
            const c=bitmap.context,body=regions(sprite._battler,pose);
            c.save();c.translate(padX,padY);
            for(const area of areas)for(const [x,y,rx,ry] of body[area]) {
                if(area===this._area){
                    c.strokeStyle='#e4cf9f';c.lineWidth=1.25;
                    c.beginPath();c.ellipse(x,y,rx*.70,ry*.72,0,0,Math.PI*2);c.stroke();
                    c.beginPath();c.arc(x,y,3,0,Math.PI*2);c.fillStyle='#e4cf9f';c.fill();
                }
            }
            c.textBaseline='middle';
            for(const [index,area] of areas.entries()){
                const [x,y]=body[area][0];
                const labelX=246;
                const labelY=68+index*46;
                const selected=area===this._area;
                if(selected){
                    c.strokeStyle='rgba(228,207,159,0.65)';c.lineWidth=1;
                    c.beginPath();c.moveTo(x+8,y);c.lineTo(222,y);c.lineTo(labelX-8,labelY);c.stroke();
                }
                c.fillStyle=selected?'rgba(92,55,43,0.96)':'rgba(24,29,28,0.94)';
                c.fillRect(labelX-8,labelY-17,220,34);
                c.fillStyle=selected?'#c68468':'#51574e';c.fillRect(labelX-8,labelY-17,2,34);
                c.font='14px Arial';c.fillStyle='#d1cebc';c.fillText(area,labelX+2,labelY-6);
                c.font='bold 16px Arial';c.fillStyle=selected?'#fff0d0':'#f0e7d4';
                c.textAlign='right';c.fillText(`${percentages[area]}% hit`,labelX+202,labelY-6);c.textAlign='left';
                c.font='12px Arial';c.fillStyle='#b7b7a7';c.fillText(`${damages[area]} damage on hit`,labelX+2,labelY+9);
            }
            c.restore();
            bitmap.baseTexture.update();
        }
        select(area) {
            if(!area || area===this._area)return;
            this._area=area;
            SoundManager.playCursor();
            this.refresh();
        }
        update() {
            super.update();
            const d=BattleManager._wwsDuel,sprite=this.enemySprite();
            const targeting=d?.mode==='target' && sprite && !$gameMessage.isBusy();
            if(!targeting){this.stop();this._wasTarget=false;return;}
            const pose=WwsDuelRules.pose(sprite._battler);
            this.show();
            this.drawMarkers(sprite,pose);
            // Do not reuse the action card's Enter/click in the newly opened picker.
            if(!this._wasTarget){this._wasTarget=true;this._area='Torso';this._drawn=null;this.refresh();return;}
            if(!this._scene.isActive())return;
            if(Input.isTriggered('cancel') || TouchInput.isCancelled()) {
                SoundManager.playCancel();BattleManager.wwsCancelTarget();this.stop();return;
            }
            if(Input.isRepeated('down') || Input.isRepeated('right'))
                this.select(areas[(areas.indexOf(this._area)+1)%areas.length]);
            else if(Input.isRepeated('up') || Input.isRepeated('left'))
                this.select(areas[(areas.indexOf(this._area)+areas.length-1)%areas.length]);
            let hovered=null;
            if(TouchInput.isMoved() || TouchInput.isTriggered()) {
                const p=sprite.worldTransform.applyInverse(new Point(TouchInput.x,TouchInput.y));
                const x=p.x+sprite.anchor.x*288,y=p.y+sprite.anchor.y*288;
                hovered=pick(pose,x,y,sprite._battler);
                this.select(hovered);
            }
            if(Input.isTriggered('ok') || (TouchInput.isTriggered() && hovered)) {
                SoundManager.playOk();BattleManager.wwsChooseTarget(this._area);this.stop();return;
            }
            this.drawMarkers(sprite,pose);
        }
    }
    const create=Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows=function() {
        create.call(this);
        if(!this._duelCards)return;
        this._duelTargets=new Window_DuelTargets(WwsDuelUI.bottomRect(),this);
        this.addWindow(this._duelTargets);
        const setMode=this._duelCards.setMode;
        const targets=this._duelTargets;
        this._duelCards.setMode=function(mode) {
            return setMode.call(this,mode==='target' && targets.supported()?'spriteTarget':mode);
        };
    };
})();
