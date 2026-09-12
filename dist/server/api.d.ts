import type { IncomingMessage, ServerResponse } from 'node:http';
export declare function handleApiRequest(req: IncomingMessage, res: ServerResponse, urlPath: string): Promise<boolean>;
