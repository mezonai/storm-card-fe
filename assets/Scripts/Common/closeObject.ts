import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('closeObject')
export class closeObject extends Component {
    @property(Node) obj: Node;

    ClosePopup() {
        this.obj.active = false;
    }
}