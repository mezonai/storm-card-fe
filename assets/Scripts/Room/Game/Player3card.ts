import { _decorator, assetManager, Button, Component, Director, director, easing, ImageAsset, instantiate, Label, labelAssembler, Layout, Node, Prefab, Sprite, SpriteFrame, Texture2D, Toggle, tween, Vec3 } from 'cc';
import { Card } from './Card';
import GlobalEvent from '../../Common/GlobalEvent';
import commonFUnc from '../../Common/commonFunc';

const { ccclass, property } = _decorator;

@ccclass('Player3card')
export class Player3card extends Component {
    cardComponent: Card[] = [];
    @property(Node) obj_MyTurn;
    @property(Node) cardParent;
    @property(Prefab) pre_Card;
    @property(Node) obj_Ready: Node;
    @property(Label) txt_Name: Label;
    @property(Label) txt_Money: Label;
    @property(Node) obj_IsInRound;
    @property(Sprite) spr_Avar;
    @property({ type: Button }) btn_Kick: Button = null;
    @property({ type: Node }) obj_Owner: Node = null;
    @property({ type: Layout }) obj_layout: Layout = null;
    // _layout;

    myIndex;
    public isDealer;
    public totalPoint;
    public sessionId;
    allMyCards;
    sortOption = 1;
    private obj_MyTurnOriginPos = new Vec3();
    private onKickCallback: (sessionId: string) => void = null;

    protected onLoad(): void {
        for (let i = 0; i < 10; i++) {
            let card_tmp = instantiate(this.pre_Card);
            let cardC = card_tmp.getComponent(Card);
            card_tmp.parent = this.cardParent;
            this.cardComponent.push(cardC)
            card_tmp.active = false;
        }
        console.log('this.cardParent ', this.cardParent)
        this.obj_MyTurnOriginPos = this.obj_MyTurn.getPosition().clone();
        // this._layout = this.cardParent.getComponent(Layout);
    }
    enableLayout() {
        console.log('enableLayout ', this.obj_layout)
        if (!this.obj_layout) return;
        this.obj_layout.updateLayout(true);
        this.obj_layout.updateLayout();

        setTimeout(() => {
            this.obj_layout.updateLayout();
            this.obj_layout.updateLayout(true);
        }, 500);
    }

    resetToNewGame() {
        for (let i = 0; i < this.cardComponent.length; i++) {
            this.cardComponent[i].node.active = false;
        }
        this.enableLayout();
        this.allMyCards = []
    }

    setInfo(id, index, url) {
        this.sessionId = id;
        this.myIndex = index;
        let that = this;
        let tryLoad = false;
        console.log('avar: ', url)
        assetManager.loadRemote(url, { ext: '.png' }, (err, imageAsset) => {
            if (err) {
                console.log("Failed to load image:", err);
                tryLoad = true;
                return;
            }

            if (!(imageAsset instanceof ImageAsset)) {
                console.log("Loaded asset is not an ImageAsset!");
                return;
            }
            const texture = new Texture2D();
            texture.image = imageAsset;

            const spriteFrame = new SpriteFrame();
            spriteFrame.texture = texture;

            that.spr_Avar.spriteFrame = spriteFrame;
        });
        if (tryLoad) {
            assetManager.loadRemote(url, (err, imageAsset) => {
                if (err) {
                    console.log("Failed to load image:", err);
                    return;
                }

                if (!(imageAsset instanceof ImageAsset)) {
                    console.log("Loaded asset is not an ImageAsset!");
                    return;
                }
                const texture = new Texture2D();
                texture.image = imageAsset;

                const spriteFrame = new SpriteFrame();
                spriteFrame.texture = texture;

                that.spr_Avar.spriteFrame = spriteFrame;
            });
        }
    }

    updateMyIndex(index) {
        if (index < this.myIndex && this.myIndex > 0) this.myIndex--;
        // this.setName(1)
    }

    setName(name) {
        this.txt_Name.string = name;
    }

    setOwner(isOwner) {
        this.obj_Owner.active = isOwner;
    }

    setCard(cards) {
        // console.log('setCard ', cards)
        if (cards) {
            this.allMyCards = cards;
            for (let i = 0; i < cards.length; i++) {
                this.cardComponent[i].setCard(cards[i])
                this.cardComponent[i].setMyCard(true)
                this.cardComponent[i].node.active = true;
            }
        }
        this.enableLayout();
    }
    
    removeCard(cards) {
        if (cards) {
            for (let i = 0; i < cards.length; i++) {
                for (let j = 0; j < this.cardComponent.length; j++) {
                    const card = this.cardComponent[j].getCard();
                    // console.log('removeCard ', j, cards[i], card);
                    if (!card) {
                        continue;
                    }
                    if (card.number == cards[i].number && card.suit == cards[i].suit) {
                        this.cardComponent[j].node.active = false;
                    }

                }
                let index = this.allMyCards.findIndex(card => card.number == cards[i].number && card.suit == cards[i].suit);

                if (index !== -1) {
                    this.allMyCards.splice(index, 1);
                }
            }
        }
        this.enableLayout();

        console.log('allMyCards ', this.allMyCards)
    }

