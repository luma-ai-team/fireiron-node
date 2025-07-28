import { FirestoreAdapter } from "../firebase/firestore-adapter";
import { PredictionMetadata } from "../models/prediction";
import { PredictionProvider } from "../providers/provider";
import { Action } from "./action";

export type PredictActionRequest<Input> = {
    user: string;
    payload: Input;
};

export type PredictActionResponse = {
    identifier?: string;
    error?: string;
};

export class PredictAction<Input> implements Action<PredictActionRequest<Input>> {
    public name = "predict";
    firestore: FirestoreAdapter = new FirestoreAdapter();
    provider: PredictionProvider<Input>;

    public constructor(provider: PredictionProvider<Input>) {
        this.provider = provider;
    }

    public async run(request: PredictActionRequest<Input>): Promise<PredictActionResponse> {
        const cost = this.provider.cost(request.payload);
        try {
            await this.firestore.withdraw(request.user, cost);
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
            const prediction = await this.firestore.createPrediction(request.user, request.payload as Object, cost, metadata);
            return {
                identifier: prediction.identifier
            };
        }
        catch (error) {
            await this.firestore.deposit(request.user, cost);
            throw error;
        }
    }
};
