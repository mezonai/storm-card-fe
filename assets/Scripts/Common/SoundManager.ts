import { _decorator, AudioClip, AudioSource, CCFloat, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SoundManager')
export class SoundManager extends Component {
    private static _instance: SoundManager = null;
    public static get instance(): SoundManager {
        return this._instance;
    }

    public static readonly STORAGE_KEYS = {
        bgSound: 'bgSound',
        sfxSound: 'sfxSound'
    };

    @property({ type: AudioSource }) bgmSource: AudioSource = null;
    @property({ type: AudioSource }) sfxSource: AudioSource = null;
    @property({ type: CCFloat }) originBgmVolume: number = 0.3;
    private bgmVolume: number = 0.3;

    @property({ type: Node }) sfxSoundSourceParent: Node = null;
    @property({ type: CCFloat }) originSfxVolume: number = 0.3;
    private sfxVolume: number = 0.3;

    private sfxSources: AudioSource[] = [];
    private isSoundEnabled: boolean = true;
    private isSfxEnabled: boolean = true;

    onLoad() {
        if (!SoundManager._instance) {
            SoundManager._instance = this;
        }
        this.loadSetting();
    }

    protected onEnable(): void {
        this.sfxSources = this.sfxSoundSourceParent.getComponents(AudioSource);
    }

    protected onDestroy(): void {
        SoundManager._instance = null;
    }

    private loadSetting() {
        // ✅ Giá trị mặc định: bật cả sound và sfx
        const bg = localStorage.getItem(SoundManager.STORAGE_KEYS.bgSound);
        const sfx = localStorage.getItem(SoundManager.STORAGE_KEYS.sfxSound);

        this.isSoundEnabled = bg !== '0';
        this.isSfxEnabled = sfx !== '0';

        this.bgmVolume = this.isSoundEnabled ? this.originBgmVolume : 0;
        this.sfxVolume = this.isSfxEnabled ? this.originSfxVolume : 0;

        this.bgmSource.volume = this.bgmVolume;
    }

    public toggleSound(enabled: boolean) {
        this.isSoundEnabled = enabled;
        localStorage.setItem(SoundManager.STORAGE_KEYS.bgSound, enabled ? '1' : '0');

        this.bgmVolume = enabled ? this.originBgmVolume : 0;
        this.bgmSource.volume = this.bgmVolume;

        if (enabled) {
            this.bgmSource.stop();
            this.bgmSource.play();
        } else {
            this.bgmSource.stop();
        }
    }

    public toggleSfx(enabled: boolean) {
        this.isSfxEnabled = enabled;
        localStorage.setItem(SoundManager.STORAGE_KEYS.sfxSound, enabled ? '1' : '0');

        this.sfxVolume = enabled ? this.originSfxVolume : 0;
    }

    public playSfx(clip: AudioClip) {
        if (clip && this.isSfxEnabled) {
            this.sfxSource.playOneShot(clip, this.sfxVolume);
        }
    }

    private getSfxSourceFree(): AudioSource | null {
        for (const source of this.sfxSources) {
            if (!source.playing) {
                return source;
            }
        }
        return null;
    }

    // 👉 Cho UI truy cập trạng thái hiện tại
    public get isSoundOn(): boolean {
        return this.isSoundEnabled;
    }

    public get isSfxOn(): boolean {
        return this.isSfxEnabled;
    }
}
