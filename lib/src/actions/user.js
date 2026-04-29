"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAction = void 0;
const firestore_adapter_1 = require("../firebase/firestore-adapter");
class UserAction {
    constructor() {
        this.name = "user";
    }
    async run(payload, userIdentifier) {
        var _a, _b;
        const adapter = new firestore_adapter_1.FirestoreAdapter();
        const reference = await adapter.prepareUserReference(userIdentifier);
        if ((_a = payload.link) === null || _a === void 0 ? void 0 : _a.paymentToken) {
            await reference.update({
                paymentToken: payload.link.paymentToken
            });
        }
        if ((_b = payload.link) === null || _b === void 0 ? void 0 : _b.notificationToken) {
            await reference.update({
                notificationToken: payload.link.notificationToken
            });
        }
        return {};
    }
}
exports.UserAction = UserAction;
//# sourceMappingURL=user.js.map