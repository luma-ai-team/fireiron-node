import * as Storage from "firebase-admin/storage"
import { Bucket } from '@google-cloud/storage';

import axios, { Axios } from "axios"
import fs from "fs";
import util from "util";
import stream from "stream";

export class StorageAdapter {
    bucket: string
    client: Axios;
    temporaryFiles: string[] = [];

    pipeline: Function = util.promisify(stream.pipeline);

    public constructor(bucket: string) {
        this.bucket = bucket;
        this.client = axios.create();
    }

    public makeBucket(): Bucket {
        return Storage.getStorage().bucket(this.bucket);
    }

    public async downloadTemporaryCopy(url: string, filename: string): Promise<string> {
        const target = "/tmp/" + filename;
        const response = await this.client.get(url, {
            responseType: "stream"
        });
        await this.pipeline(response.data, fs.createWriteStream(target));
        this.temporaryFiles.push(target);
        return target;
    }
    
    public async deleteTemporaryCopy(filename: string) {
        const target = "/tmp/" + filename; 
        fs.unlinkSync(target);

        this.temporaryFiles = this.temporaryFiles.filter(path => { 
            return path != target;
        });
    }
    
    public async makeTemporaryFile(filename: string, content?: any) {
        const target = "/tmp/" + filename;
        if (content != null) {
            fs.writeFileSync(target, content);
        }

        this.temporaryFiles.push(target);
        return target;
    }

    public async cleanup() {
        for (var path of this.temporaryFiles) {
            fs.unlinkSync(path);
        }
        this.temporaryFiles = [];
    }

    public async upload(source: string, target: string): Promise<string> {
        const bucket = this.makeBucket();
        const [file, _] = await bucket.upload(source, {
            destination: target
        });
        const targetURL = await Storage.getDownloadURL(file);
        return targetURL;
    }
}