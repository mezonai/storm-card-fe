import { _decorator, Button, CCFloat, CCString, Component, Label, Node, ProgressBar, RichText, Sprite, SpriteFrame, sys, tween, Vec3, view, Widget } from 'cc';
import UIPopup from './UI_Popup';
import { UIID } from './UIID';
import { UIIdentify } from './UIIdentify';
const { ccclass, property } = _decorator;

@ccclass('RankIconData')
export class RankIconData {
    @property({ type: CCString }) rankName: string = "";
    @property({ type: SpriteFrame }) icon;
    @property({ type: CCFloat }) offsetY: number = 0;
}

@ccclass('UIManager')
export class UIManager extends Component {
    private static _instance: UIManager = null;
    @property({ type: UIID }) public defaultUI: UIID = UIID.GameLobby;
    @property({ type: UIIdentify }) public lstPanel: UIIdentify[] = [];
    @property({ type: UIPopup }) public popup: UIPopup;



    public static get Instance(): UIManager {
        return this._instance
    }

    onLoad() {
        if (UIManager._instance == null) {
            UIManager._instance = this;
        }
    }

    protected onDestroy(): void {
        UIManager._instance = null;
    }

    start() {
        let that = this;
        view.setResizeCallback(function () {
            that.node.emit("ON_SCREEN_RESIZE", that);
        })
    }

    public init(userName: string, currentRank: number) {
        this.showUI(this.defaultUI);
        this.lstPanel.forEach(panel => {
            panel.init();
        });
    }


    public showUI(id: UIID): Node {
        if (this.lstPanel == null) return;
        //Popup
        for (const panel of this.lstPanel) {
            if (panel && panel.id === id && panel.isPopup) {
                panel.show(panel.isShowOnFrontest);
                return panel.node;
            }
        }
        //Panel
        let tempPanel = null;
        for (const panel of this.lstPanel) {
            if (panel.node) {
                if (panel.id == id) {
                    if (id == UIID.GameLobby) {
                        this.node.emit("HOME_AGAIN", this);
                    }
                    tempPanel = panel;
                    panel.show();
                } else if (panel.node.active) {
                    panel.hide();
                }
            }
        }

        if (tempPanel?.node) {
            return tempPanel.node;
        }
    };

    public FindUIIndetify(id: UIID): UIIdentify {
        for (const panel of this.lstPanel) {
            if (panel.id == id) {
                return panel;
            }
        }
    };

    public showYesNoPopup(title: string, content: string, yesCallback, noCallback = null, txt_Yes: string = "Yes", txt_No: string = "No", isResetVisual = true): void {
        this.popup.showYesNoPopup(title, content, yesCallback, txt_Yes, txt_No, noCallback, isResetVisual);
    };

    public showNoticePopup(title = "Warning", content = "", callback = null) {
        this.popup.showOkPopup(title, content, callback);
    }

    public HideUI(id: UIID) {
        for (const panel of this.lstPanel) {
            if (panel.id == id) {
                panel.hide();
            }
        }
    }
}


