import { _decorator, AudioClip, AudioSource, Button, Component, easing, Game, game, instantiate, Label, Node, Prefab, sys, Toggle, Tween, tween, Vec3 } from 'cc';
import { Player3card } from './Player3card';
const { ccclass, property } = _decorator;

import Colyseus from 'db://colyseus-sdk/colyseus.js';
import * as GlobalVariable from '../../Common/GlobalVariable';
import { NetworkManager } from '../../Network/NetworkManager';
import GlobalEvent from '../../Common/GlobalEvent';
import { Card } from './Card';
import { warning } from '../../Common/warning';
import { LobbyManager } from '../Lobby/LobbyManager';
import { MyUserInfo } from '../../Common/MyUserInfo';
import { UIManager } from '../../Common/UIManager';
import { UIID } from '../../Common/UIID';
import { SoundManager } from '../../Common/SoundManager';

@ccclass('GameManager3card')
export class GameManager3card extends NetworkManager {

    @property([Node]) slots: Node[] = []!;
    @property(Prefab) pre_Player: Prefab;
    @property(Button) btnStartGame: Button;
    @property(Label) txt_Time: Label;
    @property(warning) sc_Warning: warning;
    @property(Label) txt_NoticeState: Label;
    @property(Button) btnPlayCard: Button;
    @property(Button) btnPassTurn: Button;
    @property(Button) btnReady: Button;
    @property({ type: Label }) txt_BtnReadyName: Label = null;
    @property(Button) btnOrder: Button;
    @property(Button) btnBaoSam: Button;
    @property(Button) btnQuitRoom: Button;
    @property(Button) btnSitDown: Button;
    @property(Button) btnStandUp: Button;
    @property(Node) obj_PopUpBaoSam: Node;
    @property(Node) obj_Disconnect: Node;
    @property({ type: Label }) txt_RoomName: Label = null;
    @property({ type: Label }) txt_RoomBetAmount: Label = null;
    @property({ type: Label }) txt_TotalPlayer: Label = null;
    @property({ type: Label }) txt_TotalSpectator: Label = null;
    @property(AudioClip) clip_Yourturn: AudioClip;
    @property(AudioClip) clip_TakeRisk: AudioClip;

    cardComponent: Card[] = [];
    @property(Node) cardParent: Node;
    @property(Prefab) pre_Card;

    client!: Colyseus.Client;
    room!: Colyseus.Room;
    myIndex: number = 0;
    myPlayer: Player3card;
    listPlayerComponent: Player3card[] = [];
    isMyturn: boolean;
    listCardChoosed = [];
    listPlayerJoinRoom = [];
    isReady = false;
    isOwner = false;

    protected onEnable(): void {

        GlobalEvent.on('swapToken', (event) => {
            try {
                this.room.send('swapToken', event)
            }
            catch { }
        }, this);

        window.onbeforeunload = () => {
            console.log("window.onbeforeunload =>", this.room);
            if (this.room && this.room.id && this.room.sessionId) {
                sys.localStorage.setItem("lastRoomId", this.room.id);
                sys.localStorage.setItem("lastSessionId", this.room.sessionId);
                sys.localStorage.setItem("reconnectionToken", this.room.reconnectionToken);
            }
        };

        game.on(Game.EVENT_HIDE, () => {
            // game chuyển sang background (tab khác, minimize window,…)
            console.log("game.EVENT_HIDE =>", this.room);
            this.requestLeaveRoom();
        });
        this.resetTextLabel();
    }

    protected onDisable(): void {
        GlobalEvent.off('swapToken')
        window.Mezon.WebView.postEvent("LEAVE_ROOM", {});
        this.resetTextLabel();
    }

    start() {

        GlobalEvent.on('custom-event', (event) => {
            if (event.action == 1) this.listCardChoosed.push(event.card)
            else this.listCardChoosed = this.listCardChoosed.filter(item => item != event.card)
            // console.log(this.listCardChoosed);
        }, this);

        GlobalEvent.on('reOrderCard_event', (event) => {
            this.listCardChoosed = []
            // console.log(this.listCardChoosed);
        }, this);

        GlobalEvent.on('ready-event', (event) => {
            this.room.send('ready', { isReady: event.ready })
        }, this);
    }



