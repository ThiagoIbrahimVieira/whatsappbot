import type { IncomingMessage, ServerResponse } from 'node:http';
export declare function handleApiRequest(req: IncomingMessage, res: ServerResponse, rawUrlPath: string): Promise<boolean>;
