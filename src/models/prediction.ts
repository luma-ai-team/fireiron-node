export type PredictionError = {
    code: number;
    message: string;
};

export type Prediction = {
    identifier: string;
    input: Object;

    externalIdentifier?: string;
    continuation?: Object;
    metadata?: Object;
    error?: PredictionError;
    output?: Object;
};