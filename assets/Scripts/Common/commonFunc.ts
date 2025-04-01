import { _decorator, Component, Node, Tween, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('commonFunc')
export class commonFunc extends Component {
    vfx_press(node) {
        Tween.stopAllByTarget(node);
        tween(node)
            .to(0, { scale: new Vec3(0.5, 0.5, 0.5) })
            .to(0.3, { scale: new Vec3(1, 1, 1) }, {
                easing: "backOut",
            })
            .start();
    }

    vfx_Arrow(node) {
        let curPos = node.getPosition().clone();
        Tween.stopAllByTarget(node);
        tween(node)
            .to(0.5, { position: curPos.add(new Vec3(0, 20, 0)) }, {
                easing: "backOut",
            })
            .to(0.5, { position: curPos.add(new Vec3(0, -20, 0)) }, {
                easing: "backOut",
            })
            .repeatForever()
            .start();
    }
}

const commonFUnc = new commonFunc()
export default commonFUnc;