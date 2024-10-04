import { FirestoreAdapter } from "../firebase/firestore-adapter";
import { Action } from "./action";

export type AdaptyLinkActionPayload = {
    profile: string
};

export type AdaptyLinkActionRequest = {
    user: string;
    payload: AdaptyLinkActionPayload;
};

export class AdaptyLinkAction implements Action<AdaptyLinkActionRequest> {
    public name = "adaptyLink";

    public async run(request: AdaptyLinkActionRequest): Promise<Object> {
        const adapter = new FirestoreAdapter();
        const reference = await adapter.prepareUserReference(request.user);
        await reference.update({
            adaptyProfile: request.payload.profile
        });
        return {};
    }
}