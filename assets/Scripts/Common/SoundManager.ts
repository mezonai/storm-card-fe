import { _decorator, AudioClip, AudioSource, CCFloat, Component, Node, randomRangeInt } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SoundManager')
export class SoundManager extends Component {
    private static _instance: SoundManager = null;
    public static get instance(): SoundManager {
        return this._instance
    }

    @property({ type: AudioSource }) bgmSource: AudioSource = null;
    @property({ type: CCFloat }) originBgmVolume: number = 0.3;
    private bgmVolume: number = 0.3;
    @property({ type: Node }) sfxSoundSourceParent: Node = null;
    private sfxSources: AudioSource[] = [];
    @property({ type: CCFloat }) originSfxVolume: number = 0.3;
    private sfxVolume: number = 0.3;
    private isSoundEnable = false;

    onLoad() {
        if (SoundManager._instance == null) {
            SoundManager._instance = this;
        }
    }

    protected onEnable(): void {
        this.sfxSources = this.sfxSoundSourceParent.getComponents(AudioSource);
        // GameManager.instance.settingManager.node.on("toggle_sound", (value) => this.onToggleSound(value), this);
    }

    private onToggleSound(value) {
        this.isSoundEnable = value == 1 ? true : false;
        this.sfxVolume = value == 1 ? this.originSfxVolume : 0;
        this.bgmVolume = value == 1 ? this.originBgmVolume : 0;

        this.bgmSource.volume = this.bgmVolume;
        if (this.bgmSource.clip != null) {
            this.bgmSource.stop();
            this.bgmSource.play();
        }
    }

    protected onDestroy(): void {
        SoundManager._instance = null;
    }

    private getSfxSourceFree() {
        for (const source of this.sfxSources) {
            if (!source.playing)
                return source;
        }

        return null;
    }

    public playSfx(clip: AudioClip) {
        if (clip != null) {
            this.getSfxSourceFree()?.playOneShot(clip, this.sfxVolume);
        }
    }
}