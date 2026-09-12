import type { ExtractedMessage } from './message.js';

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
  processMedia: (options?: { forceStatic?: boolean; forceAnimated?: boolean }) => Promise<void>;
}

export type CommandHandler = (ctx: CommandContext) => Promise<void>;
