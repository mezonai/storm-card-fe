import { _decorator, assetManager, Component, ImageAsset, Label, Node, Sprite, SpriteFrame, Texture2D } from 'cc';
import * as GlobalVariable from '../Common/GlobalVariable';
const { ccclass, property } = _decorator;

@ccclass('MyUserInfo')
export class MyUserInfo extends Component {
    @property({ type: Label }) txt_Name: Label = null;
    @property({ type: Label }) txt_Money: Label = null;
    @property({ type: Label }) txt_Mezon: Label = null;
    @property({ type: Sprite }) spr_Avar: Sprite = null;
    private static _instance: MyUserInfo = null;
    public static get instance(): MyUserInfo {
        return MyUserInfo._instance
    }
    onLoad() {
        if (MyUserInfo._instance == null) {
            MyUserInfo._instance = this;
        }
    }
    
    setMoney(money) {
        this.txt_Money.string = money;
        GlobalVariable.myMezonInfo.money = money;
    }
    setInfo(data) {
        this.txt_Name.string = data.user.username;
        this.txt_Mezon.string = data.wallet.value;

        GlobalVariable.myMezonInfo.avatar = data.user.avatar_url
        GlobalVariable.myMezonInfo.name = data.user.username
        GlobalVariable.myMezonInfo.mail = data.email
        GlobalVariable.myMezonInfo.id = data.user.id
        GlobalVariable.myMezonInfo.mezonToken = data.wallet.value

        let that = this;
        let tryLoad = false;
        assetManager.loadRemote(data.user.avatar_url, { ext: '.png' }, (err, imageAsset) => {
            if (err) {
                console.log("Failed to load image:", err);
                return;
            }

            if (!(imageAsset instanceof ImageAsset)) {
                console.log("Loaded asset is not an ImageAsset!");
                return;
            }
            const texture = new Texture2D();
            texture.image = imageAsset;

            const spriteFrame = new SpriteFrame();
            spriteFrame.texture = texture;

            that.spr_Avar.spriteFrame = spriteFrame;
        });
        if (tryLoad) {
            assetManager.loadRemote(data.user.avatar_url, (err, imageAsset) => {
                if (err) {
                    console.log("Failed to load image:", err);
                    return;
                }

                if (!(imageAsset instanceof ImageAsset)) {
                    console.log("Loaded asset is not an ImageAsset!");
                    return;
                }
                const texture = new Texture2D();
                texture.image = imageAsset;

                const spriteFrame = new SpriteFrame();
                spriteFrame.texture = texture;

                that.spr_Avar.spriteFrame = spriteFrame;
            });
        }
    }
}