    setCurrentTurn(isMyTurn) {
        // this.obj_MyTurn.active = isMyTurn;
        // stop hết tween cũ
        tween(this.obj_MyTurn).stop();

        if (isMyTurn) {
            this.obj_MyTurn.active = true;

            tween(this.obj_MyTurn)
                .repeatForever(
                    tween()
                        .to(0.5, { position: new Vec3(this.obj_MyTurnOriginPos.x, this.obj_MyTurnOriginPos.y + 10, this.obj_MyTurnOriginPos.z) }, { easing: easing.sineInOut })
                        .to(0.5, { position: this.obj_MyTurnOriginPos }, { easing: easing.sineInOut })
                )
                .start();
        } else {
            this.obj_MyTurn.active = false;
        }
        if (this.obj_Ready.active == true) this.obj_Ready.active = false;
    }

    setIsReady(isReady) {
        this.obj_Ready.active = isReady;
        commonFUnc.vfx_press(this.obj_Ready)
    }

    setIsInRound(isIn) {
        // if (this.obj_IsInRound)
        this.obj_IsInRound.active = !isIn;
    }

    showCardLeft(num) {
        // console.log('showCardLeft ', num, this.cardComponent.length)
        if (this.cardComponent.length == 0) {
            for (let i = 0; i < num; i++) {
                let card_tmp = instantiate(this.pre_Card);
                let cardComponent = card_tmp.getComponent(Card);
                card_tmp.parent = this.cardParent;
                cardComponent.setMyCard(false)
                this.cardComponent.push(cardComponent)
            }
        }
        this.enableLayout();
        this.obj_layout.spacingX = -40;

        for (let i = 0; i < this.cardComponent.length; i++) {
            if (i < num)
                this.cardComponent[i].node.active = true;
            else
                this.cardComponent[i].node.active = false;
        }
    }

    showMoney(num) {
        // console.log('showmoney ', num)
        this.txt_Money.string = num;
        commonFUnc.vfx_press(this.txt_Money.node)
    }

    setPositionInTable(index) {
        switch (index) {
            case 0:
                this.cardParent.setPosition(0, 100)
                break;
            case 1:
                this.cardParent.angle = (90);
                this.cardParent.setPosition(-100, 0)
                this.cardParent.setScale(0.6, 0.6)
                break;
            case 2:
                this.cardParent.angle = 180;
                this.cardParent.setPosition(0, -100)
                this.cardParent.setScale(0.6, 0.6)
                break;
            case 3:
                this.cardParent.angle = 180;
                this.cardParent.setPosition(0, -100)
                this.cardParent.setScale(0.6, 0.6)
                break;
            case 4:
                this.cardParent.angle = -90;
                this.cardParent.setPosition(100, 0)
                this.cardParent.setScale(0.6, 0.6)
                break;
        }
    }

    refreshOrder() {
        this.sortOption = 1 - this.sortOption;
        console.log('allMyCards be ', this.allMyCards)
        let affterOfer = this.customSort(this.allMyCards, this.sortOption)
        console.log('allMyCards af ', affterOfer)
        for (let i = 0; i < this.cardComponent.length; i++) {
            if (i < affterOfer.length) {
                this.cardComponent[i].setCard(affterOfer[i])
                this.cardComponent[i].node.active = true;
            } else {
                this.cardComponent[i].node.active = false;
            }
        }

        GlobalEvent.emit('reOrderCard_event');
        this.enableLayout();
    }

    customSort(array: any[], option): any[] {
        // Tạo một map đếm số lần xuất hiện của mỗi số
        const frequencyMap = new Map<number, number>();
        array.forEach(obj => {
            const count = frequencyMap.get(obj.number) || 0;
            frequencyMap.set(obj.number, count + 1);
        });

        // Hàm hỗ trợ để so sánh giá trị: Ace (1) sẽ được coi như 14
        const getSortValue = (num: number) => (num === 1 ? 14 : num);

        // Hàm so sánh tùy thuộc vào option
        return array.sort((a, b) => {
            const freqA = frequencyMap.get(a.number) || 0;
            const freqB = frequencyMap.get(b.number) || 0;

            if (option === 1) {
                // Ưu tiên cặp đôi (tần suất cao hơn)
                if (freqA !== freqB) {
                    return freqB - freqA;
                }
            }

            if (option === 0) {
                // Ưu tiên chuỗi số tăng dần nhưng Ace cuối
                return getSortValue(a.number) - getSortValue(b.number);
            }

            // Khi không có ưu tiên rõ ràng
            return getSortValue(a.number) - getSortValue(b.number);
        });
    }

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