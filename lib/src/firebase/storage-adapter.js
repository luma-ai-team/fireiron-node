"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageAdapter = void 0;
const Storage = __importStar(require("firebase-admin/storage"));
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const util_1 = __importDefault(require("util"));
const stream_1 = __importDefault(require("stream"));
class StorageAdapter {
    constructor(bucket) {
        this.temporaryFiles = [];
        this.pipeline = util_1.default.promisify(stream_1.default.pipeline);
        this.bucket = bucket;
        this.client = axios_1.default.create();
    }
    makeBucket() {
        return Storage.getStorage().bucket(this.bucket);
    }
    async downloadTemporaryCopy(url, filename) {
        const target = "/tmp/" + filename;
        const response = await this.client.get(url, {
            responseType: "stream"
        });
        await this.pipeline(response.data, fs_1.default.createWriteStream(target));
        this.temporaryFiles.push(target);
        return target;
    }
    async deleteTemporaryCopy(filename) {
        const target = "/tmp/" + filename;
        fs_1.default.unlinkSync(target);
        this.temporaryFiles = this.temporaryFiles.filter(path => {
            return path != target;
        });
    }
    makeTemporaryFile(filename, content) {
        const target = "/tmp/" + filename;
        if (content != null) {
            fs_1.default.writeFileSync(target, content);
        }
        this.temporaryFiles.push(target);
        return target;
    }
    async cleanup() {
        for (var path of this.temporaryFiles) {
            fs_1.default.unlinkSync(path);
        }
        this.temporaryFiles = [];
    }
    async upload(source, target) {
        const bucket = this.makeBucket();
        const [file, _] = await bucket.upload(source, {
            destination: target
        });
        const targetURL = await Storage.getDownloadURL(file);
        return targetURL;
    }
}
exports.StorageAdapter = StorageAdapter;
//# sourceMappingURL=storage-adapter.js.map