    public async createGameRoom(obj) {
        console.log("createGameRoom!", obj);
        try {
            await this.createNewRoom(
                GlobalVariable.gameRoom,
                {
                    roomName: obj.roomName,
                    betAmount: obj.betAmount,
                    userName: GlobalVariable.myMezonInfo.name,
                    userId: GlobalVariable.myMezonInfo.id,
                    avatar: GlobalVariable.myMezonInfo.avatar,
                    ownerId: GlobalVariable.myMezonInfo.id
                }, false);
            this.registerRoomEvents();
        } catch (e) {
            console.error(e);
            return false;
        }
        return true;
    }

    public async connect(name, room) {
        try {
            this.CreateClient();
            // let reconnected = await this.tryReconnect();
            // if (reconnected) return true;
            await this.joinRoom(
                room.roomId,
                {
                    userName: name,
                    avatar: GlobalVariable.myMezonInfo.avatar,
                    userId: GlobalVariable.myMezonInfo.id
                }
            );
            this.registerRoomEvents();
        } catch (e) {
            console.error(e);
            this.sc_Warning.setWarning('Đang dở ván quay lại sau nhé!')
            GlobalEvent.emit('backToLobby-event');
        }

        try {
            window.Mezon.WebView.postEvent("JOIN_ROOM", { roomId: room.roomId, roomName: 'gameroom' });
        }
        catch (e) {
            console.error(e);
        }
        return true;
    }

    /** Kiểm tra xem chính client này có đang là player trong room.state.players hay không */

    // ------------------------------------------
    // Hàm registerRoomEvents: gom các sự kiện onMessage, onLeave
    // ------------------------------------------
    private registerRoomEvents() {
        this.room.state.players.onAdd(this.addNewPlayer.bind(this), true)
        this.room.state.players.onRemove(this.removePlayer.bind(this), false)
        this.room.state.spectators.onAdd(this.renderSpectators.bind(this), false)
        this.room.state.spectators.onRemove(this.renderSpectators.bind(this), false)

        window.Mezon.WebView.onEvent('SEND_TOKEN_RESPONSE_SUCCESS', (type, data) => {
            console.log('SEND_TOKEN_RESPONSE_SUCCESS ', data)
            this.room.send("getBalance")
        });
        this.room.onMessage("balance", (value) => {
            MyUserInfo.instance.setMoney(value)
        })
        console.log("joined GAME successfully!", this.room.state.totalPlayer);
        // Lưu roomId/sessionId
        sys.localStorage.setItem("lastRoomId", this.room.id);
        sys.localStorage.setItem("lastSessionId", this.room.sessionId);
        sys.localStorage.setItem("reconnectionToken", this.room.reconnectionToken);

        this.room.onStateChange((state) => {
            this.handleState(state);
        });
        this.room.state.listen("phase", (currentValue, previousValue) => {
            if (currentValue == GamePhase.WAITING) {
                // this.room.state.listen('secondsLeft', this.updateCoutdownLabel.bind(this));
                // this.room.state.listen('timeToRisk', this.updateCoutdownLabelForTakeRisk.bind(this));
                // this.room.state.listen('currTurn', this.updateTurnLabel.bind(this));
                // this.room.state.listen('lastCards', this.showLastCard.bind(this));
            } else if (currentValue == GamePhase.ENDEDSESION) {
                // this.txt_Turn.string = (this.room.state.winner == this.room.sessionId) ? "You win" : "You lose"
            }
            this.room.state.listen('secondsLeft', this.updateCoutdownLabel.bind(this));
            this.room.state.listen('timeToRisk', this.updateCoutdownLabelForTakeRisk.bind(this));
            this.room.state.listen('currTurn', this.updateTurnLabel.bind(this));
            this.room.state.listen('lastCards', this.showLastCard.bind(this));
            this.refreshKickButtonsForAll();
            this.checkMainBtn();
            this.ShowUIState();
        });

        this.room.state.listen("roomName", (value, oldValue) => {
            this.txt_RoomName.string = 'Phòng: ' + this.room.state.roomName
        })

        this.room.state.listen("betAmount", (value, oldValue) => {
            this.txt_RoomBetAmount.string = 'Mức cược: ' + this.room.state.betAmount + ' GOLD';
        })

        this.room.onMessage("newCards", (value) => {
            this.showMyCard(value.cards)
            this.ShowUIState();
        })
        this.room.onMessage("warning", (value) => {
            this.sc_Warning.setWarning(value.message)
        })

        this.room.onMessage("noticeState", (value) => {
            console.log(value.message)
            this.txt_NoticeState.string = value.message
            if (value.hasOwnProperty("state")) {
                switch (value.state) {
                    case 1:
                        SoundManager.instance.playSfx(this.clip_TakeRisk)
                        break;
                }
            }
        })

        this.room.onMessage("invalidMove", (value) => {
            this.sc_Warning.setWarning(value.message)
        })

        this.room.onMessage("validMove", (value) => {
            this.removeMyCard(value.cards)
            this.listCardChoosed = []
            this.txt_NoticeState.string = '';
        })

        this.room.onMessage("kickResult", (data) => {
            // data.message = "Bạn đã kick player XXX thành công!"
            console.log("Kick Result: ", data.message);
            this.sc_Warning.setWarning(data.message);
        });

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

        this.room.onMessage("errorForce", (value) => {
            // this.obj_Disconnect.active = true;
            UIManager.Instance.showUI(UIID.PopupError);
        })

        this.room.onMessage('youWin', (value) => { console.log('win'); this.youWin(value) });
        this.room.onMessage('youLose', (value) => { console.log('lose'); this.youLose(value) });

        this.room.onMessage("Join", (value) => {
            console.log(">>> join " + value)
        })

        this.room.onLeave(async (code) => {
            window.Mezon.WebView.postEvent("LEAVE_ROOM", {});
            console.log("onLeave:", code);


            // Trường hợp mất kết nối bất ngờ → thử reconnect
            if (1001 <= code && 1015 >= code && code !== 1006) {
                console.log("Mất kết nối => tryReconnect");
                await this.tryReconnect();
            } else if (code === 1006) {
                UIManager.Instance.showUI(UIID.PopupError);
                // this.obj_Disconnect.active = true;
                sys.localStorage.removeItem("lastRoomId");
                sys.localStorage.removeItem("lastSessionId");
                sys.localStorage.removeItem("reconnectionToken");
                GlobalEvent.emit('backToLobby-event');
            } else if (code === 4001) {
                this.sc_Warning.setWarning("Bạn đã bị kick khỏi phòng!");
                GlobalEvent.emit('backToLobby-event');
            }
            else { // Trường hợp rời chủ động
                sys.localStorage.removeItem("lastRoomId");
                sys.localStorage.removeItem("lastSessionId");
                sys.localStorage.removeItem("reconnectionToken");
                // this.obj_Disconnect.active = true;
                GlobalEvent.emit('backToLobby-event');
            }
        });

        for (let i = 0; i < 10; i++) {
            let card_tmp = instantiate(this.pre_Card);
            let cardComponent1 = card_tmp.getComponent(Card);
            cardComponent1.setMyCard(false)
            card_tmp.parent = this.cardParent;
            this.cardComponent.push(cardComponent1)
            cardComponent1.node.active = false;
        }
    }

