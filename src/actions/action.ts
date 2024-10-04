export interface Action<Request> {
    name: string;
    run(request: Request): Promise<Object>
}