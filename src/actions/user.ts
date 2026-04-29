import { FirestoreAdapter } from "../firebase/firestore-adapter";
import { Action } from "./action";

export type UserLinkPayload = {
    paymentToken?: string;
    notificationToken?: string;
};

export type UserRedeemPayload = {
    amount: number;
};

export type UserActionRequest = {
    link?: UserLinkPayload;
    redeem?: UserRedeemPayload;
};

export class UserAction implements Action<UserActionRequest> {
    public name = "user";

    public async run(payload: UserActionRequest, userIdentifier: string): Promise<Object> {
        const adapter = new FirestoreAdapter();
        const reference = await adapter.prepareUserReference(userIdentifier);
        if (payload.link?.paymentToken) {
            await reference.update({
                paymentToken: payload.link.paymentToken
            });
        }
        if (payload.link?.notificationToken) {
            await reference.update({
                notificationToken: payload.link.notificationToken
            });
        }
        return {};
    }
}