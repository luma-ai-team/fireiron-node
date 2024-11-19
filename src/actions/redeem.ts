import * as Firestore from "firebase-admin/firestore"
import { FirestoreAdapter } from "../firebase/firestore-adapter";
import { Action } from "./action";
import { User } from "../models/user";

export type RedeemActionPayload = {
    amount: number;
};

export type RedeemActionRequest = {
    user: string;
    payload: RedeemActionPayload;
};

export class RedeemAction implements Action<RedeemActionRequest> {
    public name = "redeem";

    public async run(request: RedeemActionRequest): Promise<Object> {
        const adapter = new FirestoreAdapter();
        const reference = await adapter.prepareUserReference(request.user);
        const document = await reference.get();
        const user = document.data() as User;
        const redeemLimit = user.redeemLimit ?? 0;

        const availableAmount = Math.max(request.payload.amount, redeemLimit);
        const limit = redeemLimit - availableAmount;

        await reference.update({
            balance: Firestore.FieldValue.increment(availableAmount),
            redeemLimit: limit
        });
        return {};
    }
}