    // ------------------------------------------
    // Thử reconnect
    // ------------------------------------------
    public async tryReconnect() {
        const lastRoomId = sys.localStorage.getItem("lastRoomId");
        const lastSessionId = sys.localStorage.getItem("lastSessionId");
        const reconnectionToken = sys.localStorage.getItem("reconnectionToken");
        if (!lastRoomId || !lastSessionId || !reconnectionToken) {
            console.log("Không có room cũ => thoát lobby");
            // this.obj_Disconnect.active = true;
            // GlobalEvent.emit('backToLobby-event');
            return false;
        }

        try {
            // UIManager.Instance.showUI(UIID.ReconnectPopup);
            console.log("Thử reconnect =>", lastRoomId, lastSessionId, reconnectionToken);
            if (!this.client) this.CreateClient();
            const oldRoom = await this.client.reconnect(reconnectionToken);
            console.log("Reconnect thành công => oldRoom:", oldRoom);
            // UIManager.Instance.HideUI(UIID.ReconnectPopup);
            this.room = oldRoom;
            this.registerRoomEvents();
            // Hiển thị UI => 'Đang trở lại phòng...'
            // Hoặc chờ server sync state => ...
            return true;
        } catch (err) {
            console.log("Reconnect thất bại:", err);

            // Xóa localStorage
            sys.localStorage.removeItem("lastRoomId");
            sys.localStorage.removeItem("lastSessionId");
            sys.localStorage.removeItem("reconnectionToken");
            // this.obj_Disconnect.active = true;
            // GlobalEvent.emit('backToLobby-event');
            return false;
        }
    }

