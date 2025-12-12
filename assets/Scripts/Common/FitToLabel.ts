import { _decorator, Component, Node, Label, UITransform, Vec3, Enum, XrKeyboardEventType, CCFloat } from 'cc';
const { ccclass, property } = _decorator;


enum FitAlign {
    LEFT,
    CENTER,
    RIGHT
}

@ccclass('FitToLabel')
export class FitToLabel extends Component {
    @property(Node)
    labelNode: Node = null;

    @property({ tooltip: "Khoảng padding bên trái & phải" })
    horizontalPadding: number = 20;

    @property({ type: Enum(FitAlign) })
    alignment: FitAlign = FitAlign.CENTER;

    @property({ type: CCFloat })
    defaultWidth: number = 0;

    onLoad() {
        const myTransform = this.node.getComponent(UITransform);
        if (myTransform) {
            this.defaultWidth = myTransform.contentSize.width;
        }
    }

    updateSpriteSize() {
        if (!this.labelNode) return;

        const labelTransform = this.labelNode.getComponent(UITransform);
        const myTransform = this.node.getComponent(UITransform);
        // console.log('labelTransform ', labelTransform)
        // console.log('myTransform ', myTransform)
        if (labelTransform && myTransform) {
            const labelWidth = labelTransform.contentSize.width + this.horizontalPadding * 2;
            const newWidth = Math.max(labelWidth, this.defaultWidth);
            myTransform.setContentSize(newWidth, myTransform.contentSize.height);
            // console.log('newWidth ', newWidth)
            // 👉 Tính lại vị trí label dựa trên alignment
            let x = 0;
            switch (this.alignment) {
                case FitAlign.LEFT:
                    x = -newWidth / 2 + this.horizontalPadding + labelTransform.contentSize.width / 2;
                    break;
                case FitAlign.CENTER:
                    x = 0;
                    break;
                case FitAlign.RIGHT:
                    x = newWidth / 2 - this.horizontalPadding - labelTransform.contentSize.width / 2;
                    break;
                default:
                    x = 0;
                    break;
            }
            // console.log('labelNodex ', x)
            this.labelNode.setPosition(new Vec3(x, this.labelNode.position.y, 0));
        }
    }
}
