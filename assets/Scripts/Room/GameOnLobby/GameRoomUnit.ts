import { _decorator, Button, Component, Label, Node, RichText, Sprite, SpriteFrame } from 'cc';
import GlobalEvent from '../../Common/GlobalEvent';
const { ccclass, property } = _decorator;

@ccclass('GameRoomUnit')
export class GameRoomUnit extends Component {
    @property({ type: Label }) txt_RoomName: Label = null;
    @property({ type: Label }) txt_ClientNum: Label = null;
    @property({ type: Label }) txt_no: Label = null;
    @property({ type: Label }) txt_betAmount: Label = null;
    @property({ type: Node }) obj_Lock: Node = null;
    @property({ type: Button }) btn: Button;
    @property({ type: Node })
    clientSlotsNode: Node = null; // Node chứa các icon sprite

    @property({ type: SpriteFrame })
    slotActiveSprite: SpriteFrame = null;

    @property({ type: SpriteFrame })
    slotInactiveSprite: SpriteFrame = null;
    
    roomId;
    roomType;
    isLock;
    setRoomInfo(id, name, clientNum, isLock, type, betAmount) {
        this.roomId = id;
        this.roomType = type;
        this.txt_RoomName.string = name;
        // this.txt_ClientNum.string = clientNum;
        this.setClientDisplay(clientNum);
        this.txt_betAmount.string = betAmount + ' GOLD';
        this.obj_Lock.active = isLock;
        this.isLock = isLock;
        if (isLock) {
            this.btn.interactable = false;
        } else
            this.btn.interactable = true;
        this.txt_no.string = id;
    }

    JoinRoom() {
        if (!this.isLock) {
            GlobalEvent.emit('game_joinRoombyID', { roomId: this.roomId, roomType: this.roomType });
            this.node.active = false;
        }
    }

    setClientDisplay(clientNumStr: string) {
        const [joinedStr, maxStr] = clientNumStr.split('/');
        const joined = parseInt(joinedStr, 10);
        const max = parseInt(maxStr, 10);

        if (isNaN(joined) || isNaN(max)) {
            return;
        }

        const children = this.clientSlotsNode.children;

        for (let i = 0; i < children.length; i++) {
            const sprite = children[i].getComponent(Sprite);
            if (sprite) {
                sprite.spriteFrame = i < joined ? this.slotActiveSprite : this.slotInactiveSprite;
            }
            children[i].active = i < max; // ẩn nếu không dùng
        }
    }
}