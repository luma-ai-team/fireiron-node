import * as Messaging from "firebase-admin/messaging";
import * as Logger from "firebase-functions/logger"
import { User } from "../models/user"

export class MessagingAdapter {
    public async sendCompletionNotification(user: User, predictionIdentifier: string, title: string, message: string) {
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