"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionRequestHook = void 0;
const Logger = __importStar(require("firebase-functions/logger"));
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
        if (prediction == null) {
            Logger.log(`Skipping incomplete predicion: ${userIdentifier}/${predictionIdentifier}`);
            return {};
        }
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
                intermediate: result.intermediate,
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