    handleState(state: any) {
        // this.ShowUIState(state);
    }

    updateCoutdownLabel() {
        this.txt_Time.string = Math.max(0, Math.ceil(this.room.state.secondsLeft)) + '';
    }

    updateCoutdownLabelForTakeRisk() {
        this.txt_Time.string = Math.max(0, Math.ceil(this.room.state.timeToRisk)) + '';
    }

    updateTurnLabel() {

        if (this.room.state.phase !== GamePhase.INSESSION) return;
        this.isMyturn = this.room.state.currTurn == this.myIndex;
        // console.log('cuurent turn: ', this.room.state.currTurn)

        for (let j = 0; j < this.listPlayerComponent.length; j++) {
            let turnTmp = false;
            if (this.room.state.currTurn == this.listPlayerComponent[j].myIndex) {
                turnTmp = true
                if (this.listPlayerComponent[j].sessionId == this.room.sessionId && this.room.state.phase !== GamePhase.WAITING) {
                    SoundManager.instance.playSfx(this.clip_Yourturn)
                    console.log('play sounddđ')
                }
            }
            // console.log('listPlayerComponent turn: ', this.listPlayerComponent[j].myIndex)
            this.listPlayerComponent[j].setCurrentTurn(turnTmp)
        }

        this.ShowUIState();
    }

    addNewPlayer(player, index) {
        GlobalVariable.clientNum.value = this.room.state.totalPlayer
        // console.log('adddd player', player.sessionId)
        // console.log('listPlayerJoinRoom ', this.listPlayerJoinRoom.length, " ", GlobalVariable.clientNum.value)
        this.listPlayerJoinRoom.push(player)
        console.log('addNewPlayer listPlayerJoinRoom ', this.listPlayerJoinRoom)
        if (player.sessionId == this.room.sessionId) {
            this.myIndex = player.index;
            this.isOwner = player.isOwner;
            console.log('addNewPlayer this.myIndex ', this.myIndex, this.isOwner)
            console.log('this.room.state.players.length ', this.room.state.players.length)
        }

        //remove all child this.slots and this.listPlayerComponent
        for (let i = 0; i < this.slots.length; i++) {
            this.slots[i].children.forEach((child) => {
                child.destroy();
            });
        }


        this.listPlayerComponent = []
        if (this.listPlayerJoinRoom.length == this.room.state.players.length) {
            // if (this.listPlayerJoinRoom.length == GlobalVariable.clientNum.value) {
            for (let i = 0; i < this.listPlayerJoinRoom.length; i++) {
                let validIndex = i - this.myIndex;
                if (validIndex < 0) validIndex = validIndex + this.listPlayerJoinRoom.length
                const canKick = this.isOwner && (this.listPlayerJoinRoom[i].sessionId !== this.room.sessionId && this.room.state.phase === GamePhase.WAITING);
                console.log('cankick', canKick, this.isOwner, player.sessionId, this.room.sessionId, validIndex)
                this.genTable(this.listPlayerJoinRoom[i], validIndex, i, canKick);
            }
        }

        player.listen('cardLeftNum', (value, previousValue) => {
            if (this.room.state.phase == GamePhase.INSESSION || this.room.state.phase == GamePhase.WAITFORENDSESSION || this.room.state.phase == GamePhase.WAITFORTAKERISK) {
                for (let j = 0; j < this.listPlayerComponent.length; j++) {
                    if (this.listPlayerComponent[j].sessionId == player.sessionId && player.sessionId != this.myPlayer?.sessionId) {
                        this.listPlayerComponent[j].showCardLeft(player.cardLeftNum)
                    }
                }
            }
        });

        player.listen('money', (value, previousValue) => {
            for (let j = 0; j < this.listPlayerComponent.length; j++) {
                if (this.listPlayerComponent[j].sessionId == player.sessionId) {
                    this.listPlayerComponent[j].showMoney(player.money)
                }
            }
        });

        player.listen('isOwner', (currentValue, oldValue) => {
            // Cập nhật UI (vương miện) cho player

            // Nếu player này là localPlayer => cập nhật cờ isOwner
            if (player.sessionId == this.room.sessionId) {
                console.log('isOwner ', currentValue);
                this.isOwner = currentValue;
                this.refreshKickButtonsForAll(); // Mình trở thành owner (hoặc mất owner)
            }
        });

        player.listen('isReady', (value) => {
            if (player.sessionId == this.room.sessionId && !player.isOwner) {
                if (value) {
                    this.txt_BtnReadyName.string = "Đã Sẵn Sàng!"
                } else {
                    this.txt_BtnReadyName.string = "Sẵn Sàng"
                }
            }
            for (let j = 0; j < this.listPlayerComponent.length; j++) {
                if (this.listPlayerComponent[j].sessionId == player.sessionId) {
                    this.listPlayerComponent[j]?.setIsReady(player.isReady);
                }
            }
        })

        //show money when new player joined
        for (let i = 0; i < this.room.state.players.length; i++) {
            for (let j = 0; j < this.listPlayerComponent.length; j++) {
                if (this.listPlayerComponent[j].sessionId == this.room.state.players[i].sessionId) {
                    console.log(player.money, this.listPlayerComponent[j].sessionId)
                    this.listPlayerComponent[j].showMoney(this.room.state.players[i].money)
                }
            }
        }

        this.txt_TotalPlayer.string = this.room.state.players.length || 0;
        this.checkMainBtn();
        this.ShowUIState();
    }

