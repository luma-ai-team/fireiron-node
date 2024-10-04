import * as Functions from "firebase-functions/v1"

export interface Webhook {
    name: string;
    handle(request: Functions.Request): Promise<Object>
}