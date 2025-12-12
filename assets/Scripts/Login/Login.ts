import { _decorator, assetManager, Button, Component, EditBox, ImageAsset, Label, Node, Sprite, SpriteFrame, Texture2D } from 'cc';
import { LobbyManager } from '../Room/Lobby/LobbyManager';
import * as GlobalVariable from '../Common/GlobalVariable';
import { WebRequestManager } from '../Common/WebRequestManager';
import { UserLoginDTO } from '../Common/DataDTO';
import { APIConfig } from '../Common/APIConstant';
import { MyUserInfo } from '../Common/MyUserInfo';
import { UIManager } from '../Common/UIManager';
import { UIID } from '../Common/UIID';
const { ccclass, property } = _decorator;

@ccclass('Login')
export class Login extends Component {
    @property({ type: Button }) btn_Join: Button = null;
    @property({ type: EditBox }) ip_Name: EditBox = null;
    @property({ type: LobbyManager }) lobby: LobbyManager = null;
    @property({ type: Node }) loginBoard: Node = null;
    @property({ type: Node }) lobbyNode: Node = null;

    start() {
        // this.btn_Join.node.on("click", this.join, this);
        // window.Mezon.WebView.postEvent('PING', { message: 'Hello Mezon!' });
        // window.Mezon.WebView.onEvent('PONG', () => {
        //     console.log('Hello Mezon Again!');
        // });
        // window.Mezon.WebView.onEvent('CURRENT_USER_INFO', (type, data) => {
        //     console.log(data.email);
        //     MyUserInfo.instance.setInfo(data)
        //     window.Mezon.WebView.postEvent('SEND_BOT_ID', { appId: GlobalVariable.botId });
        // });

        // window.Mezon.WebView.onEvent('USER_HASH_INFO', (type, data) => {
        //     console.log(data)
        //     let loginData = {
        //         "authData": data.message.web_app_data,
        //     }
        //     console.log(loginData)
        //     WebRequestManager.instance.loginMezon(loginData, (response) => this.onLoginSuccess(response), (error) => this.onError(error))
        // });
        try {
            let dataLogin = this.getMezonDataString(window.location.href);
            let loginData = {
                "authData": dataLogin,
            }
            WebRequestManager.instance.loginMezon(loginData, (response) => this.onLoginSuccess(response), (error) => this.onLoginError(error))
        } catch (error) {
            console.error("Error accessing Mezon.WebView:", error);
        }
    }

    private onLoginSuccess(userData: UserLoginDTO) {
        // console.log('onLoginSuccess', userData)
        APIConfig.token = userData.data.accessToken;
        this.joinByMezon()
    }
    
    private onLoginError(errorData) {
        // console.log(errorData)
        window.cocosIns.InitDone();
        UIManager.Instance.showUI(UIID.PopupError);
        // UIManager.Instance.showNoticePopup("Warning", errorData.error_message);
    }
    async join() {
        let isJoined = false;
        if (this.ip_Name.textLabel.string.trim().length !== 0) {
            GlobalVariable.myMezonInfo.name = this.ip_Name.textLabel.string.trim()
            isJoined = await this.lobby.joinLobby();
        }
        if (isJoined) {
            this.loginBoard.active = false;
            this.lobbyNode.active = true;
        }
    }

    async joinByMezon() {
        // console.log('joinByMezon')
        let isJoined = false;
        UIManager.Instance.showUI(UIID.UILeaderboard);
        isJoined = await this.lobby.joinLobby();

        if (isJoined) {
            this.loginBoard.active = false;
            this.lobbyNode.active = true;
            window.cocosIns.InitDone();
        }
    }

    getMezonDataString(href: string): string | null {
        let queryString = href.split("?").slice(1).join("&");
        queryString = queryString.replace(/\?/g, "&");
        return decodeURIComponent(decodeURIComponent(queryString.slice(5)));
    }
} 