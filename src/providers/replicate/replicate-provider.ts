import { Prediction } from "../../models/prediction";
import { PredictionProvider, PredictionState, PredictionEvent } from "../provider";

import * as Replicate from "replicate";
import ReplicateInstance from "replicate";

export type ReplicateOptions = {
    model?: string;
    version?: string;
    input: object;
    stream?: boolean;
    webhook?: string;
    webhook_events_filter?: Replicate.WebhookEventType[];
};

export abstract class ReplicateProvider<Input> implements PredictionProvider<Input> {
    replicate: ReplicateInstance;
    domain: string;

    public constructor(key: string, domain: string) {
        this.replicate = new ReplicateInstance({
            auth: key
        });
        this.domain = domain;
    }

    public async run(userIdentifier: string, input: Input): Promise<Prediction> {
        const options = await this.makeReplicateOptions(userIdentifier, input);
        const result = await this.replicate.predictions.create(options);
        return await this.makePrediction(input, result);
    }

    public async processHook(query: any, body: any): Promise<PredictionEvent> {
        const predictionIdentifier = query.prediction ?? body.id;

        var output = body.output;
        if (Array.isArray(output)) {
            output = output[0];
        }

        if (output != null) {
            return {
                identifier: predictionIdentifier,
                state: PredictionState.Completed,
                output: output
            };
        }

        const error = body.error;
        if (error != null) {
            return {
                identifier: predictionIdentifier,
                state: PredictionState.Failed,
                error: error
            };
        }

        return {
            identifier: predictionIdentifier,
            state: PredictionState.Pending
        };
    }

    public makeWebhookURL(userIdentifier: string): string {
        return "https://" + this.domain + "predictionHook?user=" + userIdentifier;
    }

    abstract makeReplicateOptions(userIdentifier: string, input: Input): Promise<any>;
    abstract makePrediction(input: Input, output: Replicate.Prediction): Promise<Prediction>;
}