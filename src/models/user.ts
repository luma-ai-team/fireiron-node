export type User = {
    identifier: string;
    balance: number;
    redeemLimit?: number;
    pushToken?: string;
    purchaseDate?: string;
};