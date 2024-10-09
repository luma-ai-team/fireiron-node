import { CallableOptions, HttpsOptions, onCall, onRequest } from "firebase-functions/v2/https"
import * as Admin from "firebase-admin"
import * as Firestore from "firebase-admin/firestore";
import * as Logger from "firebase-functions/logger"

import { Action } from "./src/actions/action"
import { Webhook } from "./src/webhooks/webhook";

export * from "./src/firebase/firestore-adapter";
export * from "./src/firebase/messaging-adapter";
export * from "./src/firebase/storage-adapter";

export * from "./src/actions/action";
export * from "./src/actions/adapty-link";
export * from "./src/actions/fcm-link";
export * from "./src/actions/predict";

export * from "./src/webhooks/webhook";
export * from "./src/webhooks/adapty-hook";
export * from "./src/webhooks/prediction-hook";

export * from "./src/providers/provider";
export * from "./src/providers/replicate/replicate-provider";

export * from "./src/models/user";
export * from "./src/models/request";
export * from "./src/models/prediction";

export class Fireiron {
    exports: any;
    public isLoggingEnabled: boolean = false;

    constructor(exports: any) {
        Admin.initializeApp();
        Firestore.getFirestore().settings({
            ignoreUndefinedProperties: true
        });
        this.exports = exports;
    }

    public registerAction<Request>(action: Action<Request>, options: CallableOptions = {}) {
        this.exports[action.name] = onCall(options, async (request) => {
            if (this.isLoggingEnabled) {
                Logger.log(request.data);
            }

            return await action.run(request.data as Request)
        });
    }

    public registerWebhook(webhook: Webhook, options: HttpsOptions = {}) {
        this.exports[webhook.name] = onRequest(options, async (request, response) => {
            if (this.isLoggingEnabled) {
                Logger.log(request.query, request.body);
            }

            const result = await webhook.handle(request);
            response.send(result);
        });
    }
}
