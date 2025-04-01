import { _decorator, Button, Component, EditBox, Input, instantiate, JsonAsset, Label, Node, Prefab } from 'cc';
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

@ccclass('LobbyManager')
export class LobbyManager extends NetworkManager {
    @property({ type: Node }) obj_BtnCreate: Node = null;
    @property({ type: Node }) obj_ListRoomParent: Node = null;
    @property({ type: Prefab }) pre_RoomUnit: Prefab = null;
    @property({ type: Node }) obj_PopupCreateRoom: Node = null;
    @property({ type: EditBox }) input_RoomName: EditBox = null;
    @property({ type: EditBox }) input_RoomPass: EditBox = null;
    @property({ type: Node }) obj_LobbyRoom: Node = null;
    @property({ type: Node }) obj_GameRoom: Node = null;
    @property({ type: Node }) obj_GameRoomLobby: Node = null;
    @property({ type: GameRoomManager }) gameRomManager: GameRoomManager = null;
    @property({ type: GameManager3card }) gameManager: GameManager3card = null;
    @property(Node) obj_Disconnect: Node;
    isOwner = false;
    myIndex = 0;
    isReady = false;
    item = new Array<MemberUnit>();
    listRoomComponent = [];
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
                console.log('backToLobby ', event)
                this.joinLobby()
                this.obj_LobbyRoom.active = true;
                this.obj_GameRoom.active = false;
            }, 0);
        }, this);
    }
    public async joinLobby() {
        try {
            await this.createNewRoom(GlobalVariable.lobbyRoom, { userName: GlobalVariable.myMezonInfo.name, userId: GlobalVariable.myMezonInfo.id }, true);
            this.room.state.players.onAdd(this.checkRoom.bind(this), false)
            this.room.state.players.onRemove(this.checkRoom.bind(this), false)
            window.Mezon.WebView.onEvent('SEND_TOKEN_RESPONSE_SUCCESS', (type, data) => {
                console.log('SEND_TOKEN_RESPONSE_SUCCESS ', data)
                this.room.send("getBalance")
            });
            this.room.onLeave((code) => {
                console.log("onLeave:", code);
                if (1001 <= code && 1015 >= code) {
                    this.obj_Disconnect.active = true;
                }
            });
            this.room.onMessage("balance", (value) => {
                MyUserInfo.instance.setMoney(value)
            })
            this.room.send("getBalance")
        } catch (e) {
            console.error(e);
            return false;
        }
        return true;
    }
    async checkRoom() {
        let listRoom = await this.getRoom()
        this.genRoom(listRoom)
    }
    genRoom(listRoom) {
        // console.log('lít room, ', listRoom)
        listRoom = listRoom.filter(room =>
            room.clients > 0 && (room.name == GlobalVariable.gameInLobby || room.name == GlobalVariable.gameRoom)
        )
        for (let i = 0; i < listRoom.length; i++) {
            let isLock = false;
            let roomCom = this.listRoomComponent.find(obj => obj.roomId == listRoom[i].roomId);
            if (roomCom) {
                roomCom.node.active = true;
                roomCom.setRoomInfo(listRoom[i].roomId, listRoom[i].metadata?.roomName, listRoom[i].clients + '/' + listRoom[i].maxClients, isLock, listRoom[i].name)
            } else {
                let room = instantiate(this.pre_RoomUnit);
                let roomComponent = room.getComponent(GameRoomUnit);
                roomComponent.setRoomInfo(listRoom[i].roomId, listRoom[i].metadata?.roomName, listRoom[i].clients + '/' + listRoom[i].maxClients, isLock, listRoom[i].name)
                console.log('new3 ', isLock)
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
        this.obj_PopupCreateRoom.active = true;
        this.obj_BtnCreate.active = true;
    }
    click_ClosePopupRoom() {
        this.obj_PopupCreateRoom.active = false;
    }
    click_ConfirmCreat() {
        if (this.input_RoomName.string.trim() != "") {
            this.obj_BtnCreate.active = false;
            this.creatRoom(this.input_RoomName.string.trim())
        }
    }

    async creatRoom(roomName) {
        this.room.send("creatRoom", { roomName: roomName })
        this.room.leave();

        let isJoined = await this.gameRomManager.joinGameRoomInLobby({ roomName: roomName, userName: GlobalVariable.myMezonInfo.name });
        if (isJoined) {
            this.obj_GameRoomLobby.active = true;
            this.obj_LobbyRoom.active = false;
            this.obj_PopupCreateRoom.active = false;
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
}