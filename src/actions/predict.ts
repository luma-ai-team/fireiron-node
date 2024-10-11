import { FirestoreAdapter } from "../firebase/firestore-adapter";
import { PredictionProvider } from "../providers/provider";
import { PredictionHook } from "../webhooks/prediction-hook";
import { Action } from "./action";

export type PredictActionRequest<Input> = {
    user: string;
    payload: Input;
};

export type PredictActionResponse = {
    identifier: string;
};

export class PredictAction<Input> implements Action<PredictActionRequest<Input>> {
    public name = "predict";
    public cost: number = 1;

    provider: PredictionProvider<Input>;
    webhook: PredictionHook<Input>;
    firestore: FirestoreAdapter = new FirestoreAdapter();

    public constructor(provider: PredictionProvider<Input>, webhook: PredictionHook<Input>) {
        this.provider = provider;
        this.webhook = webhook;
    }

    public async run(request: PredictActionRequest<Input>): Promise<PredictActionResponse> {
        await this.firestore.withdraw(request.user, this.cost);
        try {
            const webhookParameters = this.webhook.makeParameters(request.user, this.provider.name);
            const prediction = await this.provider.run(request.user, request.payload, webhookParameters);
            await this.firestore.storePrediction(request.user, prediction);
            return {
                identifier: prediction.identifier
            };
        }
        catch (error) {
            await this.firestore.deposit(request.user, this.cost);
            throw error;
        }
    }
};
