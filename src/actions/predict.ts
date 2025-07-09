import { FirestoreAdapter } from "../firebase/firestore-adapter";
import { PredictionMetadata } from "../models/prediction";
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

    firestore: FirestoreAdapter = new FirestoreAdapter();

    public constructor() {
        //
    }

    public async run(request: PredictActionRequest<Input>): Promise<PredictActionResponse> {
        await this.firestore.withdraw(request.user, this.cost);
        try {
            const currentTime = Math.floor(Date.now() / 1000);
            const metadata: PredictionMetadata = {
                creationTime: currentTime,
            };
            const prediction = await this.firestore.createPrediction(request.user, request.payload as Object, metadata);
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
