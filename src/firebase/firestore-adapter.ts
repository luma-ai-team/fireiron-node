import * as Firestore from "firebase-admin/firestore"
import { User } from "../models/user"
import { Prediction } from "../models/prediction";

export class FirestoreAdapter {
    db: Firestore.Firestore;

    public constructor() {
        this.db = Firestore.getFirestore();
    }

    makePendingPredictionsReference(): Firestore.CollectionReference<Firestore.DocumentData> {
        return this.db.collection("pending");
    }

    makeUsersReference(): Firestore.CollectionReference<Firestore.DocumentData> {
        return this.db.collection("users");
    }

    makeUserReference(identifier: string): Firestore.DocumentReference<Firestore.DocumentData> {
        return this.makeUsersReference().doc(identifier)
    }

    makePredicionsReference(userIdentifier: string): Firestore.CollectionReference<Firestore.DocumentData> {
        return this.makeUserReference(userIdentifier).collection("predictions");
    }

    makePredictionReference(userIdentifier: string, predictionIdentifier?: string): Firestore.DocumentReference<Firestore.DocumentData> {
        if (predictionIdentifier != null) {
            return this.makePredicionsReference(userIdentifier).doc(predictionIdentifier);
        }

        return this.makePredicionsReference(userIdentifier).doc();
    }

    makeProductsReference(): Firestore.DocumentReference<Firestore.DocumentData> {
        return this.db.collection("config").doc("products");
    }

    makeDefaultsReference() {
        return this.db.collection("config").doc("defaults");
    }

    async makeUserData(identifier: string): Promise<User> {
        const defaults = await this.makeDefaultsReference().get();
        const balance = await defaults.data()?.balance ?? 0;
        const redeemLimit = await defaults.data()?.redeemLimit ?? 0;
        return {
            identifier: identifier,
            balance: balance,
            redeemLimit: redeemLimit,
            pushToken: undefined
        };
    }

    public async prepareUserReference(identifier: string): Promise<Firestore.DocumentReference<Firestore.DocumentData>> {
        const reference = this.makeUserReference(identifier);
        const document = await reference.get();

        if (!document.exists) {
            const user = await this.makeUserData(identifier);
            await reference.set(user);
        }
    
        return reference;
    }

    public async fetchRewardAmount(identifier: string): Promise<number> {
        const products = await this.makeProductsReference().get();
        const data = products.data() ?? {};
        return data[identifier] ?? 0;
    }

    public async fetchUserWithAdaptyIdentifier(identifier: string): Promise<User> {
        const snapshot = await this.makeUsersReference().where("adaptyProfile", "==", identifier).get();
        const user = snapshot.docs[0]?.data();
        return user as User;
    }

    public async deposit(userIdentifier: string, amount: number, date?: string) {
        const reference = await this.prepareUserReference(userIdentifier);
        const document = await reference.get();
        const user = document.data() as User;

        if ((user.purchaseDate != null) && (date != null)) {
            const previousPurchaseDate = Date.parse(user.purchaseDate);
            const eventPurchaseDate = Date.parse(date);
            if (previousPurchaseDate >= eventPurchaseDate) {
                return;
            }
        }

        await reference.update({
            balance: Firestore.FieldValue.increment(amount),
            purchaseDate: date
        });
    }

    public async withdraw(userIdentifier: string, amount: number) {
        const reference = await this.prepareUserReference(userIdentifier);
        const user = (await reference.get()).data() as User;
        if (user.balance < amount) {
            throw new Error("Insufficient balance");
        }

        await reference.update({
            balance: Firestore.FieldValue.increment(-amount)
        });
    }

    public async storePrediction(userIdentifier: string, prediction: Prediction) {
        const reference = this.makePredictionReference(userIdentifier, prediction.identifier);
        await reference.set(prediction);
    }

    public async createPrediction(userIdentifier: string, input: Object, cost: number, metadata?: Object): Promise<Prediction> {
        const reference = this.makePredictionReference(userIdentifier);
        const prediction: Prediction = {
            identifier: reference.id,
            input: input,
            cost: cost,
            metadata: metadata
        }
        await reference.set(prediction);
        return prediction;
    }

    public async fetchPrediction(userIdentifier: string, predictionIdentifier: string): Promise<Prediction> {
        const reference = this.makePredictionReference(userIdentifier, predictionIdentifier);
        const document = await reference.get();
        return document.data() as Prediction;
    }
}
