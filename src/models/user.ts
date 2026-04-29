export type User = {
    identifier: string;
    balance: number;
    notificationToken?: string;
    paymentToken?: string;
    paymentDate?: string;
};