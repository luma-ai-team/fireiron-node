import { FirestoreAdapter } from "../firebase/firestore-adapter"
import { Webhook } from "./webhook"
import * as Functions from "firebase-functions/v1"
import * as Logger from "firebase-functions/logger"

export class AdaptyHook implements Webhook {
    public name = "adaptyHook";
    firestore: FirestoreAdapter = new FirestoreAdapter();

    public async handle(request: Functions.Request): Promise<Object> {
        Logger.debug(request.body);
    
        if (request.body.adapty_check != null) {
            return {
                adapty_check_response: request.body.adapty_check
            };
        }

        var userIdentifier = null;
        if (request.body.customer_user_id != null) {
            userIdentifier = request.body.customer_user_id;
        }
        else if (request.body.profile_id != null) {
            const user = await this.firestore.fetchUserWithAdaptyIdentifier(request.body.profile_id);
            userIdentifier = user.identifier;
        }

        if (userIdentifier == null) {
            Logger.warn("No valid user id found");
            return {};
        }

        await this.deposit(userIdentifier, request);
        return {};
    }

    async deposit(userIdentifier: string, request: Functions.Request) {
        const eventType = request.body.event_type;
        const event = request.body.event_properties;
        const product = event.vendor_product_id;
        const targetEventTypes = ["access_level_updated", "non_subscription_purchase"]
        if (targetEventTypes.includes(eventType) == false) {
            return;
        }

        const amount = await this.firestore.fetchRewardAmount(product);
        Logger.log("Depositing " + amount + " for user " + userIdentifier);

        await this.firestore.deposit(userIdentifier, amount, event.purchase_date);
    }
}
