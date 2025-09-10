import { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { FirestoreEvent } from "firebase-functions/v2/firestore";

import { FirestoreAdapter } from "../firebase/firestore-adapter";
import { FirestoreHook } from "./firestore-hook";
import { Prediction, PredictionError, PredictionMetadata } from "../models/prediction";
import { PredictionProvider, PredictionState } from "../providers/provider";
import { PredictionCompletionHook } from "../webhooks/prediction-completion-hook";

export type PredictionRequestHookDocument<Input> = {
    identifier: string;
    input: Input;
    cost: number;
};

export class PredictionRequestHook<Input> implements FirestoreHook<PredictionRequestHookDocument<Input>> {
    public name = "run";
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
            const metadata: PredictionMetadata | undefined = prediction.metadata as PredictionMetadata;
            if (metadata) {
                const runTime = this.provider.estimateRunTime(prediction.input as Input);
                metadata["estimatedCompletionTime"] = metadata.creationTime + runTime
                await reference.update({
                    metadata: metadata
                });
            }

            const result = await this.provider.run(userIdentifier, prediction.input as Input, webhookParameters);
            await reference.update({
                externalIdentifier: result.identifier,
                continuation: result.continuation,
                metadata: {...metadata, ...result.metadata},
                intermediate: result.intermediate,
                error: result.error,
                output: result.output
            });

            if (result.output) {
                await this.webhook.handleCompletion({
                    state: PredictionState.Completed,
                    identifier: predictionIdentifier,
                    output: result.output
                }, userIdentifier);
            }
            else if (result.error) {
                await this.webhook.handleFailure({
                    state: PredictionState.Failed,
                    identifier: predictionIdentifier,
                    error: result.error
                }, userIdentifier);
            }
        }
        catch (error) {
            const predictionError: PredictionError = {
                code: -1,
                message: `${error}`
            };

            await this.webhook.handleFailure({
                state: PredictionState.Failed,
                identifier: predictionIdentifier,
                error: predictionError
            }, userIdentifier);
        }

        return {
            identifier: prediction.identifier
        };
    }
}