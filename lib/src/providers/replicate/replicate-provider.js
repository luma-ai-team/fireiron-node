"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplicateProvider = void 0;
const prediction_completion_hook_1 = require("../../webhooks/prediction-completion-hook");
const provider_1 = require("../provider");
const replicate_1 = __importDefault(require("replicate"));
class ReplicateProvider {
    constructor(key) {
        this.name = "replicate";
        this.replicate = new replicate_1.default({
            auth: key
        });
    }
    async run(userIdentifier, input, webhookParameters) {
        var options = await this.makeReplicateOptions(userIdentifier, input);
        options.webhook = webhookParameters.makeURL();
        options.webhook_events_filter = ["completed"];
        const result = await this.replicate.predictions.create(options);
        return await this.makePrediction(input, result);
    }
    canProcessHook(query, body) {
        return query.source == "replicate";
    }
    async processHook(query, body) {
        var _a;
        const parameters = prediction_completion_hook_1.PredictionCompletionWebhookParameters.parseQuery(query);
        const predictionIdentifier = (_a = parameters === null || parameters === void 0 ? void 0 : parameters.identifier) !== null && _a !== void 0 ? _a : body.id;
        var output = body.output;
        if (Array.isArray(output)) {
            output = output[0];
        }
        if (output != null) {
            return {
                identifier: predictionIdentifier,
                state: provider_1.PredictionState.Completed,
                output: output
            };
        }
        const error = body.error;
        if (error != null) {
            return {
                identifier: predictionIdentifier,
                state: provider_1.PredictionState.Failed,
                error: error
            };
        }
        return {
            identifier: predictionIdentifier,
            state: provider_1.PredictionState.Pending
        };
    }
}
exports.ReplicateProvider = ReplicateProvider;
//# sourceMappingURL=replicate-provider.js.map