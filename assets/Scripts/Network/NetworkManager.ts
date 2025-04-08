import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;
import Colyseus from 'db://colyseus-sdk/colyseus.js';
import * as GlobalVariable from '../Common/GlobalVariable';

@ccclass('NetworkManager')
export class NetworkManager extends Component {
    client!: Colyseus.Client;
    room!: Colyseus.Room;

    public async createNewRoom(roomName, options, isLobby) {
        console.log(options)
        this.client = new Colyseus.Client(`${GlobalVariable.useSSL ? "wss" : "ws"}://${GlobalVariable.hostname}${([443, 80].includes(GlobalVariable.port) || GlobalVariable.useSSL) ? "" : `:${GlobalVariable.port}`}`);

        if (isLobby) {
            this.room = await this.client.joinOrCreate(roomName, options!);
            return this.room;
        } else {
            this.room = await this.client.create(roomName, options);
            return this.room;
        }
    }
    public async joinRoom(id, options) {
        console.log('join to ', id)
        this.client = new Colyseus.Client(`${GlobalVariable.useSSL ? "wss" : "ws"}://${GlobalVariable.hostname}${([443, 80].includes(GlobalVariable.port) || GlobalVariable.useSSL) ? "" : `:${GlobalVariable.port}`}`);
        this.room = await this.client.joinById(id, options)
    }

    public async getRoom(roomName: string) {
        return await this.client.getAvailableRooms(roomName);
    }
}