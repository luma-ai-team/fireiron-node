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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionCompletionHook = exports.PredictionCompletionWebhookParameters = void 0;
const Logger = __importStar(require("firebase-functions/logger"));
const firestore_adapter_1 = require("../firebase/firestore-adapter");
const provider_1 = require("../providers/provider");
const messaging_adapter_1 = require("../firebase/messaging-adapter");
class PredictionCompletionWebhookParameters {
    static parseURL(url) {
        const object = new URL(url);
        const domain = object.hostname;
        const endpoint = object.pathname;
        var query = {};
        for (const entry of object.searchParams.entries()) {
            const key = entry[0];
            const value = entry[1];
            query[key] = value;
        }
        return this.parseQuery(query, domain, endpoint);
    }
    static parseQuery(query, domain, endpoint) {
        var source;
        var user;
        var identifier;
        var parent;
        var additionalParameters = {};
        for (const key in query) {
            const value = query[key];
            switch (key) {
                case "source":
                    source = value;
                    break;
                case "user":
                    user = value;
                    break;
                case "identifier":
                    identifier = value;
                    break;
                case "parent":
                    parent = value;
                    break;
                default:
                    additionalParameters[key] = value;
            }
        }
        if (source == null) {
            return undefined;
        }
        if (user == null) {
            return undefined;
        }
        const parameters = new PredictionCompletionWebhookParameters(domain !== null && domain !== void 0 ? domain : "", endpoint !== null && endpoint !== void 0 ? endpoint : "", source, user, identifier);
        parameters.parent = parent;
        parameters.additionalParameters = additionalParameters;
        return parameters;
    }
    constructor(domain, endpoint, source, user, identifier) {
        this.domain = domain;
        this.endpoint = endpoint;
        this.source = source;
        this.user = user;
        this.identifier = identifier;
    }
    makeURL() {
        var url = `https://${this.domain}/${this.endpoint}?source=${this.source}&user=${this.user}`;
        if (this.identifier != null) {
            url += `&identifier=${this.identifier}`;
        }
        if (this.parent != null) {
            url += `&parent=${this.parent}`;
        }
        for (const key in this.additionalParameters) {
            url += `&${key}=${this.additionalParameters[key]}`;
        }
        return url;
    }
}
exports.PredictionCompletionWebhookParameters = PredictionCompletionWebhookParameters;
;
class PredictionCompletionHook {
    constructor(provider, domain) {
        this.name = "predictionHook";
        this.firestore = new firestore_adapter_1.FirestoreAdapter();
        this.messaging = new messaging_adapter_1.MessagingAdapter();
        this.notification = {
            title: "Your prediction is ready!",
            message: "Tap to check it out"
        };
        this.provider = provider;
        this.domain = domain;
    }
    makeParameters(user, source, identifier, parent) {
        const options = new PredictionCompletionWebhookParameters(this.domain, this.name, user, source);
        options.identifier = identifier;
        options.parent = parent;
        return options;
    }
    async handle(request) {
        Logger.debug(request.query);
        Logger.debug(request.body);
        const userIdentifier = request.query.user;
        const parent = request.query.parent;
        if (userIdentifier == null) {
            Logger.error("No user identifier");
            return {};
        }
        const event = await this.provider.processHook(request.query, request.body);
        if (parent != null) {
            event.identifier = parent;
        }
        switch (event.state) {
            case provider_1.PredictionState.Pending:
                await this.handleUpdate(event, userIdentifier);
                break;
            case provider_1.PredictionState.Completed:
                await this.handleCompletion(event, userIdentifier);
                break;
            case provider_1.PredictionState.Failed:
                await this.handleFailure(event, userIdentifier);
                break;
        }
        return {};
    }
    async handleUpdate(event, userIdentifier) {
        //
    }
    async handleCompletion(event, userIdentifier) {
        const predictionReference = this.firestore.makePredictionReference(userIdentifier, event.identifier);
        await predictionReference.update({
            output: event.output
        });
        const userReference = await this.firestore.prepareUserReference(userIdentifier);
        const user = (await userReference.get()).data();
        await this.messaging.sendCompletionNotification(user, event.identifier, this.notification.title, this.notification.message);
    }
    async handleFailure(event, userIdentifier) {
        const reference = this.firestore.makePredictionReference(userIdentifier, event.identifier);
        await reference.update({
            error: event.error
        });
        await this.firestore.deposit(userIdentifier, 1);
    }
}
exports.PredictionCompletionHook = PredictionCompletionHook;
//# sourceMappingURL=prediction-completion-hook.js.map