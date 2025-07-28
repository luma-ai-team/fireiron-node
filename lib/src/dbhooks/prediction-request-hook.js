"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionRequestHook = void 0;
const firestore_adapter_1 = require("../firebase/firestore-adapter");
const provider_1 = require("../providers/provider");
class PredictionRequestHook {
    constructor(provider, webhook) {
        this.name = "run";
        this.path = "users/{userIdentifier}/predictions/{predictionIdentifier}";
        this.firestore = new firestore_adapter_1.FirestoreAdapter();
        this.provider = provider;
        this.webhook = webhook;
    }
    async handle(event) {
        const userIdentifier = event.params.userIdentifier;
        const predictionIdentifier = event.params.predictionIdentifier;
        const prediction = event.data.data();
        const webhookParameters = this.webhook.makeParameters(userIdentifier, this.provider.name, predictionIdentifier);
        const reference = this.firestore.makePredictionReference(userIdentifier, predictionIdentifier);
        try {
            const metadata = prediction.metadata;
            if (metadata) {
                const runTime = this.provider.estimateRunTime(prediction.input);
                metadata["estimatedCompletionTime"] = metadata.creationTime + runTime;
                await reference.update({
                    metadata: metadata
                });
            }
            const result = await this.provider.run(userIdentifier, prediction.input, webhookParameters);
            await reference.update({
                externalIdentifier: result.identifier,
                continuation: result.continuation,
                metadata: Object.assign(Object.assign({}, metadata), result.metadata),
                error: result.error,
                output: result.output
            });
            if (result.output) {
                await this.webhook.handleCompletion({
                    state: provider_1.PredictionState.Completed,
                    identifier: predictionIdentifier,
                    output: result.output
                }, userIdentifier);
            }
            else if (result.error) {
                await this.webhook.handleFailure({
                    state: provider_1.PredictionState.Failed,
                    identifier: predictionIdentifier,
                    error: result.error
                }, userIdentifier);
            }
        }
        catch (error) {
            const predictionError = {
                code: -1,
                message: `${error}`
            };
            await this.webhook.handleFailure({
                state: provider_1.PredictionState.Failed,
                identifier: predictionIdentifier,
                error: predictionError
            }, userIdentifier);
        }
        return {
            identifier: prediction.identifier
        };
    }
}
exports.PredictionRequestHook = PredictionRequestHook;
//# sourceMappingURL=prediction-request-hook.js.map