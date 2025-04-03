import { _decorator, Component, Node, RichText, Button, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MemberUnit')
export class MemberUnit extends Component {
    @property({ type: Label }) txt_UserName: RichText = null;
    @property({ type: Node }) obj_Owner: Node = null;
    @property({ type: Node }) obj_Ready: Node = null;

    // 1) Thêm nút Kick (kéo thả trong Editor vào biến này)
    @property({ type: Button }) btn_Kick: Button = null;

    isOwner: boolean = false;
    isReady: boolean = false;
    sessionId: string = "";

    // Callback sẽ được gán từ GameRoomManager để biết "đá" ai
    private onKickCallback: (sessionId: string) => void = null;

    /**
     * Hàm cũ setName (hoặc bạn có thể đặt là initMember cũng được).
     * Ở ví dụ này, ta vẫn giữ nguyên setName, chủ yếu để gán tên và sessionId.
     */
    public setName(name: string, isOwner: boolean, sessionId: string) {
        this.txt_UserName.string = name?.length > 0 ? name : "noname";
        this.isOwner = isOwner;
        this.obj_Owner.active = isOwner;
        this.sessionId = sessionId;
    }

    public setIsReady(isReady: boolean) {
        this.isReady = isReady;
        this.obj_Ready.active = isReady;
    }

    public setOwner(isOwner: boolean) {
        this.isOwner = isOwner;
        this.obj_Owner.active = isOwner;
    }

    /**
     * Hàm mới để khởi tạo nút Kick, sẽ gọi từ GameRoomManager
     * - canKick: boolean => hiển thị hay ẩn nút Kick
     * - callback: hàm xử lý khi ấn Kick, ví dụ GameRoomManager.onKickPlayer
     */
    public initKickButton(canKick: boolean, callback: (sessionId: string) => void) {
        this.onKickCallback = callback;

        if (this.btn_Kick) {
            // Hiển thị hoặc ẩn nút Kick
            this.btn_Kick.node.active = canKick;

            // Gỡ listener cũ (nếu có) và gắn listener mới
            this.btn_Kick.node.off('click', this.onClickedKick, this);
            this.btn_Kick.node.on('click', this.onClickedKick, this);
        }
    }

    /**
     * Khi nhấn nút Kick => gọi callback
     */
    private onClickedKick() {
        if (this.onKickCallback) {
            this.onKickCallback(this.sessionId);
        }
    }
}
