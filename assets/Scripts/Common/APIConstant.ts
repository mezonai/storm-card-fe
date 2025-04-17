export default class APIConstant {
    static CONFIG: string = "config";
    static GAME_CONFIG: string = "game-config";
    static GAME_DATA_CONFIG: string = "game-data-config";
    static USER: string = "users";
    static LOGIN: string = "login";
    static LOGIN_PRIVY: string = "login-privy";
    static LOGIN_MEZON: string = "login-mezon";

    // Leaderboard endpoint
    static LEADERBOARD = "leaderboard";
    static TOP = "top";
    static TOP_VOLATILE = "top-volatile";
}

export class APIConfig {
    static token = "";

    static BASE_URLS = {
        USER_SERVICE: "https://gameuser-server.nccsoft.vn/api/v1/",//server nội bộ
        // USER_SERVICE: "https://game-user-server.ncc.studio/api/v1/",//server public
        GAME_SERVICE: "http://localhost:2567/api/", // server local
        // GAME_SERVICE: "https://game-sam-api.nccsoft.vn/api/", //server nội bộ
        // GAME_SERVICE: "https://game-sam-api.ncc.studio/api/", //server public
    };

    // Nếu cần token riêng cho từng service sau này:
    static SERVICE_TOKENS = {
        USER_SERVICE: "",
        GAME_SERVICE: "",
    };
}

export enum SERVICE_KEY {
    USER_SERVICE = 'USER_SERVICE',
    GAME_SERVICE = 'GAME_SERVICE',
}