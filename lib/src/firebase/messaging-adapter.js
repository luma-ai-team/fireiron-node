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
exports.MessagingAdapter = void 0;
const Messaging = __importStar(require("firebase-admin/messaging"));
const Logger = __importStar(require("firebase-functions/logger"));
class MessagingAdapter {
    async sendCompletionNotification(user, predictionIdentifier, title, message) {
        if (user.pushToken == null) {
            Logger.warn("No push token for " + user.identifier);
            return;
        }
        Logger.debug("Pushing to " + user.identifier + "/" + user.pushToken);
        Messaging.getMessaging().send({
            notification: {
                title: title,
                body: message
            },
            data: {
                identifier: predictionIdentifier
            },
            token: user.pushToken
        });
    }
}
exports.MessagingAdapter = MessagingAdapter;
//# sourceMappingURL=messaging-adapter.js.map