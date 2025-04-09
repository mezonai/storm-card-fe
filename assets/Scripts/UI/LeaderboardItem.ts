import { _decorator, Component, Label, Sprite, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LeaderboardItem')
export class LeaderboardItem extends Component {
    @property(Sprite) iconRank: Sprite = null!;
    @property(Sprite) bgSprite: Sprite = null!;
    @property(Label) labelRank: Label = null!;
    @property(Label) labelName: Label = null!;
    @property(Label) labelScore: Label = null!;

    @property(SpriteFrame) top1to3Frame: SpriteFrame = null!;
    @property(SpriteFrame) defaultFrame: SpriteFrame = null!;
    @property(SpriteFrame) selfFrame: SpriteFrame = null!;

    updateItem(rank: number, name: string, score: number, isSelf: boolean, isYourRank: boolean = false) {
        this.labelRank.string = `${rank}`;
        this.labelName.string = name;
        this.labelScore.string = score.toString();
        // Xử lý hiển thị icon top 1, 2, 3
        if (this.iconRank) {
            this.iconRank.node.active = rank <= 3;
            // Có thể thay spriteFrame theo rank nếu muốn
        }

        if (isSelf || isYourRank) {
            this.bgSprite.spriteFrame = this.selfFrame;
        } else if (rank >= 1 && rank <= 3) {
            this.bgSprite.spriteFrame = this.top1to3Frame;
        } else {
            this.bgSprite.spriteFrame = this.defaultFrame;
        }
    }
}
