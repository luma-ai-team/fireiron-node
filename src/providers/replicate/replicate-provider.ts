import { Prediction } from "../../models/prediction";
import { PredictionCompletionWebhookParameters } from "../../webhooks/prediction-completion-hook";
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
    public name: string = "replicate";
    replicate: ReplicateInstance;

    public constructor(key: string) {
        this.replicate = new ReplicateInstance({
            auth: key
        });
    }

    public async run(userIdentifier: string, input: Input, webhookParameters: PredictionCompletionWebhookParameters): Promise<Prediction> {
        var options = await this.makeReplicateOptions(userIdentifier, input);
        options.webhook = webhookParameters.makeURL();
        options.webhook_events_filter = ["completed"];
        
        const result = await this.replicate.predictions.create(options as any);
        return await this.makePrediction(input, result);
    }

    public canProcessHook(query: any, body: any): boolean {
        return query.source == "replicate";
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

    abstract makeReplicateOptions(userIdentifier: string, input: Input): Promise<ReplicateOptions>;
    abstract makePrediction(input: Input, output: Replicate.Prediction): Promise<Prediction>;
}