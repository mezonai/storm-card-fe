export default class APIConstant {
    static CONFIG: string = "config";
    static GAME_CONFIG: string = "game-config";
    static GAME_DATA_CONFIG: string = "game-data-config";
    static USER: string = "users";
    static LOGIN: string = "login";
    static LOGIN_PRIVY: string = "login-privy";
    static LOGIN_MEZON: string = "login-mezon";
}

export class APIConfig {
    static token: string = "";
    // static ip: string = "http://172.16.10.16:5000/api/v1/"; //Linh
    static ip: string = "https://gameuser-server.nccsoft.vn/api/v1/"; // Tuyen
    // static ip: string = "http://10.10.41.239:5008/api/v1/"; // Tuyen
    //static ip: string = "https://trumpclicker-api.ncc.studio/api/v1/";
    // static ip: string = "https://api.megamaga.fun/api/v1/";
}