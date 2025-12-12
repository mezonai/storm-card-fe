import { _decorator, Button, Component, EditBox, Input, instantiate, JsonAsset, Label, Node, Prefab, ScrollView } from 'cc';
const { ccclass, property } = _decorator;
import * as GlobalVariable from '../../Common/GlobalVariable';
import { NetworkManager } from '../../Network/NetworkManager';
import { MemberUnit } from './MemberUnit';
import { GameManager } from '../Game/GameManager';
import { GameManager3card } from '../Game/GameManager3card';
import { GameRoomUnit } from '../GameOnLobby/GameRoomUnit';
import { GameRoomManager } from '../GameOnLobby/GameRoomManager';
import GlobalEvent from '../../Common/GlobalEvent';
import { MyUserInfo } from '../../Common/MyUserInfo';
import { UIManager } from '../../Common/UIManager';
import { UIID } from '../../Common/UIID';

@ccclass('LobbyManager')
export class LobbyManager extends NetworkManager {
    @property({ type: Node }) obj_BtnCreate: Node = null;
    @property({ type: Node }) obj_ListRoomParent: Node = null;
    @property({ type: Prefab }) pre_RoomUnit: Prefab = null;
    @property({ type: Node }) obj_PopupCreateRoom: Node = null;
    @property({ type: EditBox }) input_RoomName: EditBox = null;
    @property({ type: EditBox }) input_RoomBetAmount: EditBox = null;
    @property({ type: EditBox }) input_RoomPass: EditBox = null;
    @property({ type: Node }) obj_LobbyRoom: Node = null;
    @property({ type: Node }) obj_GameRoom: Node = null;
    @property({ type: Node }) obj_GameRoomLobby: Node = null;
    @property({ type: GameRoomManager }) gameRomManager: GameRoomManager = null;
    @property({ type: GameManager3card }) gameManager: GameManager3card = null;
    @property(Node) obj_Disconnect: Node;
    @property([Button]) tabButtons: Button[] = [];
    @property(ScrollView) scrollView: ScrollView = null;
    @property(Label) txt_Warning: Label;
    isOwner = false;
    myIndex = 0;
    isReady = false;
    item = new Array<MemberUnit>();
    listRoomComponent = [];

    onLoad() {
        this.tabButtons.forEach((btn, index) => {
            btn.node.on('click', () => {
                this.onTabClicked(index);
            });
        });
    }

    protected onEnable(): void {
        GlobalEvent.on('swapToken', (event) => {
            try {
                this.room.send('swapToken', event)
            }
            catch (e) { }
        }, this);
    }
    protected onDisable(): void {
        GlobalEvent.off('swapToken')
    }
    protected start(): void {
        GlobalEvent.on('game_joinRoombyID', (event) => {
            this.joinRoom(event.roomId, event.roomType)
        }, this);
        GlobalEvent.on('backToLobby-event', (event) => {
            setTimeout(() => {
                // console.log('backToLobby ', event)
                this.joinLobby()
                this.obj_LobbyRoom.active = true;
                this.obj_GameRoom.active = false;
            }, 0);
        }, this);
    }
    public async joinLobby() {
        try {
            await this.createNewRoom(GlobalVariable.lobbyRoom, { userName: GlobalVariable.myMezonInfo.name, userId: GlobalVariable.myMezonInfo.id }, true);
            // console.log('this.room, ', this.room)
            this.room.state.players.onAdd(this.checkRoom.bind(this), false)
            this.room.state.players.onRemove(this.checkRoom.bind(this), false)
            window.Mezon.WebView.onEvent('SEND_TOKEN_RESPONSE_SUCCESS', (type, data) => {
                // console.log('SEND_TOKEN_RESPONSE_SUCCESS ', data)
                this.room.send("getBalance")
            });
            this.room.onLeave((code) => {
                // console.log("onLeave:", code);
                if (1001 <= code && 1015 >= code) {
                    // this.obj_Disconnect.active = true;
                    UIManager.Instance.showUI(UIID.PopupError);
                }
            });
            this.room.onMessage("balance", (value) => {
                // console.log("take balance:", value);
                MyUserInfo.instance.setMoney(value)
            })
            this.room.onMessage("roomCreated", (value) => {
                // console.log("roomCreated:", value);
                this.checkRoom();
            })
            this.room.send("getBalance")
            // let reconnected = await this.gameManager.tryReconnect();
            // if (reconnected) {
            //     this.obj_GameRoom.active = true;
            //     this.obj_LobbyRoom.active = false;
            //     // this.obj_PopupCreateRoom.active = false;
            //     UIManager.Instance.HideUI(UIID.CreateGamePopup);
            //     this.txt_Warning.string = '';
            //     this.input_RoomBetAmount.string = '';
            //     this.input_RoomName.string = '';
            // }
        } catch (e) {
            console.error(e);
            window.cocosIns.InitDone();
            UIManager.Instance.showUI(UIID.PopupError);
            return false;
        }
        return true;
    }
    async checkRoom() {
        let listRoom = await this.getRoom(GlobalVariable.gameRoom)
        this.genRoom(listRoom)
    }
    genRoom(listRoom) {
        // console.log('lít room, ', listRoom)
        listRoom = listRoom.filter(room =>
            room.clients > 0 && (room.name == GlobalVariable.gameInLobby || room.name == GlobalVariable.gameRoom)
        )
        for (let i = 0; i < listRoom.length; i++) {
            // console.log('listRoom[i] ', listRoom[i]);
            let isLock = false;
            let roomCom = this.listRoomComponent.find(obj => obj.roomId == listRoom[i].roomId);
            if (roomCom) {
                roomCom.node.active = true;
                roomCom.setRoomInfo(listRoom[i].roomId, listRoom[i].metadata?.roomName, listRoom[i].clients + '/' + listRoom[i].maxClients, isLock, listRoom[i].name, listRoom[i].metadata?.betAmount)
            } else {
                let room = instantiate(this.pre_RoomUnit);
                let roomComponent = room.getComponent(GameRoomUnit);
                roomComponent.setRoomInfo(listRoom[i].roomId, listRoom[i].metadata?.roomName, listRoom[i].clients + '/' + listRoom[i].maxClients, isLock, listRoom[i].name, listRoom[i].metadata?.betAmount)
                // console.log('new3 ', isLock)
                room.setParent(this.obj_ListRoomParent);
                this.listRoomComponent.push(roomComponent)
            }
        }
        if (listRoom.length < this.listRoomComponent.length) {
            let listIndexToRemove = []
            for (let i = 0; i < this.listRoomComponent.length; i++) {
                let roomCom = listRoom.find(obj => obj.roomId == this.listRoomComponent[i].roomId);
                if (roomCom) { }
                else {
                    listIndexToRemove.push(i)
                    this.listRoomComponent[i].node.destroy()
                }
            }
            while (listIndexToRemove.length > 0) {
                this.listRoomComponent.splice(listIndexToRemove.pop(), 1)
            }
        }
    }

