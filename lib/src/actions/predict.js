"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictAction = void 0;
const firestore_adapter_1 = require("../firebase/firestore-adapter");
class PredictAction {
    constructor(provider) {
        this.name = "predict";
        this.firestore = new firestore_adapter_1.FirestoreAdapter();
        this.provider = provider;
    }
    async run(payload, userIdentifier) {
        const cost = this.provider.cost(payload);
        try {
            await this.firestore.withdraw(userIdentifier, cost);
        }
        catch (error) {
            return {
                error: error.message
            };
        }
        try {
            const currentTime = Math.floor(Date.now() / 1000);
            const metadata = {
                creationTime: currentTime,
            };
            const prediction = await this.firestore.createPrediction(userIdentifier, payload, cost, metadata);
            return {
                identifier: prediction.identifier
            };
        }
        catch (error) {
            await this.firestore.deposit(userIdentifier, cost);
            throw error;
        }
    }
}
exports.PredictAction = PredictAction;
;
//# sourceMappingURL=predict.js.map