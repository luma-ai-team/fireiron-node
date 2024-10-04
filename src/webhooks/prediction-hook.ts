import * as Functions from "firebase-functions/v1"
import * as Logger from "firebase-functions/logger"

import { FirestoreAdapter } from "../firebase/firestore-adapter"
import { PredictionProvider, PredictionState, PredictionUpdateEvent, PredictionCompletionEvent, PredictionFailureEvent } from "../providers/provider";
import { MessagingAdapter } from "../firebase/messaging-adapter";
import { Webhook } from "./webhook";
import { User } from "../models/user"

export type Notification = {
    title: string;
    message: string;
}

export class PredictionHook<Input> implements Webhook {
    public name = "predictionHook";
    provider: PredictionProvider<Input>;

    firestore: FirestoreAdapter = new FirestoreAdapter();
    messaging: MessagingAdapter = new MessagingAdapter();

    public notification: Notification = {
        title: "Your prediction is ready!",
        message: "Tap to check it out"
    };

    public constructor(provider: PredictionProvider<Input>) {
        this.provider = provider;
    }

    public async handle(request: Functions.Request): Promise<Object> {
        Logger.debug(request.query);
        Logger.debug(request.body);

        
        const userIdentifier = request.query.user as string;
        if (userIdentifier == null) {
            Logger.error("No user identifier");
            return {};
        }

        const event = await this.provider.processHook(request.query, request.body);
        switch (event.state) {
            case PredictionState.Pending:
                await this.handleUpdate(event, userIdentifier);
                break;
            case PredictionState.Completed:
                await this.handleCompletion(event, userIdentifier);
                break;
            case PredictionState.Failed:
                await this.handleFailure(event, userIdentifier);
                break;
        }

        return {};
    }

    async handleUpdate(event: PredictionUpdateEvent, userIdentifier: string) {
        //
    }

    async handleCompletion(event: PredictionCompletionEvent, userIdentifier: string) {
        const predictionReference = this.firestore.makePredictionReference(userIdentifier, event.identifier);
        await predictionReference.update({
            output: event.output
        });

        const userReference = await this.firestore.prepareUserReference(userIdentifier);
        const user = (await userReference.get()).data() as User
        await this.messaging.sendCompletionNotification(user, event.identifier, this.notification.title, this.notification.message);
    }

    async handleFailure(event: PredictionFailureEvent, userIdentifier: string) {
        const reference = this.firestore.makePredictionReference(userIdentifier, event.identifier);
        await reference.update({
            error: event.error
        });

        await this.firestore.deposit(userIdentifier, 1);
    }
}