    removePlayer(player, index) {
        // console.log('removePlayer ', index)
        for (let j = 0; j < this.listPlayerComponent.length; j++) {
            if (this.listPlayerComponent[j].sessionId == player.sessionId) {
                let tmp = this.listPlayerComponent[j]
                this.listPlayerComponent = this.listPlayerComponent.filter(tmp => tmp.sessionId != player.sessionId)
                tmp.node.destroy()
            }
        }
        for (let j = 0; j < this.listPlayerJoinRoom.length; j++) {
            if (this.listPlayerJoinRoom[j].sessionId == player.sessionId) {
                this.listPlayerJoinRoom = this.listPlayerJoinRoom.filter(tmp => tmp.sessionId != player.sessionId)
            }
        }
        if (player.index < this.myIndex && this.myIndex > 0) this.myIndex--
        console.log('removePlayer myindex: ', this.myIndex)
        for (let j = 0; j < this.listPlayerComponent.length; j++) {
            this.listPlayerComponent[j].updateMyIndex(player.index)
            const canKick = this.isOwner && this.listPlayerComponent[j].sessionId !== this.room.sessionId && this.room.state.phase === GamePhase.WAITING;
            this.listPlayerComponent[j].initKickButton(canKick, this.onKickPlayer.bind(this));
        }

        // If the owner left, assign new owner and update icons
        const newOwner = this.room.state.players.find(p => p.isOwner);
        const newOwnerId = newOwner ? newOwner.sessionId : null;
        this.listPlayerComponent.forEach(comp => {
            comp.obj_Owner.active = (comp.sessionId === newOwnerId);
        });
        // Update local owner flag
        this.isOwner = (this.room.sessionId === newOwnerId);

        // if (this.listPlayerComponent.length <= 1) {
        //     this.obj_Disconnect.active = true;
        // }

        this.txt_TotalPlayer.string = this.room.state.players.length || 0;
        this.checkMainBtn();
        this.ShowUIState();
    }

    private renderSpectators() {
        // clear container
        console.log('renderSpectators this.room.state.spectators.length ', this.room.state.spectators.length)
        this.txt_TotalSpectator.string = this.room.state.spectators.length || 0;
        this.checkMainBtn();
    }


