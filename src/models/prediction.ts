export type PredictionError = {
    code: number;
    message: string;
};

export type PredictionMetadata = {
    creationTime: number;
    estimatedCompletionTime?: number;
};

export type Prediction = {
    identifier: string;
    input: Object;
    cost?: number;

    externalIdentifier?: string;
    continuation?: Object;
    metadata?: PredictionMetadata | Object;

    intermediate?: Object;
    error?: PredictionError;
    output?: Object;
};