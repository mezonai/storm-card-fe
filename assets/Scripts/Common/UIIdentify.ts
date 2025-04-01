import { _decorator, Button, Component, Enum, Node, tween, Tween, Vec3, Widget } from "cc";
import { UIID } from "./UIID";
const { ccclass, property } = _decorator;

@ccclass('AttachNodeData')
export class AttachNodeData {
    @property({ type: Node }) public attachNode: Node = null;
    public widget: Widget = null;
    @property({ type: Vec3 }) public movePosition: Vec3 = new Vec3(0, 0, 0);
    public originPosition: Vec3 = null;
}

@ccclass('UIIdentify')
export class UIIdentify extends Component {

    @property({
        type: Enum(UIID)
    }) public id: UIID = UIID.None;

    @property({ type: Node }) public panel: Node;

    @property({ type: Button }) public btnCloses: Button[] = [];
    @property({ type: [AttachNodeData] }) public attachNodes: AttachNodeData[] = [];

    @property({ type: Boolean }) public isPopup: boolean = false;
    @property({ type: Boolean }) public isShowOnFrontest: boolean = true;
    public originScale: Vec3 = Vec3.ONE;

    protected start(): void {

        this.btnCloses.forEach(btn => {
            btn?.node?.on('click', this.hide, this);
        });
    }

    public hide(): void {
        if (this.isPopup && this.panel.children[1] != null) {
            this.hidePopups();
        }
        else {
            this.panel.active = false
        }
    };

    public init() {
        this.attachNodes.forEach(attachNodeData => {
            let widget = attachNodeData.attachNode.getComponent(Widget);
            attachNodeData.widget = widget;
            attachNodeData.originPosition = new Vec3(widget.left, widget.top, 0);
        });

    }

    public show(isShowInFrontest = true): void {
        if (isShowInFrontest) {
            let parent = this.node.parent;
            this.node.parent = null;
            this.node.parent = parent;
        }
        this.panel.active = true;
        if (this.isPopup && this.panel.children[1] != null) {
            this.showPopups();
        }
    };

    showPopups() {
        this.attachNodes.forEach(attachNodeData => {
            attachNodeData.widget.left = attachNodeData.originPosition.x + attachNodeData.movePosition.x;
            attachNodeData.widget.top = attachNodeData.originPosition.y + attachNodeData.movePosition.y;
            attachNodeData.attachNode.active = false;
        });

        Tween.stopAllByTarget(this.panel.children[1]);
        tween(this.panel.children[1])
            .to(0.1, { scale: this.originScale.clone().add(new Vec3(0.1, 0.1, 0.1)) },)
            .to(0.1, { scale: this.originScale },)
            .call(() => {
                this.attachNodes.forEach(attachNodeData => {
                    attachNodeData.attachNode.active = true;
                    tween(attachNodeData.widget)
                        .to(0.1, { left: attachNodeData.originPosition.x, top: attachNodeData.originPosition.y },)
                        .call(() => {
                            attachNodeData.widget.left = attachNodeData.originPosition.x;
                            attachNodeData.widget.top = attachNodeData.originPosition.y;
                        })
                        .start();
                });

            })
            .start();
    }

    hidePopups() {
        this.attachNodes.forEach(attachNodeData => {
            attachNodeData.attachNode.active = false;
        });
        Tween.stopAllByTarget(this.panel.children[1]);
        this.panel.children[1].scale = Vec3.ONE;

        tween(this.panel.children[1])
            .to(0.1, { scale: this.originScale.clone().add(new Vec3(0.1, 0.1, 0.1)) },)
            .to(0.06, { scale: Vec3.ZERO },)
            .call(() => this.panel.active = false)
            .start();

        setTimeout(() => {
            if (this.panel)
                this.panel.active = false
        }, 250);
    }
}