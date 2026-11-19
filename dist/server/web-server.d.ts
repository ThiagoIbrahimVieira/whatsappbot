export declare class WebServer {
    private server;
    private port;
    private host;
    private staticDir;
    constructor();
    private resolveStaticDir;
    start(port?: number, host?: string): Promise<number>;
    stop(): Promise<void>;
    getPort(): number;
}
export declare const webServer: WebServer;
