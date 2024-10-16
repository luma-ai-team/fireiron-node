import { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { FirestoreEvent } from "firebase-functions/v2/firestore";

export interface FirestoreHook<Input> {
    name: string;
    path: string;

    handle(event: FirestoreEvent<QueryDocumentSnapshot<Input>>): Promise<Object>
}