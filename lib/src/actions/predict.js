"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictAction = void 0;
const firestore_adapter_1 = require("../firebase/firestore-adapter");
class PredictAction {
    constructor() {
        this.name = "predict";
        this.cost = 1;
        this.firestore = new firestore_adapter_1.FirestoreAdapter();
        //
    }
    async run(request) {
        await this.firestore.withdraw(request.user, this.cost);
        try {
            const prediction = await this.firestore.createPrediction(request.user, request.payload);
            return {
                identifier: prediction.identifier
            };
        }
        catch (error) {
            await this.firestore.deposit(request.user, this.cost);
            throw error;
        }
    }
}
exports.PredictAction = PredictAction;
;
//# sourceMappingURL=predict.js.map