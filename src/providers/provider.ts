import { Prediction, PredictionError } from "../models/prediction";
import { PredictionWebhookParameters } from "../webhooks/prediction-hook";

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
}

export type PredictionEvent = PredictionCompletionEvent | PredictionFailureEvent | PredictionUpdateEvent;

export interface PredictionProvider<Input> {
    name: string;
    run(userIdentifier: string, input: Input, webhookParameters: PredictionWebhookParameters): Promise<Prediction>;

    canProcessHook(query: any, body: any): boolean;
    processHook(query: any, body: any): Promise<PredictionEvent>;
} 