    click_CreateRoom() {
        UIManager.Instance.showUI(UIID.CreateGamePopup);
        // this.obj_PopupCreateRoom.active = true;
        this.obj_BtnCreate.active = true;
    }
    click_ClosePopupRoom() {
        // this.obj_PopupCreateRoom.active = false;
        this.txt_Warning.string = '';
        this.input_RoomBetAmount.string = '';
        this.input_RoomName.string = '';
    }
    click_ConfirmCreat() {
        const value = this.input_RoomBetAmount.string.trim();
        if (!/^\d+$/.test(value)) {
            // console.warn('Mức cược chỉ được nhập số!');
            this.txt_Warning.string = 'Mức cược chỉ được nhập số!';
            return;
        }
        if (this.input_RoomName.string.trim() === "") {
            // console.warn('Bạn chưa nhập tên phòng');
            this.txt_Warning.string = 'Bạn chưa nhập tên phòng!';
            return;
        }
        if (this.input_RoomBetAmount.string.trim() === "") {
            // console.warn('Bạn chưa nhập mức cược');
            this.txt_Warning.string = 'Bạn chưa nhập mức cược!';
            return;
        }
        const betAmount = parseInt(this.input_RoomBetAmount.string.trim(), 10);
        if (isNaN(betAmount) || betAmount > GlobalVariable.maxBetAmount) {
            // console.warn('Mức cược không hợp lệ!');
            this.txt_Warning.string = 'Mức cược tối đa là 10,000!';
            return;
        }
        this.obj_BtnCreate.active = false;
        this.createRoom(this.input_RoomName.string.trim(), betAmount);
    }

    async createRoom(roomName: string, betAmount: number) {
        // this.room.send("createRoom", { roomName, betAmount })
        // this.room.leave();

        let isJoined = await this.gameManager.createGameRoom({ roomName: roomName, betAmount });
        // console.log("createGameRoom!OKKKKk", isJoined);
        if (isJoined) {
            this.obj_GameRoom.active = true;
            this.obj_LobbyRoom.active = false;
            // this.obj_PopupCreateRoom.active = false;
            UIManager.Instance.HideUI(UIID.CreateGamePopup);
            this.txt_Warning.string = '';
            this.input_RoomBetAmount.string = '';
            this.input_RoomName.string = '';
        }
    }
    async joinRoom(id, type) {
        this.room.leave();
        if (type == GlobalVariable.gameInLobby) {
            let isJoined = await this.gameRomManager.joinGameRoomInLobby_ByID(id, { userName: GlobalVariable.myMezonInfo.name, avatar: GlobalVariable.myMezonInfo.avatar });
            if (isJoined) {
                this.obj_GameRoomLobby.active = true;
                this.obj_LobbyRoom.active = false;
                this.obj_PopupCreateRoom.active = false;
            }
        } else if (type == GlobalVariable.gameRoom) {
            let isJoined = await this.gameManager.connect(GlobalVariable.myMezonInfo.name, { roomId: id });
            if (isJoined) {
                this.obj_GameRoomLobby.active = false;
                this.obj_LobbyRoom.active = false;
                this.obj_GameRoom.active = true;
                this.obj_PopupCreateRoom.active = false;
            }
        }

    }

    onTabClicked(index: number) {
        // console.log("Tab clicked:", index);

        // TODO: Load data theo tab
        // Hoặc thay content con của scroll view
        this.updateScrollContent(index);

        // Optional: đổi màu / scale tab
        this.tabButtons.forEach((btn, i) => {
            btn.interactable = i === index;
        });
    }

    updateScrollContent(tabIndex: number) {
        // Clear + load lại item trong scroll view
        // const content = this.scrollView.content;
        // content.removeAllChildren();

        // // Giả sử load 5 hàng mẫu:
        // for (let i = 0; i < 5; i++) {
        //     const item = instantiate(this.samplePrefab); // bạn phải có samplePrefab
        //     // set data vào item
        //     content.addChild(item);
        // }
    }


}