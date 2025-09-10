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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fireiron = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const Admin = __importStar(require("firebase-admin"));
const Firestore = __importStar(require("firebase-admin/firestore"));
const Logger = __importStar(require("firebase-functions/logger"));
const scheduler_1 = require("firebase-functions/scheduler");
__exportStar(require("./src/firebase/firestore-adapter"), exports);
__exportStar(require("./src/firebase/messaging-adapter"), exports);
__exportStar(require("./src/firebase/storage-adapter"), exports);
__exportStar(require("./src/actions/action"), exports);
__exportStar(require("./src/actions/adapty-link"), exports);
__exportStar(require("./src/actions/fcm-link"), exports);
__exportStar(require("./src/actions/predict"), exports);
__exportStar(require("./src/actions/redeem"), exports);
__exportStar(require("./src/webhooks/webhook"), exports);
__exportStar(require("./src/webhooks/adapty-hook"), exports);
__exportStar(require("./src/webhooks/prediction-completion-hook"), exports);
__exportStar(require("./src/dbhooks/firestore-hook"), exports);
__exportStar(require("./src/dbhooks/prediction-request-hook"), exports);
__exportStar(require("./src/providers/provider"), exports);
__exportStar(require("./src/providers/replicate/replicate-provider"), exports);
__exportStar(require("./src/models/user"), exports);
__exportStar(require("./src/models/request"), exports);
__exportStar(require("./src/models/prediction"), exports);
class Fireiron {
    constructor(exports) {
        this.isLoggingEnabled = false;
        this.prefix = "";
        Admin.initializeApp();
        Firestore.getFirestore().settings({
            ignoreUndefinedProperties: true
        });
        this.exports = exports;
    }
    registerAction(action, options = {}) {
        const name = this.makeExportName(action.name);
        this.exports[name] = (0, https_1.onCall)(options, async (request) => {
            if (this.isLoggingEnabled) {
                Logger.log(request.data);
            }
            return await action.run(request.data);
        });
    }
    registerScheduledAction(action, schedule, options = {}) {
        const name = this.makeExportName(action.name);
        this.exports[name] = (0, scheduler_1.onSchedule)(schedule, async (request) => {
            return await action.run();
        });
    }
    registerDocumentCreateHook(hook, options = {}) {
        var documentOptions = options;
        documentOptions["document"] = hook.path;
        const name = this.makeExportName(hook.name);
        this.exports[name] = (0, firestore_1.onDocumentCreated)(documentOptions, async (event) => {
            if (this.isLoggingEnabled) {
                Logger.log(event);
            }
            await hook.handle(event);
        });
    }
    registerWebhook(webhook, options = {}) {
        const name = this.makeExportName(webhook.name);
        this.exports[name] = (0, https_1.onRequest)(options, async (request, response) => {
            if (this.isLoggingEnabled) {
                Logger.log(request.query, request.body);
            }
            const result = await webhook.handle(request);
            response.send(result);
        });
    }
    makeExportName(name) {
        return `${this.prefix}-${name}`;
    }
}
exports.Fireiron = Fireiron;
//# sourceMappingURL=index.js.map