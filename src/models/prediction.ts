export type PredictionError = {
    code: number;
    message: string;
};

export type Prediction = {
    identifier: string;
    input: Object;
    continuation?: Object;
    metadata?: Object;
    error?: PredictionError;
    output?: Object;
};