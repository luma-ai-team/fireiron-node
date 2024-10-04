import { FirestoreAdapter } from "../firebase/firestore-adapter";
import { Action } from "./action";

export type FCMLinkActionPayload = {
    token: string
};

export type FCMLinkActionRequest = {
    user: string;
    payload: FCMLinkActionPayload;
};

export class FCMLinkAction implements Action<FCMLinkActionRequest> {
    public name = "fcmLink";

    public async run(request: FCMLinkActionRequest): Promise<Object> {
        const adapter = new FirestoreAdapter();
        const reference = await adapter.prepareUserReference(request.user);
        await reference.update({
            pushToken: request.payload.token
        });
        return {};
    }
}