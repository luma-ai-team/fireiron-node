"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionRequestHook = void 0;
const firestore_adapter_1 = require("../firebase/firestore-adapter");
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
                await reference.update({
                    "metadata.estimatedCompletionTime": metadata.creationTime + runTime
                });
            }
            const result = await this.provider.run(userIdentifier, prediction.input, webhookParameters);
            await reference.update({
                externalIdentifier: result.identifier,
                continuation: result.continuation,
                metadata: Object.assign(Object.assign({}, prediction.metadata), result.metadata),
                error: result.error,
                output: result.output
            });
        }
        catch (error) {
            await reference.update({
                error: {
                    code: -1,
                    message: `${error}`
                }
            });
        }
        return {
            identifier: prediction.identifier
        };
    }
}
exports.PredictionRequestHook = PredictionRequestHook;
//# sourceMappingURL=prediction-request-hook.js.map