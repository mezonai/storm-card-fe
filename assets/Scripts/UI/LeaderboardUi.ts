import { _decorator, Component, Node, Label, Button, Prefab, ScrollView, instantiate, Color, Sprite } from 'cc';
import { WebRequestManager } from '../Common/WebRequestManager';
import * as GlobalVariable from '../Common/GlobalVariable';
import { LeaderboardEntryDTO } from './LeaderboardDTO';
import { LeaderboardItem } from './LeaderboardItem';
const { ccclass, property } = _decorator;

@ccclass('LeaderboardUi')
export class LeaderboardUi extends Component {
    @property(Button) tabWin: Button;
    @property(Button) tabEarned: Button;
    @property(Button) tabLose: Button;
    @property(Button) tabLost: Button;
    @property(Button) btnDaily: Button;
    @property(Button) btnWeekly: Button;
    @property(Node) contentContainer: Node;
    // @property(Label) tabTitle: Label;
    @property(Label) yourRankLabel: Label;
    @property(Node) yourRankContainer: Node;
    @property(Prefab) leaderboardItemPrefab: Prefab;
    @property(ScrollView) scrollView: ScrollView;

    private currentType: string = 'winCount';
    private currentPeriod: string = 'daily';
    private currentUserId: string = '';
    private pool: Node[] = [];
    private loadedCount: number = 0;
    private fullData: LeaderboardEntryDTO[] = [];

    onLoad() {
        this.currentUserId = GlobalVariable.myMezonInfo.id;
        this.scrollView.node.on('scrolling', this.onScroll, this);
        this.initItem();
        this.initButtonListeners();
        this.updatePeriodHighlight();
        this.showTab(this.currentType, this.currentPeriod);
    }

    onDestroy() {
        this.scrollView.node.off('scrolling', this.onScroll, this);
        this.removeButtonListeners();
    }

    initItem() {
        // Tạo sẵn object pool 50 item
        for (let i = 0; i < 50; i++) {
            const item = instantiate(this.leaderboardItemPrefab);
            item.active = false;
            this.pool.push(item);
            this.contentContainer.addChild(item);
        }
    }
    showTab(type: string, period: string = this.currentPeriod) {
        this.currentType = type;
        this.currentPeriod = period;
        // this.tabTitle.string = this.getTabTitle(type);
        this.updateTabHighlight(type);
        this.fetchLeaderboard(type, period);
    }

    showPeriod(period: string) {
        this.currentPeriod = period;
        this.updatePeriodHighlight();
        this.fetchLeaderboard(this.currentType, period);
    }

    private updateTabHighlight(selectedType: string) {
        const tabMap = [
            { type: 'winCount', button: this.tabWin },
            { type: 'moneyEarned', button: this.tabEarned },
            { type: 'loseCount', button: this.tabLose },
            { type: 'moneyLost', button: this.tabLost },
        ];
    
        tabMap.forEach(({ type, button }) => {
            const isSelected = type === selectedType;
            const sprite = button.getComponent(Sprite);
            if (sprite) {
                sprite.color = new Color(sprite.color.r, sprite.color.g, sprite.color.b, isSelected ? 255: 100);
            }
        });
    }

    private updatePeriodHighlight() {
        const dailySprite = this.btnDaily.getComponent(Sprite);
        const weeklySprite = this.btnWeekly.getComponent(Sprite);
    
        if (dailySprite) dailySprite.color = new Color(dailySprite.color.r, dailySprite.color.g, dailySprite.color.b, this.currentPeriod === 'daily' ? 255 : 100);
        if (weeklySprite) weeklySprite.color = new Color(weeklySprite.color.r, weeklySprite.color.g, weeklySprite.color.b, this.currentPeriod === 'weekly' ? 255 : 100);
    }

    // private getTabTitle(type: string): string {
    //     switch (type) {
    //         case 'winCount': return 'Thắng nhiều nhất';
    //         case 'moneyEarned': return 'Ăn tiền nhiều nhất';
    //         case 'loseCount': return 'Thua nhiều nhất';
    //         case 'moneyLost': return 'Mất tiền nhiều nhất';
    //         default: return '';
    //     }
    // }

