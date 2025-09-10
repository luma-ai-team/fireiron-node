export interface Action<Request> {
    name: string;
    run(request: Request): Promise<Object>
}

export interface ScheduledAction {
    name: string;
    run(): Promise<void>
}