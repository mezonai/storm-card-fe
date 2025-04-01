import { _decorator, Component, Label, Node, Sprite, tween, Tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('warning')
export class warning extends Component {
    @property(Label) txt_Warning: Label;
    @property(Node) obj_Warning: Node;

    setWarning(value) {
        this.txt_Warning.string = value
        this.obj_Warning.active = true
        this.obj_Warning.setPosition(new Vec3(0, 0, 0))
        this.obj_Warning.setScale(new Vec3(0.5, 0.5, 0.5))
        Tween.stopAllByTarget(this.obj_Warning);
        tween(this.obj_Warning)
            .to(0.2, { scale: new Vec3(1, 1, 1) }, {
                easing: "backOut",
            })
            .to(1, { scale: new Vec3(1, 1, 1) }, {
                easing: "backOut",
            })
            .call(() => { this.txt_Warning.string = ''; this.obj_Warning.active = false })
            .to(0, { scale: new Vec3(0, 0, 0) }, {
                easing: "backOut",
            })
            .start();
    }
}