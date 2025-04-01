import { _decorator, AudioClip, AudioSource, Button, Component, instantiate, Label, Node, Prefab, Toggle, Tween, tween, Vec3 } from 'cc';
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
    @property(Button) btnOrder: Button;
    @property(Button) btnBaoSam: Button;
    @property(Button) btnQuitRoom: Button;
    @property(Node) obj_PopUpBaoSam: Node;
    @property(Node) obj_Disconnect: Node;
    @property(AudioSource) audioSource: AudioSource;
    @property(AudioClip) clip_Yourturn: AudioClip;
    @property(AudioClip) clip_TakeRisk: AudioClip;

    cardComponent = [];
    @property(Node) cardParent;
    @property(Prefab) pre_Card;

    client!: Colyseus.Client;
    room!: Colyseus.Room;
    myIndex: number;
    myPlayer: Player3card;
    listPlayerComponent = [];
    isMyturn: boolean;
    listCardChoosed = [];
    listPlayerJoinRoom = [];
    isReady = false;

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
        window.Mezon.WebView.postEvent("LEAVE_ROOM", {});
    }
    async requestLeaveRoom() {
        this.room.leave();
        GlobalEvent.emit('backToLobby-event');
        this.myIndex = 0
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
    public async connect(name, room) {
        try {
            await this.joinRoom(room.roomId, { userName: name, avatar: GlobalVariable.myMezonInfo.avatar, userId: GlobalVariable.myMezonInfo.id });
            this.room.state.players.onAdd(this.addNewPlayer.bind(this), false)
            this.room.state.players.onRemove(this.removePlayer.bind(this), false)
            window.Mezon.WebView.onEvent('SEND_TOKEN_RESPONSE_SUCCESS', (type, data) => {
                console.log('SEND_TOKEN_RESPONSE_SUCCESS ', data)
                this.room.send("getBalance")
            });
            this.room.onMessage("balance", (value) => {
                MyUserInfo.instance.setMoney(value)
            })
            console.log("joined GAME successfully!", this.room.state.totalPlayer);
            this.room.onStateChange((state) => {
                this.handleState(state);
            });
            this.room.state.listen("phase", (currentValue, previousValue) => {
                if (currentValue == GamePhase.WAITING) {
                    this.room.state.listen('secondsLeft', this.updateCoutdownLabel.bind(this));
                    this.room.state.listen('timeToRisk', this.updateCoutdownLabelForTakeRisk.bind(this));
                    this.room.state.listen('currTurn', this.updateTurnLabel.bind(this));
                    this.room.state.listen('lastCards', this.showLastCard.bind(this));
                } else if (currentValue == GamePhase.ENDEDSESION) {
                    // this.txt_Turn.string = (this.room.state.winner == this.room.sessionId) ? "You win" : "You lose"
                }
            });
            this.room.onMessage("newCards", (value) => {
                this.showMyCard(value.cards)
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
                            this.audioSource.playOneShot(this.clip_TakeRisk)
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
            })
            this.room.onMessage("errorForce", (value) => {
                this.obj_Disconnect.active = true;
            })

            this.room.onMessage('youWin', (value) => { console.log('win'); this.youWin(value) });
            this.room.onMessage('youLose', (value) => { console.log('lose'); this.youLose(value) });

            this.room.onMessage("Join", (value) => {
                console.log(">>> join " + value)
            })

            this.room.onLeave((code) => {
                window.Mezon.WebView.postEvent("LEAVE_ROOM", {});
                console.log("onLeave:", code);
                if (1001 <= code && 1015 >= code) {
                    this.obj_Disconnect.active = true;
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
    updateCoutdownLabel() {
        this.txt_Time.string = Math.max(0, Math.ceil(this.room.state.secondsLeft)) + '';
    }
    updateCoutdownLabelForTakeRisk() {
        this.txt_Time.string = Math.max(0, Math.ceil(this.room.state.timeToRisk)) + '';
    }
    updateTurnLabel() {
        this.isMyturn = this.room.state.currTurn == this.myIndex;
        // console.log('cuurent turn: ', this.room.state.currTurn)

        for (let j = 0; j < this.listPlayerComponent.length; j++) {
            let turnTmp = false;
            if (this.room.state.currTurn == this.listPlayerComponent[j].myIndex) {
                turnTmp = true
                if (this.listPlayerComponent[j].sessionId == this.room.sessionId) {
                    this.audioSource.playOneShot(this.clip_Yourturn)
                    console.log('play sounddđ')
                }
            }
            // console.log('listPlayerComponent turn: ', this.listPlayerComponent[j].myIndex)
            this.listPlayerComponent[j].setCurrentTurn(turnTmp)
        }
    }
    addNewPlayer(player, index) {
        GlobalVariable.clientNum.value = this.room.state.totalPlayer
        // console.log('adddd player', player.sessionId)
        // console.log('listPlayerJoinRoom ', this.listPlayerJoinRoom.length, " ", GlobalVariable.clientNum.value)
        this.listPlayerJoinRoom.push(player)
        console.log('listPlayerJoinRoom ', this.listPlayerJoinRoom)
        if (player.sessionId == this.room.sessionId) {
            this.myIndex = player.index;
            console.log('this.myIndex ', this.myIndex)
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
                this.genTable(this.listPlayerJoinRoom[i], validIndex, i);
            }
        }

        player.listen('cardLeftNum', (value, previousValue) => {
            if (this.room.state.phase == GamePhase.INSESSION || this.room.state.phase == GamePhase.WAITFORENDSESSION || this.room.state.phase == GamePhase.WAITFORTAKERISK)
                for (let j = 0; j < this.listPlayerComponent.length; j++) {
                    if (this.listPlayerComponent[j].sessionId == player.sessionId && player.sessionId != this.myPlayer.sessionId) {
                        this.listPlayerComponent[j].showCardLeft(player.cardLeftNum)
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
        player.listen('isReady', (value) => {
            for (let j = 0; j < this.listPlayerComponent.length; j++) {
                if (this.listPlayerComponent[j].sessionId == player.sessionId) {
                    this.listPlayerComponent[j]?.setIsReady(player.isReady);
                }
            }
        })

        //show money when new player joined
        for (let i = 0; i < this.room.state.players.length; i++)
            for (let j = 0; j < this.listPlayerComponent.length; j++) {
                if (this.listPlayerComponent[j].sessionId == this.room.state.players[i].sessionId) {
                    console.log(player.money, this.listPlayerComponent[j].sessionId)
                    this.listPlayerComponent[j].showMoney(this.room.state.players[i].money)
                }
            }
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
        console.log('myindex: ', this.myIndex)
        for (let j = 0; j < this.listPlayerComponent.length; j++) {
            this.listPlayerComponent[j].updateMyIndex(player.index)
        }
        // if (this.listPlayerComponent.length <= 1) {
        //     this.obj_Disconnect.active = true;
        // }
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
    handleState(state: any) {
        this.ShowUIState(state);
    }

    genTable(_player, _index, svIndex) {
        // console.log('gentable: ', this.room.sessionId, " ", _player.sessionId)
        let player = instantiate(this.pre_Player);
        let playerComponent = player.getComponent(Player3card);
        playerComponent.setInfo(_player.sessionId, svIndex, _player.avatar)
        playerComponent.setName(_player.userName)
        playerComponent.setPositionInTable(_index)
        player.parent = this.slots[_index];
        if (this.room.sessionId == _player.sessionId) {
            this.myPlayer = playerComponent;
        }
        this.listPlayerComponent.push(playerComponent)
    }
    showLastCard() {
        if (this.cardComponent.length == 10)
            for (let i = 0; i < 10; i++) {
                if (i < this.room.state.lastCards.length) {
                    this.cardComponent[i].node.active = true;
                    this.cardComponent[i].setCard(this.room.state.lastCards[i])
                }
                else
                    this.cardComponent[i].node.active = false;
            }
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
        this.room.send('playCard', { cards: this.listCardChoosed })
    }
    PassTurn() {
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
        this.room.send('baoSam')
    }
    ReloadBrowser() {
        window.location.reload();
    }

    ShowUIState(state) {
        switch (state.phase) {
            case GamePhase.WAITING:
                console.log(GamePhase.WAITING)
                if (this.room.state.players[this.myIndex].isOwner == true) {
                    this.btnStartGame.node.active = true;
                    this.btnReady.node.active = false;
                } else {
                    this.btnStartGame.node.active = false;
                    this.btnReady.node.active = true;
                }
                this.btnOrder.node.active = false;
                this.btnQuitRoom.node.active = true;
                break;
            case GamePhase.INSESSION:
                this.isReady = false;
                this.btnStartGame.node.active = false;
                this.btnReady.node.active = false;
                this.btnOrder.node.active = true;
                this.btnBaoSam.node.active = false;
                this.obj_PopUpBaoSam.active = false;
                this.btnQuitRoom.node.active = false;

                if (state.currTurn == this.myIndex) {
                    this.btnPlayCard.node.active = true;
                    this.btnPassTurn.node.active = true;
                } else {
                    this.btnPlayCard.node.active = false;
                    this.btnPassTurn.node.active = false;
                }

                if (this.room.state.lastPlayer != '')
                    for (let j = 0; j < this.listPlayerComponent.length; j++) {
                        this.listPlayerComponent[j].setIsInRound(this.room.state.playInRound.includes(this.listPlayerComponent[j].myIndex))
                    }
                break;
            case GamePhase.ENDEDSESION:
                this.btnOrder.node.active = false;
                this.btnStartGame.node.active = false;
                this.btnQuitRoom.node.active = false;
                break;
            case GamePhase.WAITFORENDSESSION:
                this.btnBaoSam.node.active = false;
                this.btnPlayCard.node.active = false;
                this.btnPassTurn.node.active = false;
                this.btnStartGame.node.active = false;
                this.btnReady.node.active = false;
                this.btnOrder.node.active = false;
                this.btnQuitRoom.node.active = false;
                break;
            case GamePhase.WAITFORTAKERISK:
                this.btnBaoSam.node.active = true;
                this.btnPlayCard.node.active = false;
                this.btnPassTurn.node.active = false;
                this.btnStartGame.node.active = false;
                this.btnReady.node.active = false;
                this.btnOrder.node.active = true;
                this.btnQuitRoom.node.active = false;
                for (let j = 0; j < this.listPlayerComponent.length; j++) {
                    this.listPlayerComponent[j].setIsInRound(true)
                }
                break;
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
