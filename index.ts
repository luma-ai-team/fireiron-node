import { onCall, onRequest } from "firebase-functions/v2/https"
import * as Admin from "firebase-admin"
import * as Firestore from "firebase-admin/firestore";

import { Action } from "./src/actions/action"
import { Webhook } from "./src/webhooks/webhook";

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

    constructor(exports: any) {
        Admin.initializeApp();
        Firestore.getFirestore().settings({
            ignoreUndefinedProperties: true
        });
        this.exports = exports;
    }

    public registerAction<Request>(action: Action<Request>) {
        this.exports[action.name] = onCall( async (request) => {
            return await action.run(request.data as Request)
        });
    }

    public registerWebhook(webhook: Webhook) {
        this.exports[webhook.name] = onRequest( async (request, response) => {
            const result = await webhook.handle(request);
            response.send(result);
        });
    }
}
