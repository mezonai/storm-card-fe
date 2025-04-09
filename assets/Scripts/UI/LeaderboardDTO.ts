export interface LeaderboardEntryDTO {
    rank: number;
    userId: string;
    userName: string;
    score: number;
}

export interface LeaderboardResponseDTO {
    key: string;
    leaderboard: LeaderboardEntryDTO[];
    yourRank?: LeaderboardEntryDTO;
}