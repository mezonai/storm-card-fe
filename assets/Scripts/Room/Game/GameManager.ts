import { _decorator, Component, EventKeyboard, Input, input, KeyCode, Label, math, Node, ProgressBar, Sprite } from 'cc';
const { ccclass, property } = _decorator;

import Colyseus from 'db://colyseus-sdk/colyseus.js';
import * as GlobalVariable from '../../Common/GlobalVariable';
import { NetworkManager } from '../../Network/NetworkManager';

@ccclass('GameManager')
export class GameManager extends NetworkManager {
    @property([Node]) obj11: Node[] = []!;
    @property({ type: Label }) txt_Time: Label = null;
    @property({ type: Label }) txt_Turn: Label = null;
    @property({ type: ProgressBar }) pgPower: ProgressBar = null;
    @property({ type: Node }) obj_Projectile: Node = null;

    client!: Colyseus.Client;
    room!: Colyseus.Room;
    myIndex: number;
    faceDirection: number;
    isMoving: boolean;
    isMyturn: boolean;

    isCharging: boolean;
    powerRatio: number;
    speedStakePower: number = 1;
    canCharging: boolean;

    private _myMoveDirection: number = 0;
    public get myMoveDirection(): number {
        return this._myMoveDirection;
    }
    public set myMoveDirection(value: number) {
        let isValueChange = (this._myMoveDirection != value);
        this._myMoveDirection = value;
        if (isValueChange) {
            if (value != 0) this.requestmove(value);
            else this.requeststopmove();
        }
    }

    start() {
        //    this.connect();
    }
    protected onEnable(): void {
        input.on(Input.EventType.KEY_DOWN, this.onkeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onkeyUp, this);
    }
    protected onDisable(): void {
        input.off(Input.EventType.KEY_DOWN, this.onkeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onkeyUp, this);
    }
    onkeyDown(e: EventKeyboard) {
        if (e.keyCode == KeyCode.ARROW_LEFT) {
            if (this.myMoveDirection == 1) this.myMoveDirection = 0;
            else this.myMoveDirection = -1;
        }
        if (e.keyCode == KeyCode.ARROW_RIGHT) {
            if (this.myMoveDirection == -1) this.myMoveDirection = 0;
            else this.myMoveDirection = 1;
        }
        if (e.keyCode == KeyCode.SPACE) {
            if (this.isMyturn) {
                this.isCharging = true;
                this.canCharging = false;
            }
        }
    }
    onkeyUp(e: EventKeyboard) {
        if (e.keyCode == KeyCode.ARROW_LEFT) {
            if (this.myMoveDirection == -1) this.myMoveDirection = 0;
        }
        if (e.keyCode == KeyCode.ARROW_RIGHT) {
            if (this.myMoveDirection == 1) this.myMoveDirection = 0;
        }
        if (e.keyCode == KeyCode.SPACE) {
            if (this.isMyturn) {
                this.isCharging = false;
                this.canCharging = false;
                let angle = this.faceDirection * 60;
                this.requestFire(angle, this.powerRatio);
                this.powerRatio = 0;
            }
        }
    }
    requestmove(direction) {
        this.room.send('start-move', { direction: direction });
    }
    requeststopmove() {
        this.room.send('stop');
    }
    requestFire(anglex, power) {
        this.room.send('fire', {
            angle: anglex,
            powerRatio: power,
        })
    }
    protected update(dt: number): void {
        if (this.isCharging) {
            this.powerRatio += dt * this.speedStakePower;
            this.powerRatio = Math.min(1, this.powerRatio);
            this.pgPower.progress = this.powerRatio;
        } else {
            this.powerRatio = 0;
            this.pgPower.progress = 0;
        }
    }
    public async connect(name, room) {
        try {
            await this.createNewRoom(GlobalVariable.gameRoom, { userName: name }, false);
            this.room = await this.client.joinOrCreate(GlobalVariable.gameRoom, { userName: name });
            this.room.state.players.onAdd(this.addNewPlayer.bind(this), false)
            // this.room = await this.client.consumeSeatReservation(room);
            // this.room = await this.client.consumeSeatReservation(room);
            console.log("joined successfully!");
            this.room.onStateChange((state) => {
                this.genTable(state);
            });

            this.room.state.listen("phase", (currentValue, previousValue) => {
                if (currentValue == GamePhase.WAITING) {
                    this.room.state.listen('secondsLeft', this.updateCoutdownLabel.bind(this));
                    this.room.state.listen('currTurn', this.updateTurnLabel.bind(this));
                } else if (currentValue == GamePhase.ENDED) {
                    this.txt_Turn.string = (this.room.state.winner == this.room.sessionId) ? "You win" : "You lose"
                }
            });

            this.room.onMessage("MESSAGE", (value) => {
                console.log(">>> MESSAGE " + value)
            })
            this.room.onMessage("Join", (value) => {
                console.log(">>> join " + value)
            })

            this.room.onLeave((code) => {
                console.log("onLeave:", code);
            });
        } catch (e) {
            console.error(e);
        }
    }
    public request() {
        this.room.send('MESSAGE', "zelo");
    }

    genTable(state){
        // for()
    }

    addNewPlayer(player, index) {
        if (player.sessionId == this.room.sessionId) {
            this.myIndex = index;
        }
        // this.obj11[index].active = true;

        // this.updateView(index, player.isMoving, player.faceDirection)
        player.listen('sessionId', (value, previousValue) => {
            // this.updateView(index, value, player.faceDirection);
            console.log('sessionId : ', value)
        });
        // player.listen('faceDirection', (value, previousValue) => {
        //     this.updateView(index, player.isMoving, value);
        // });
        player.listen('cards', (value, previousValue) => {
            // this.updatePosition(index, value);
            console.log('cards : ', value[0])
        });
        player.listen('isBanker', (value, previousValue) => {
            // this.updatePosition(index, value);
            console.log('isBanker : ', value)
        });

    }
    updateView(index, isMoving, faceDirection) {
        if (index === this.myIndex) {
            this.faceDirection = faceDirection;
        }
    }
    updatePosition(index, x) {
        let obj = this.obj11[index];
        obj.setPosition(x, 0, 0);
    }
    updateCoutdownLabel() {
        this.txt_Time.string = Math.max(0, Math.ceil(this.room.state.secondsLeft)).toString();
    }
    updateTurnLabel() {
        this.isMyturn = this.room.state.currTurn == this.myIndex;
        this.canCharging = this.isMyturn;
        this.txt_Turn.string = this.isMyturn ? "Your turn" : "Wait";
    }

    StartGame() {
        this.room.send('startGame');
    }
    NewGame() {
        this.room.send('newGame');
    }
}
enum GamePhase {
    WAITING,
    INGAME,
    ENDED,
    DRAW
}