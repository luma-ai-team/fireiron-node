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

export class PredictionCompletionWebhookParameters {
    public domain: string;
    public endpoint: string;
    public source: string;
    public user: string;
    public identifier?: string;
    public parent?: string;
    public additionalParameters: any;

    public static parseURL(url: string): PredictionCompletionWebhookParameters | undefined {
        const object = new URL(url);
        const domain = object.hostname;
        const endpoint = object.pathname;
        
        var query: any = {};
        for (const entry of object.searchParams.entries()) {
            const key = entry[0];
            const value = entry[1];
            query[key] = value;
        }

        return this.parseQuery(query, domain, endpoint);
    }

    public static parseQuery(query: any, domain?: string, endpoint?: string): PredictionCompletionWebhookParameters | undefined {
        var source: string | undefined;
        var user: string | undefined;
        var identifier: string | undefined;
        var parent: string | undefined;
        var additionalParameters: any = {};

        for (const key in query) {
            const value = query[key];
            switch (key) {
                case "source":
                    source = value;
                    break;
                case "user":
                    user = value;
                    break;
                case "identifier":
                    identifier = value;
                    break;
                case "parent":
                    parent = value;
                    break;
                default:
                    additionalParameters[key] = value;
            }
        }

        if (source == null) {
            return undefined;
        }
        
        if (user == null) {
            return undefined;
        }

        const parameters = new PredictionCompletionWebhookParameters(domain ?? "", endpoint ?? "", source, user, identifier)
        parameters.parent = parent;
        parameters.additionalParameters = additionalParameters;
        return parameters;
    }

    public constructor(domain: string, endpoint: string, source: string, user: string, identifier?: string) {
        this.domain = domain;
        this.endpoint = endpoint;
        this.source = source;
        this.user = user;
        this.identifier = identifier;
    }

    public makeURL(): string {
        var url = `https://${this.domain}/${this.endpoint}?source=${this.source}&user=${this.user}`;
        if (this.identifier != null) {
            url += `&identifier=${this.identifier}`;
        }

        if (this.parent != null) {
            url += `&parent=${this.parent}`;
        }

        for (const key in this.additionalParameters) {
            url += `&${key}=${this.additionalParameters[key]}`;
        }

        return url;
    }
};

export class PredictionCompletionHook<Input> implements Webhook {
    public name = "predictionHook";
    provider: PredictionProvider<Input>;
    domain: string;

    firestore: FirestoreAdapter = new FirestoreAdapter();
    messaging: MessagingAdapter = new MessagingAdapter();

    public notification: Notification = {
        title: "Your prediction is ready!",
        message: "Tap to check it out"
    };

    public constructor(provider: PredictionProvider<Input>, domain: string) {
        this.provider = provider;
        this.domain = domain;
    }

    public makeParameters(user: string, source: string, identifier?: string, parent?: string): PredictionCompletionWebhookParameters {
        const options = new PredictionCompletionWebhookParameters(this.domain, this.name, source, user);
        options.identifier = identifier;
        options.parent = parent;
        return options;
    }

    public async handle(request: Functions.Request): Promise<Object> {
        Logger.debug(request.query);
        Logger.debug(request.body);

        const userIdentifier = request.query.user as string;
        const parent = request.query.parent;

        if (userIdentifier == null) {
            Logger.error("No user identifier");
            return {};
        }

        const event = await this.provider.processHook(request.query, request.body);
        if (parent != null) {
            event.identifier = parent as string
        }

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
        const data = await this.firestore.fetchPrediction(userIdentifier, event.identifier);
        await reference.update({
            error: event.error
        });

        await this.firestore.deposit(userIdentifier, data.cost ?? 1);
    }
}