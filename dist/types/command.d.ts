import type { ExtractedMessage } from './message.js';
import type { ProcessingOptions } from './media.js';
export interface ParsedCommand {
    name: string;
    args: string[];
    rawText: string;
    isCommand: boolean;
}
export interface CommandContext {
    message: ExtractedMessage;
    command: ParsedCommand;
    reply: (text: string) => Promise<void>;
    processMedia: (options?: ProcessingOptions) => Promise<void>;
}
export type CommandHandler = (ctx: CommandContext) => Promise<void>;