    showLastCard() {
        if (this.cardComponent.length == 10) {
            for (let i = 0; i < 10; i++) {
                const comp = this.cardComponent[i];
                if (i < this.room.state.lastCards.length) {
                    comp.node.active = true;
                    comp.setCard(this.room.state.lastCards[i])
                }
                else
                    comp.node.active = false;
            }
        }
        // reset về scale gốc
        tween(this.cardParent).stop();
        this.cardParent.setScale(1, 1, 1);

        // phóng to rồi về lại
        this.scheduleOnce(() => {
            tween(this.cardParent)
                .to(0.3, { scale: new Vec3(1.3, 1.3, 1.3) }, { easing: easing.quadOut })
                .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: easing.backOut })
                .start();
        }, 0);
        
        this.ShowUIState();
    }

    showMyCard(cards) {
        this.myPlayer.setCard(cards)
    }

    removeMyCard(cards) {
        this.myPlayer.removeCard(cards)
    }

    youWin(value) {
        this.sc_Warning.setWarning("You WIN " + value)
    }

    youLose(value) {
        this.sc_Warning.setWarning("You Lose " + value + " !!!")
    }

    StartGame() {
        if (this.room.state.phase != GamePhase.INSESSION) {
            for (let i = 0; i < this.listPlayerComponent.length; i++) {
                this.listPlayerComponent[i].resetToNewGame()
            }
            for (let i = 0; i < 10; i++) {
                this.cardComponent[i].node.active = false;
            }
            this.txt_NoticeState.string = ''
            this.listCardChoosed = []
            this.room.send('startGame');
        }
    }

    NewGame() {
        this.room.send('newGame');
    }

    EndGame() {
        this.room.send('endGame')
    }

    PlayYourTurn() {
        if (!this.isPlayer()) {
            // cảnh báo “Bạn phải ngồi xuống mới chơi được”
            this.sc_Warning.setWarning("Bạn đang xem, hãy Sit Down để chơi");
            return;
        }
        this.room.send('playCard', { cards: this.listCardChoosed })
    }

    PassTurn() {
        if (!this.isPlayer()) {
            // cảnh báo “Bạn phải ngồi xuống mới chơi được”
            this.sc_Warning.setWarning("Bạn đang xem, hãy Sit Down để chơi");
            return;
        }
        this.room.send('nextTurn')
    }

    Ready() {
        this.isReady = !this.isReady;
        this.txt_NoticeState.string = ''
        for (let i = 0; i < this.listPlayerComponent.length; i++) {
            this.listPlayerComponent[i].resetToNewGame()
        }
        for (let i = 0; i < 10; i++) {
            this.cardComponent[i].node.active = false;
        }
        this.listCardChoosed = []

        this.room.send('ready', { isReady: this.isReady })
    }

    OrderCard() {
        this.myPlayer.refreshOrder();
    }

    BaoSam() {
        this.obj_PopUpBaoSam.active = true;
    }

    ConfirmBaoSam() {
        if (!this.isPlayer()) {
            // cảnh báo “Bạn phải ngồi xuống mới chơi được”
            this.sc_Warning.setWarning("Bạn đang xem, hãy Sit Down để chơi");
            return;
        }
        this.room.send('baoSam')
    }

    SitDown() {
        this.room.send('sitDown');
    }

    StandUp() {
        this.room.send('standUp');
    }

    ReloadBrowser() {
        window.location.reload();
    }

    genTable(_player, _index, svIndex, canKick) {
        // console.log('gentable: ', this.room.sessionId, " ", _player.sessionId)
        let player = instantiate(this.pre_Player);
        let playerComponent = player.getComponent(Player3card);
        playerComponent.setInfo(_player.sessionId, svIndex, _player.avatar);
        playerComponent.setName(_player.userName);
        playerComponent.setOwner(_player.isOwner);
        playerComponent.showMoney(_player.money);
        playerComponent.setPositionInTable(_index);
        playerComponent.initKickButton(canKick, this.onKickPlayer.bind(this));
        // playerComponent.showCardLeft(_player.cardLeftNum);
        player.parent = this.slots[_index];
        if (this.room.sessionId == _player.sessionId) {
            this.myPlayer = playerComponent;
        }
        this.listPlayerComponent.push(playerComponent)
        this.checkMainBtn();
    }

    ShowUIState() {
        // console.log('ShowUi State ', state.phase)
        switch (this.room.state.phase) {
            case GamePhase.WAITING:
                console.log(GamePhase.WAITING, this.isPlayer(), this.room.state.players[this.myIndex]?.isOwner == true)
                if (this.isPlayer()) {
                    if (this.room.state.players[this.myIndex]?.isOwner == true) {
                        this.btnStartGame.node.active = true;
                        this.btnReady.node.active = false;
                    } else {
                        this.btnStartGame.node.active = false;
                        this.btnReady.node.active = true;
                    }
                } else {
                    this.btnStartGame.node.active = false;
                    this.btnReady.node.active = false;
                }
                this.txt_NoticeState.string = '';
                // this.btnOrder.node.active = false;
                // this.btnQuitRoom.node.active = true;
                // this.btnSitDown.node.active = !this.isPlaying();
                // this.btnStandUp.node.active = this.isPlaying();
                break;
            case GamePhase.INSESSION:
                this.isReady = false;
                this.btnStartGame.node.active = false;
                this.btnReady.node.active = false;
                // this.btnOrder.node.active = true;
                // this.btnBaoSam.node.active = false;
                this.obj_PopUpBaoSam.active = false;
                // this.btnQuitRoom.node.active = false;
                // this.btnSitDown.node.active = false;
                // this.btnStandUp.node.active = false;

                if (this.room.state.currTurn == this.myIndex && this.isPlayer()) {
                    this.btnPlayCard.node.active = true;

                    const isFirstTurn = this.room.state.lastCards.length === 0;
                    this.btnPassTurn.node.active = !isFirstTurn;
                } else {
                    this.btnPlayCard.node.active = false;
                    this.btnPassTurn.node.active = false;
                }

                if (this.room.state.lastPlayer != '') {
                    for (let j = 0; j < this.listPlayerComponent.length; j++) {
                        this.listPlayerComponent[j].setIsInRound(this.room.state.playInRound.includes(this.listPlayerComponent[j].myIndex))
                    }
                }
                break;
            case GamePhase.ENDEDSESION:
                // this.btnOrder.node.active = false;
                this.btnStartGame.node.active = false;
                // this.btnQuitRoom.node.active = false;
                // this.btnSitDown.node.active = false;
                // this.btnStandUp.node.active = false;
                break;
            case GamePhase.WAITFORENDSESSION:
                // this.btnBaoSam.node.active = false;
                this.btnPlayCard.node.active = false;
                this.btnPassTurn.node.active = false;
                this.btnStartGame.node.active = false;
                this.btnReady.node.active = false;
                // this.btnOrder.node.active = false;
                // this.btnQuitRoom.node.active = false;
                // this.btnSitDown.node.active = false;
                // this.btnStandUp.node.active = false;
                break;
            case GamePhase.WAITFORTAKERISK:
                // this.btnBaoSam.node.active = true;
                this.btnPlayCard.node.active = false;
                this.btnPassTurn.node.active = false;
                this.btnStartGame.node.active = false;
                this.btnReady.node.active = false;
                // this.btnOrder.node.active = true;
                // this.btnQuitRoom.node.active = false;
                // this.btnSitDown.node.active = false;
                // this.btnStandUp.node.active = false;
                for (let j = 0; j < this.listPlayerComponent.length; j++) {
                    this.listPlayerComponent[j].setIsInRound(true)
                }
                break;
        }
    }

    private resetTextLabel() {
        this.txt_TotalPlayer.string = '0';
        this.txt_TotalSpectator.string = '0';
    }

    async requestLeaveRoom() {
        this.room.leave();
        GlobalEvent.emit('backToLobby-event');
        this.myIndex = 0;
        this.myPlayer = null;
        this.listPlayerComponent = [];
        this.isMyturn = false;
        this.listCardChoosed = [];
        this.listPlayerJoinRoom = [];
        this.isReady = false;
        this.cardComponent = [];
        this.cardParent.children.forEach((child) => {
            child.destroy();
        });
    }

    private isPlayer(): boolean {
        return this.room.state.players.some(p => p.sessionId === this.room.sessionId);
    }

    private checkMainBtn() {
        this.btnSitDown.node.active = !this.isPlayer() && this.room.state.phase === GamePhase.WAITING;
        this.btnStandUp.node.active = this.isPlayer() && this.room.state.phase === GamePhase.WAITING;
        this.btnBaoSam.node.active = this.isPlayer() && this.room.state.phase === GamePhase.WAITFORTAKERISK;
        this.btnOrder.node.active = this.isPlayer() && (this.room.state.phase === GamePhase.INSESSION || this.room.state.phase === GamePhase.WAITFORTAKERISK);
        this.btnQuitRoom.node.active = !this.isPlayer() || this.room.state.phase === GamePhase.WAITING;

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

    private refreshKickButtonsForAll() {
        for (let i = 0; i < this.listPlayerComponent.length; i++) {
            // "player khác" => sessionId != this.room.sessionId
            const canKick = this.isOwner && this.listPlayerComponent[i].sessionId !== this.room.sessionId && this.room.state.phase === GamePhase.WAITING;
            this.listPlayerComponent[i].initKickButton(canKick, this.onKickPlayer.bind(this));
        }
    }

}

enum GamePhase {
    WAITING,
    INSESSION,
    ENDEDSESION,
    WAITFORENDSESSION,
    WAITFORTAKERISK
}
