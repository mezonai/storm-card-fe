import { _decorator, Component, Node, Sprite, Prefab, Label, Toggle, tween, Vec3, resources, SpriteFrame } from 'cc';
import GlobalEvent from '../../Common/GlobalEvent';
const { ccclass, property } = _decorator;

@ccclass('Card')
export class Card extends Component {
    @property(Toggle) tog_Choose: Toggle;
    tweenDuration: number = .2;
    card;
    canClick = true;
    choose(value) {
        if (!this.canClick) return;
        this.tog_Choose.enabled = false;
        this.canClick = false;
        if (value.isChecked == false) {
            GlobalEvent.emit('custom-event', { card: this.card, action: 0 });  // remove
            tween(this.node)
                .to(this.tweenDuration, { position: this.node.getPosition().add(new Vec3(0, -10, 0)) }, {
                    easing: "backIn",
                })
                .call(() => { this.tog_Choose.enabled = true; this.canClick = true })
                .start();
        } else {
            GlobalEvent.emit('custom-event', { card: this.card, action: 1 }); // add
            tween(this.node)
                .to(this.tweenDuration, { position: this.node.getPosition().add(new Vec3(0, 10, 0)) }, {
                    easing: "backIn",
                })
                .call(() => { this.tog_Choose.enabled = true; this.canClick = true })
                .start();
        }
    }

    setCard(card) {
        this.node.getComponent(Sprite).spriteFrame = null;
        this.card = card;
        this.tog_Choose.isChecked = false;
        var self = this;
        resources.load("Cards/" + card.number + card.suit + '/spriteFrame', SpriteFrame, function (err, spriteFrame) {
            self.node.getComponent(Sprite).spriteFrame = spriteFrame;
        });
    }
    getCard() {
        return this.card;
    }
    setMyCard(isMyCard) {
        this.tog_Choose.enabled = isMyCard;
    }
}