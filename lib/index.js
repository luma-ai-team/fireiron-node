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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fireiron = void 0;
const https_1 = require("firebase-functions/v2/https");
const Admin = __importStar(require("firebase-admin"));
const Firestore = __importStar(require("firebase-admin/firestore"));
__exportStar(require("./src/firebase/firestore-adapter"), exports);
__exportStar(require("./src/firebase/messaging-adapter"), exports);
__exportStar(require("./src/firebase/storage-adapter"), exports);
__exportStar(require("./src/actions/action"), exports);
__exportStar(require("./src/actions/adapty-link"), exports);
__exportStar(require("./src/actions/fcm-link"), exports);
__exportStar(require("./src/actions/predict"), exports);
__exportStar(require("./src/webhooks/webhook"), exports);
__exportStar(require("./src/webhooks/adapty-hook"), exports);
__exportStar(require("./src/webhooks/prediction-hook"), exports);
__exportStar(require("./src/providers/provider"), exports);
__exportStar(require("./src/providers/replicate/replicate-provider"), exports);
__exportStar(require("./src/models/user"), exports);
__exportStar(require("./src/models/request"), exports);
__exportStar(require("./src/models/prediction"), exports);
class Fireiron {
    constructor(exports) {
        Admin.initializeApp();
        Firestore.getFirestore().settings({
            ignoreUndefinedProperties: true
        });
        this.exports = exports;
    }
    registerAction(action) {
        this.exports[action.name] = (0, https_1.onCall)(async (request) => {
            return await action.run(request.data);
        });
    }
    registerWebhook(webhook) {
        this.exports[webhook.name] = (0, https_1.onRequest)(async (request, response) => {
            const result = await webhook.handle(request);
            response.send(result);
        });
    }
}
exports.Fireiron = Fireiron;
//# sourceMappingURL=index.js.map