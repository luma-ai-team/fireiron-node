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
exports.RedeemAction = void 0;
const Firestore = __importStar(require("firebase-admin/firestore"));
const firestore_adapter_1 = require("../firebase/firestore-adapter");
class RedeemAction {
    constructor() {
        this.name = "redeem";
    }
    async run(request) {
        var _a;
        const adapter = new firestore_adapter_1.FirestoreAdapter();
        const reference = await adapter.prepareUserReference(request.user);
        const document = await reference.get();
        const user = document.data();
        const redeemLimit = (_a = user.redeemLimit) !== null && _a !== void 0 ? _a : 0;
        const availableAmount = Math.max(request.payload.amount, redeemLimit);
        const limit = redeemLimit - availableAmount;
        await reference.update({
            balance: Firestore.FieldValue.increment(availableAmount),
            redeemLimit: limit
        });
        return {};
    }
}
exports.RedeemAction = RedeemAction;
//# sourceMappingURL=redeem.js.map