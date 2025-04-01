import { _decorator, Button, Component, Label, Node, RichText } from 'cc';
import GlobalEvent from '../../Common/GlobalEvent';
const { ccclass, property } = _decorator;

@ccclass('GameRoomUnit')
export class GameRoomUnit extends Component {
    @property({ type: Label }) txt_RoomName: Label = null;
    @property({ type: Label }) txt_ClientNum: Label = null;
    @property({ type: Label }) txt_Type: Label = null;
    @property({ type: Node }) obj_Lock: Node = null;
    @property({ type: Button }) btn: Button;
    roomId;
    roomType;
    isLock;
    setRoomInfo(id, name, clientNum, isLock, type) {
        this.roomId = id;
        this.roomType = type;
        this.txt_RoomName.string = name;
        this.txt_ClientNum.string = clientNum;
        this.obj_Lock.active = isLock;
        this.isLock = isLock;
        if (isLock) {
            this.btn.interactable = false;
        } else
            this.btn.interactable = true;
        this.txt_Type.string = type;
    }

    JoinRoom() {
        if (!this.isLock) {
            GlobalEvent.emit('game_joinRoombyID', { roomId: this.roomId, roomType: this.roomType });
            this.node.active = false;
        }
    }
}