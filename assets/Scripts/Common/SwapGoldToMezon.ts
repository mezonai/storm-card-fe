import { _decorator, Button, Component, EditBox, Label, Node } from 'cc';
import { IAPManager } from '../IAP/IAPManager';
const { ccclass, property } = _decorator;

@ccclass('SwapGoldToMezon')
export class SwapGoldToMezon extends Component {
    @property({ type: EditBox }) ip_Number: EditBox = null;
    @property({ type: IAPManager }) apiManager: IAPManager = null;

    onClick() {
        if (this.ip_Number.string.trim().length > 0) {
            this.apiManager.getMezon(this.ip_Number.string)
        }
    }
}