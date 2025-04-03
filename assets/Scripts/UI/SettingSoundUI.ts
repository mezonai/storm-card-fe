import { _decorator, Component, Node } from 'cc';
import { SoundManager } from '../Common/SoundManager';
const { ccclass, property } = _decorator;

@ccclass('SettingSoundUI')
export class SettingSoundUI extends Component {
    @property(Node) bgSoundButton: Node = null;
    @property(Node) sfxButton: Node = null;

    @property(Node) iconBgOn: Node = null;
    @property(Node) iconBgOff: Node = null;

    @property(Node) iconSfxOn: Node = null;
    @property(Node) iconSfxOff: Node = null;

    private isBgSoundOn: boolean = true;
    private isSfxOn: boolean = true;

    onLoad() {
        const soundMgr = SoundManager.instance;
        this.isBgSoundOn = soundMgr.isSoundOn;
        this.isSfxOn = soundMgr.isSfxOn;

        this.applySoundState();
    }

    start() {
        this.bgSoundButton.on('click', this.toggleBgSound, this);
        this.sfxButton.on('click', this.toggleSfx, this);
    }

    toggleBgSound() {
        this.isBgSoundOn = !this.isBgSoundOn;
        SoundManager.instance.toggleSound(this.isBgSoundOn);
        this.updateBgUI();
    }

    toggleSfx() {
        this.isSfxOn = !this.isSfxOn;
        SoundManager.instance.toggleSfx(this.isSfxOn);
        this.updateSfxUI();
    }

    applySoundState() {
        this.updateBgUI();
        this.updateSfxUI();
    }

    updateBgUI() {
        this.iconBgOn.active = this.isBgSoundOn;
        this.iconBgOff.active = !this.isBgSoundOn;
    }

    updateSfxUI() {
        this.iconSfxOn.active = this.isSfxOn;
        this.iconSfxOff.active = !this.isSfxOn;
    }
}