    private fetchLeaderboard(type: string, period: string) {
        WebRequestManager.instance.fetchTopLeaderboard(
            type,
            period,
            50,
            this.currentUserId,
            (res) => this.renderData(res.leaderboard, res.yourRank),
            (err) => console.error("Lỗi lấy leaderboard", err)
        );
    }

    private renderData(data: LeaderboardEntryDTO[], yourRank: LeaderboardEntryDTO | undefined) {
        this.fullData = data;
        this.loadedCount = 0;
        // Ẩn toàn bộ trước khi render lại
        this.pool.forEach(item => item.active = false);

        // Hiển thị 10 item đầu
        this.loadMoreItems(10);

        // Hiển thị rank của bạn
        this.yourRankContainer.removeAllChildren();
        if (yourRank) {
            this.renderYourRank(yourRank);
        } else {
            this.yourRankLabel.string = 'Bạn chưa có thứ hạng';
        }
    }

    private loadMoreItems(count: number) {
        const toLoad = Math.min(count, this.fullData.length - this.loadedCount);
        for (let i = 0; i < toLoad; i++) {
            const data = this.fullData[this.loadedCount];
            const item = this.pool[this.loadedCount]; // đã có sẵn
            this.bindDataToItem(item, data);
            item.active = true;
            this.loadedCount++;
        }
    }

    private onScroll() {
        const scrollOffset = this.scrollView.getScrollOffset();
        const bottomThreshold = 50;
        if (scrollOffset.y <= bottomThreshold && this.loadedCount < this.fullData.length) {
            this.loadMoreItems(10);
        }
    }

    private getItemFromPool(): Node {
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        return instantiate(this.leaderboardItemPrefab);
    }

    private bindDataToItem(item: Node, data: LeaderboardEntryDTO, isYourRank: boolean = false) {
        const comp = item.getComponent(LeaderboardItem);
        if (comp) {
            const isCurrentUser = data.userId === this.currentUserId;
            comp.updateItem(data.rank, data.userName, data.score, isCurrentUser, isYourRank);
        }
    }

    private renderYourRank(yourRank: LeaderboardEntryDTO) {
        const item = instantiate(this.leaderboardItemPrefab); // your rank là slot riêng biệt
        this.bindDataToItem(item, yourRank, true);
        this.yourRankContainer.addChild(item);
    }


    // Gắn vào các button tab
    onClickWinTab() { this.showTab('winCount'); }
    onClickEarnedTab() { this.showTab('moneyEarned'); }
    onClickLoseTab() { this.showTab('loseCount'); }
    onClickLostTab() { this.showTab('moneyLost'); }

    // Gắn vào button chuyển chế độ
    onClickDaily() { this.showPeriod('daily'); }
    onClickWeekly() { this.showPeriod('weekly'); }

    initButtonListeners() {
        this.tabWin.node.on(Button.EventType.CLICK, this.onClickWinTab, this);
        this.tabEarned.node.on(Button.EventType.CLICK, this.onClickEarnedTab, this);
        this.tabLose.node.on(Button.EventType.CLICK, this.onClickLoseTab, this);
        this.tabLost.node.on(Button.EventType.CLICK, this.onClickLostTab, this);

        this.btnDaily.node.on(Button.EventType.CLICK, this.onClickDaily, this);
        this.btnWeekly.node.on(Button.EventType.CLICK, this.onClickWeekly, this);
    }

    removeButtonListeners() {
        this.tabWin.node.off(Button.EventType.CLICK, this.onClickWinTab, this);
        this.tabEarned.node.off(Button.EventType.CLICK, this.onClickEarnedTab, this);
        this.tabLose.node.off(Button.EventType.CLICK, this.onClickLoseTab, this);
        this.tabLost.node.off(Button.EventType.CLICK, this.onClickLostTab, this);

        this.btnDaily.node.off(Button.EventType.CLICK, this.onClickDaily, this);
        this.btnWeekly.node.off(Button.EventType.CLICK, this.onClickWeekly, this);
    }
}
