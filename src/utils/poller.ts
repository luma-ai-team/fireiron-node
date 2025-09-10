export class Poller {
    delay: number;
    retryCount: number

    private iteration: number = 0;

    public constructor(delay: number, retryCount: number) {
        this.delay = delay;
        this.retryCount = retryCount;
    }

    public async run<T>(handler: (index: number) => Promise<T>): Promise<T> {
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

    public async runWithFallback<T>(handler: (index: number) => Promise<T>, fallback: T): Promise<T> {
        try {
            return await this.run(handler);
        }
        catch (error) {
            //
        }

        return fallback;
    }
}