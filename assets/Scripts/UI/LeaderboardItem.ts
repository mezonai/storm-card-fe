import { _decorator, Component, Label, Sprite, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LeaderboardItem')
export class LeaderboardItem extends Component {
    @property(Sprite) iconRank: Sprite = null!;
    @property(Sprite) bgSprite: Sprite = null!;
    @property(Label) labelRank: Label = null!;
    @property(Label) labelName: Label = null!;
    @property(Label) labelScore: Label = null!;

    @property(SpriteFrame) top1Frame: SpriteFrame = null!;
    @property(SpriteFrame) top2Frame: SpriteFrame = null!;
    @property(SpriteFrame) top3Frame: SpriteFrame = null!;
    @property(SpriteFrame) defaultFrame: SpriteFrame = null!;
    @property(SpriteFrame) selfFrame: SpriteFrame = null!;

    updateItem(rank: number, name: string, score: number, isSelf: boolean, isYourRank: boolean = false) {
        this.labelRank.string = `${rank}`;
        this.labelName.string = name;
        this.labelScore.string = score.toString();
        // Xử lý hiển thị icon top 1, 2, 3
        if (this.iconRank) {
            console.log('rank', rank)
            this.iconRank.node.active = rank <= 3;
            // Có thể thay spriteFrame theo rank nếu muốn
            switch (rank) {
                case 1:
                    this.iconRank.spriteFrame = this.top1Frame;
                    break;
                case 2:
                    this.iconRank.spriteFrame = this.top2Frame;
                    break;
                case 3:
                    this.iconRank.spriteFrame = this.top3Frame;
                    break;
                case 3:
                    this.iconRank.node.active = false;
                    break;
            }
        }

        if (isSelf || isYourRank) {
            this.bgSprite.spriteFrame = this.selfFrame;
        } else {
            this.bgSprite.spriteFrame = this.defaultFrame;
        }
    }
}
