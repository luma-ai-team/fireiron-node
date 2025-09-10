"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Poller = void 0;
class Poller {
    constructor(delay, retryCount) {
        this.iteration = 0;
        this.delay = delay;
        this.retryCount = retryCount;
    }
    async run(handler) {
        var isFinished = false;
        while (isFinished == false) {
            try {
                return await handler(this.iteration);
            }
            catch (error) {
                //
            }
            this.iteration += 1;
            if (this.iteration > this.retryCount) {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, this.delay * 1000));
        }
        throw new RangeError("Retry count exceeded");
    }
    async runWithFallback(handler, fallback) {
        try {
            return await this.run(handler);
        }
        catch (error) {
            //
        }
        return fallback;
    }
}
exports.Poller = Poller;
//# sourceMappingURL=poller.js.map