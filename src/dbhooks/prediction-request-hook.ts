import { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { FirestoreEvent } from "firebase-functions/v2/firestore";

import { FirestoreAdapter } from "../firebase/firestore-adapter";
import { FirestoreHook } from "./firestore-hook";
import { Prediction } from "../models/prediction";
import { PredictionProvider } from "../providers/provider";
import { PredictionCompletionHook } from "../webhooks/prediction-completion-hook";

export type PredictionRequestHookDocument<Input> = {
    identifier: string;
    input: Input;
};

export class PredictionRequestHook<Input> implements FirestoreHook<PredictionRequestHookDocument<Input>> {
    public name = "convert";
    public path = "users/{userIdentifier}/predictions/{predictionIdentifier}";

    provider: PredictionProvider<Input>;
    webhook: PredictionCompletionHook<Input>;
    firestore: FirestoreAdapter = new FirestoreAdapter();

    public constructor(provider: PredictionProvider<Input>, webhook: PredictionCompletionHook<Input>) {
        this.provider = provider;
        this.webhook = webhook;
    }

    public async handle(event: FirestoreEvent<QueryDocumentSnapshot<PredictionRequestHookDocument<Input>>>): Promise<Object> {
        const userIdentifier = event.params.userIdentifier;
        const predictionIdentifier = event.params.predictionIdentifier;

        const prediction = event.data.data() as Prediction;
        const webhookParameters = this.webhook.makeParameters(userIdentifier, this.provider.name, predictionIdentifier);
        const reference = this.firestore.makePredictionReference(userIdentifier, predictionIdentifier);
        
        try {
            const result = await this.provider.run(userIdentifier, prediction.input as Input, webhookParameters);
            await reference.update({
                externalIdentifier: result.identifier,
                continuation: result.continuation,
                metadata: result.metadata,
                error: result.error,
                output: result.output
            });
        }
        catch (error) {
            await reference.update({
                error: `${error}`
            });
        }

        return {
            identifier: prediction.identifier
        };
    }
}