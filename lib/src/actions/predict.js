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
    async run(request) {
        const cost = this.provider.cost(request.payload);
        await this.firestore.withdraw(request.user, cost);
        try {
            const currentTime = Math.floor(Date.now() / 1000);
            const metadata = {
                creationTime: currentTime,
            };
            const prediction = await this.firestore.createPrediction(request.user, request.payload, cost, metadata);
            return {
                identifier: prediction.identifier
            };
        }
        catch (error) {
            await this.firestore.deposit(request.user, cost);
            throw error;
        }
    }
}
exports.PredictAction = PredictAction;
;
//# sourceMappingURL=predict.js.map