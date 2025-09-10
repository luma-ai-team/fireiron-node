import { Prediction, PredictionError } from "../models/prediction";
import { PredictionCompletionWebhookParameters } from "../webhooks/prediction-completion-hook";

export enum PredictionState {
    Pending,
    Failed,
    Completed
}

export interface PredictionCompletionEvent {
    identifier: string;
    state: PredictionState.Completed;
    output: Object;
}

export interface PredictionFailureEvent {
    identifier: string;
    state: PredictionState.Failed;
    error: PredictionError;
}

export interface PredictionUpdateEvent {
    identifier: string;
    state: PredictionState.Pending;
    intermediate?: Object;
}

export type PredictionEvent = PredictionCompletionEvent | PredictionFailureEvent | PredictionUpdateEvent;

export interface PredictionProvider<Input> {
    name: string;

    cost(input: Input): number;
    estimateRunTime(input: Input): number;
    run(userIdentifier: string, input: Input, webhookParameters: PredictionCompletionWebhookParameters): Promise<Prediction>;

    canProcessHook(query: any, body: any): boolean;
    processHook(query: any, body: any): Promise<PredictionEvent>;
} 