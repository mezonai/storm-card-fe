import { _decorator, Button, Component, instantiate, Label, Node, Prefab, tween, Tween, Vec3, sys } from 'cc';
import { GameManager3card } from '../Game/GameManager3card';
import { MemberUnit } from '../Lobby/MemberUnit';
import { NetworkManager } from '../../Network/NetworkManager';
import * as GlobalVariable from '../../Common/GlobalVariable';
import GlobalEvent from '../../Common/GlobalEvent';
import { warning } from '../../Common/warning';
import { MyUserInfo } from '../../Common/MyUserInfo';
import { LobbyManager } from '../Lobby/LobbyManager';
const { ccclass, property } = _decorator;

@ccclass('GameRoomManager')
export class GameRoomManager extends NetworkManager {
    @property({ type: Button }) btn_Ready: Button = null;
    @property({ type: Button }) btn_Start: Button = null;
    @property({ type: Button }) btn_Out: Button = null;
    @property({ type: Label }) txt_BtnName: Label = null;
    @property({ type: Node }) obj_ListMem: Node = null;
    @property({ type: Prefab }) obj_MemberUnit: Prefab = null;
    @property({ type: GameManager3card }) gameManager: GameManager3card = null;
    @property({ type: Node }) obj_Game: Node = null;
    @property({ type: Node }) obj_GameRoomLobby: Node = null;
    @property({ type: Node }) obj_Lobby: Node = null;
    @property({ type: Label }) txt_RoomName: Label = null;
    @property(Node) obj_Disconnect: Node;
    @property({ type: warning }) sc_Warning: warning = null;
    isOwner = false;
    myIndex = 0;
    isReady = false;
    item = new Array<MemberUnit>();

    protected onEnable(): void {
        GlobalEvent.on('swapToken', (event) => {
            try {
                this.room.send('swapToken', event)
            }
            catch { }
        }, this);
    }
    protected onDisable(): void {
        GlobalEvent.off('swapToken')
    }

    protected start(): void {
        this.btn_Ready.node.on('click', this.ready, this)
        this.btn_Start.node.on('click', this.startGame, this)
    }

    async requestLeaveRoom() {
        this.room.leave();
        GlobalEvent.emit('backToLobby-event');
        this.obj_GameRoomLobby.active = false;
        this.obj_Lobby.active = true;
        this.resetRoom()
    }

    resetRoom() {
        this.obj_ListMem.children.forEach((child) => {
            child.destroy();
        });
        this.item = new Array<MemberUnit>();
    }

    // ------------------------------------------
    // Tạo room (Lúc joinGameRoomInLobby) => Lưu roomId/sessionId => Đăng ký event
    // ------------------------------------------
    public async joinGameRoomInLobby(obj) {
        try {
            this.btn_Out.node.on('click', this.requestLeaveRoom, this)
            await this.createNewRoom(GlobalVariable.gameInLobby, { roomName: obj.roomName, betAmount: obj.betAmount, userName: GlobalVariable.myMezonInfo.name, userId: GlobalVariable.myMezonInfo.id, avatar: GlobalVariable.myMezonInfo.avatar }, false);
            console.log("joined successfully!", this.room);
            window.Mezon.WebView.onEvent('SEND_TOKEN_RESPONSE_SUCCESS', (type, data) => {
                console.log('SEND_TOKEN_RESPONSE_SUCCESS ', data)
                this.room.send("getBalance")
            });
            this.room.onMessage("warning", (value) => {
                this.sc_Warning.setWarning(value.message)
            })
            this.room.onMessage("joinRoomGame", (roomInfo) => {
                this.room.leave();
                console.log("request join roooom 1  " + roomInfo)
                this.obj_Game.active = true;
                this.obj_GameRoomLobby.active = false;
                this.gameManager.connect(obj.userName, roomInfo);
            })
            this.room.onMessage("balance", (value) => {
                MyUserInfo.instance.setMoney(value)
            })


            this.room.onMessage("kickResult", (data) => {
                // data.message = "Bạn đã kick player XXX thành công!"
                console.log("Kick Result: ", data.message);
                this.sc_Warning.setWarning(data.message);
            });

            this.room.state.listen("roomName", (value, oldValue) => {
                this.txt_RoomName.string = 'Phòng: ' + this.room.state.roomName
            })
            this.room.send("getBalance")

            this.room.state.players.onAdd(this.addNewClient.bind(this), false)
            this.room.state.players.onRemove(this.reMoveClient.bind(this), false)
            this.room.onLeave((code) => {
                this.resetRoom()
                console.log("onLeave:", code);
                if (1001 <= code && 1015 >= code) {
                    this.obj_Disconnect.active = true;
                }
            });
        } catch (e) {
            console.error(e);
            return false;
        }
        return true;
    }

