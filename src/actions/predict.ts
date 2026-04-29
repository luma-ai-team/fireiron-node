import { FirestoreAdapter } from "../firebase/firestore-adapter";
import { PredictionMetadata } from "../models/prediction";
import { PredictionProvider } from "../providers/provider";
import { Action } from "./action";

export type PredictActionResponse = {
    identifier?: string;
    error?: string;
};

export class PredictAction<Payload> implements Action<Payload> {
    public name = "predict";
    firestore: FirestoreAdapter = new FirestoreAdapter();
    provider: PredictionProvider<Payload>;

    public constructor(provider: PredictionProvider<Payload>) {
        this.provider = provider;
    }

    public async run(payload: Payload, userIdentifier: string): Promise<PredictActionResponse> {
        const cost = this.provider.cost(payload);
        try {
            await this.firestore.withdraw(userIdentifier, cost);
        }
        catch (error: any) {
            return {
                error: error.message
            };
        }

        try {
            const currentTime = Math.floor(Date.now() / 1000);
            const metadata: PredictionMetadata = {
                creationTime: currentTime,
            };
            const prediction = await this.firestore.createPrediction(userIdentifier, payload as Object, cost, metadata);
            return {
                identifier: prediction.identifier
            };
        }
        catch (error) {
            await this.firestore.deposit(userIdentifier, cost);
            throw error;
        }
    }
};
