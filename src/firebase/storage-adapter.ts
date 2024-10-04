import * as Storage from "firebase-admin/storage"
import { Bucket } from '@google-cloud/storage';

export class StorageAdapter {
    bucket: string

    public constructor(bucket: string) {
        this.bucket = bucket
    }

    public makeBucket(): Bucket {
        return Storage.getStorage().bucket(this.bucket);
    }
}