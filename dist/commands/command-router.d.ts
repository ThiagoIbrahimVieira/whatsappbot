import type { CommandContext } from '../types/command.js';
export declare class CommandRouter {
    /**
     * Executa o comando solicitado.
     */
    route(ctx: CommandContext): Promise<boolean>;
}
export declare const commandRouter: CommandRouter;