    //join by id
    public async joinGameRoomInLobby_ByID(id, options) {
        try {
            this.btn_Out.node.on('click', this.requestLeaveRoom, this)
            await this.joinRoom(id, { userName: GlobalVariable.myMezonInfo.name, avatar: GlobalVariable.myMezonInfo.avatar, roomName: 'default', userId: GlobalVariable.myMezonInfo.id });
            this.txt_RoomName.string = 'Phòng: ' + this.room.state.roomName
            window.Mezon.WebView.onEvent('SEND_TOKEN_RESPONSE_SUCCESS', (type, data) => {
                console.log('SEND_TOKEN_RESPONSE_SUCCESS ', data)
                this.room.send("getBalance")
            });
            console.log("joined successfully!");
            this.room.onMessage("warning", (value) => {
                this.sc_Warning.setWarning(value.message)
            })
            this.room.onMessage("joinRoomGame", (roomInfo) => {
                this.room.leave();
                console.log("request join roooom 2  " + roomInfo)
                this.obj_Game.active = true;
                this.obj_GameRoomLobby.active = false;
                this.gameManager.connect(options.userName, roomInfo);
            })
            this.room.onMessage("balance", (value) => {
                MyUserInfo.instance.setMoney(value)
            })

            this.room.onMessage("kicked", (data) => {
                // data.message = "Bạn đã bị kick khỏi phòng bởi ..."
                console.log("Server báo mình bị kick: ", data.message);

                // Hiển thị cảnh báo
                this.sc_Warning.setWarning(data.message);

                // Sau đó có thể tự rời phòng
                // (Phòng này server đã gọi leave() phía server, client sớm muộn cũng onLeave.
                //  Nhưng nếu bạn muốn về ngay Lobby, có thể gọi requestLeaveRoom() hoặc code custom.)

                // requestLeaveRoom() => Sau khi rời phòng, back về danh sách phòng, v.v.
                this.requestLeaveRoom();
            });

            this.room.state.listen("roomName", (value, oldValue) => {
                this.txt_RoomName.string = 'Phòng: ' + this.room.state.roomName
            })
            // this.room.send("getBalance")

            this.room.state.players.onAdd(this.addNewClient.bind(this), false)
            this.room.state.players.onRemove(this.reMoveClient.bind(this), false)

            this.room.onLeave((code) => {
                this.resetRoom()
                console.log("onLeave:", code);
                // Kiểm tra code = 4001 => bị kick
                if (code === 4001) {
                    this.sc_Warning.setWarning("Bạn đã bị kick khỏi phòng!");
                }
            });
        } catch (e) {
            console.error(e);
            return false;
        }
        return true;
    }

    addNewClient(player, index) {
        let obj = instantiate(this.obj_MemberUnit);
        let memberUnit = obj.getComponent(MemberUnit);
        // Gán thông tin
        memberUnit.setName(player.userName, player.isOwner, player.sessionId);
        // obj.getComponent(MemberUnit).setName(player.userName, player.isOwner, player.sessionId);

        // Xem localPlayer (mình) có phải owner không => hiển thị nút Kick (nếu player kia != mình)
        const canKick = this.isOwner && (player.sessionId !== this.room.sessionId);
        memberUnit.initKickButton(canKick, this.onKickPlayer.bind(this));

        obj.parent = this.obj_ListMem;
        // this.room.send('setIndex', { index: index })
        this.item.push(memberUnit);

        if (player.sessionId == this.room.sessionId) {
            this.myIndex = index;
            this.isOwner = player.isOwner; // Lúc mới join, nếu mình là người đầu -> isOwner = true
        }
        // Theo dõi khi player này thay đổi isOwner
        player.listen('isOwner', (currentValue, oldValue) => {
            // Cập nhật UI (vương miện) cho player
            memberUnit.setOwner(currentValue);

            // Nếu player này là localPlayer => cập nhật cờ isOwner
            if (player.sessionId == this.room.sessionId) {
                this.isOwner = currentValue;  // Mình trở thành owner (hoặc mất owner)
                // Chủ phòng => Hiện nút Start, ẩn nút Ready
                if (this.isOwner) {
                    this.btn_Start.node.active = true;
                    this.btn_Ready.node.active = false;
                } else {
                    this.btn_Start.node.active = false;
                    this.btn_Ready.node.active = true;
                }
                // Refresh lại nút Kick trên tất cả MemberUnit
                this.refreshKickButtonsForAll();
            }
        });

        // Theo dõi khi player này thay đổi isReady
        player.listen('isReady', (value, oldValue) => {
            if (player.sessionId == this.room.sessionId && !player.isOwner) {
                if (value) {
                    this.txt_BtnName.string = "Đã Sẵn Sàng!"
                } else {
                    this.txt_BtnName.string = "Sẵn Sàng"
                }
            }
            // Cập nhật UI
            memberUnit.setIsReady(value);
        });
    }

    reMoveClient(player, index) {
        for (let i = 0; i < this.item.length; i++) {
            if (this.item[i].sessionId == player.sessionId) {
                this.item[i].node.destroy()
                this.item = this.item.filter(item => item.sessionId != player.sessionId)
                return;
            }
        }

        // show owner
        for (let i = 0; i < this.room.state.players.length; i++) {
            for (let j = 0; j < this.item.length; j++) {

            }
            if (this.item[i].sessionId == player.sessionId) {
                this.item[i].node.destroy()
                this.item = this.item.filter(item => item.sessionId != player.sessionId)
                return;
            }
        }
    }

    ready() {
        this.isReady = !this.isReady;
        this.room.send('ready', { isReady: this.isReady })
    }
    startGame() {
        // let canStart = true;
        // for (let i = 0; i < this.item.length; i++) {
        //     if (!this.item[i].isOwner && !this.item[i].isReady) canStart = false;
        // }
        // if (canStart) {
        this.room.send('gotoGame')
        // }
    }

    // Ví dụ hàm callback Kick:
    private onKickPlayer(sessionIdToKick: string) {
        // Kiểm tra chắc chắn localPlayer là owner
        if (!this.isOwner) {
            this.sc_Warning.setWarning("Bạn không phải chủ phòng!");
            return;
        }
        // Gửi lên server
        this.room.send("kickPlayer", { sessionIdToKick });
    }

    /**
     * Hàm này để cập nhật nút Kick trên tất cả MemberUnit
     * (trong trường hợp localPlayer vừa được setOwner = true).
     */
    private refreshKickButtonsForAll() {
        for (let i = 0; i < this.item.length; i++) {
            // "player khác" => sessionId != this.room.sessionId
            const canKick = this.isOwner && this.item[i].sessionId !== this.room.sessionId;
            this.item[i].initKickButton(canKick, this.onKickPlayer.bind(this));
        }
    }
}