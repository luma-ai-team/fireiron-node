export interface Action<Payload> {
    name: string;
    run(payload: Payload, userIdentifier: string): Promise<Object>
}

export interface ScheduledAction {
    name: string;
    run(): Promise<void>
}