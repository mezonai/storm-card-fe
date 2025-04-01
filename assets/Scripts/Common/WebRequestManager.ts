import { _decorator, Component, Node } from 'cc';
import { APIManager } from './APIManager';
import APIConstant from './APIConstant';
const { ccclass, property } = _decorator;

@ccclass('WebRequestManager')
export class WebRequestManager extends Component {
    private static _instance: WebRequestManager = null;
    public static get instance(): WebRequestManager {
        return WebRequestManager._instance
    }
    onLoad() {
        if (WebRequestManager._instance == null) {
            WebRequestManager._instance = this;
        }
    }
    private combineWithSlash(...params: string[]): string {
        return params.join('/');
    }
    public loginMezon(data, successCallback, errorCallback) {
        APIManager.postData(this.combineWithSlash(APIConstant.USER, APIConstant.LOGIN_MEZON), data, (data) => { this.onSuccessHandler(data, successCallback, errorCallback); }, (data) => { this.onErrorHandler(data, errorCallback); }, false);
    }
    private onSuccessHandler(response, onSuccess: (response: string) => void, onError, needShowPopupWhenError: boolean = true) {
        if (!response.error_message) {
            onSuccess(response);
        } else {
            if (needShowPopupWhenError) {
                this.onErrorHandler(JSON.stringify(response), onError);
            }
        }
    }

    private onErrorHandler(response, onError) {
        console.log(response)
        let json = JSON.parse(response);
        if (this.errorMessageMap.has(json.error_code)) {
            json.error_message = this.errorMessageMap.get(json.error_code) || '';
            // this.errorPanel.node.active = true;
            // this.errorPanel.node.setSiblingIndex(this.errorPanel.node.parent.children.length - 1);
            if (json.error_code == 401) {
                // this.errorPanel.showOkPopup("Warning", json.error_message, () => {
                //     this.projectRoot.relogin();
                // }, "Login Again?");
            }
            else {
                // this.errorPanel.showOkPopup("Warning", json.error_message);
            }
        }

        onError(json);
    }
    private errorMessageMap: Map<number, string> = new Map([
        [400, 'Bad Request'],
        [401, 'Unauthorized'],
        [403, 'Forbidden'],
        [404, 'Not Found'],
        [500, 'Internal Server Error'],
        [502, 'Bad Gateway'],
        [503, 'Service Unavailable'],
        [504, 'Gateway Timeout'],
        [5, "Wrong Username or Password"],
        [12, "Not Enough Coin"],
        [17, "Insufficient Resource"],
        [19, "Quest Not Completed"],
        [22, "Invalid Quest"],
        [24, "Quest Already Claimed"],
        [23, "Quest Not Completed"],
        [36, "Mission Not Completed"]
    ]);
}


