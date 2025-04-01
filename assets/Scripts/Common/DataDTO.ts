export class UserLoginDTO {
    serverTime: string;
    error_code: number;
    data: UserDataDTO;
}
export class UserDataDTO {
    userId: string;
    telegramId: string;
    address: string;
    email: string;
    username: string;
    account_type: string;
    createdAt: string;
    accessToken: string;
}