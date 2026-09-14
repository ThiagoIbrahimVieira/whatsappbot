import type { CommandContext, CommandHandler } from '../types/command.js';
import { handlePing } from './handlers/ping.js';
import { handleHelp } from './handlers/help.js';
import { handleStatus } from './handlers/status.js';
import { handleInfo } from './handlers/info.js';
import { handleSticker } from './handlers/sticker.js';
import { handleStatic } from './handlers/static.js';
import { handleVideo } from './handlers/video.js';
import { handleGif } from './handlers/gif.js';
import { handleMeme } from './handlers/meme.js';
import { handleOutline } from './handlers/outline.js';
import { handleShadow } from './handlers/shadow.js';
import { handleRotate, handleFlip, handleMirror, handleCrop } from './handlers/transforms.js';
import { handleTrim, handleFps, handleSpeed, handleSlow } from './handlers/video-tools.js';
import { handleRandom } from './handlers/random.js';
import { handlePack } from './handlers/pack.js';
import { handleMode } from './handlers/mode.js';
import { handleRanking } from './handlers/ranking.js';
import { handleProfile } from './handlers/profile.js';
import { handleVip } from './handlers/vip.js';
import { handleApprove } from './handlers/approve.js';
import { logger } from '../utils/logger.js';

const commandHandlers: Record<string, CommandHandler> = {
  ping: handlePing,
  help: handleHelp,
  status: handleStatus,
  info: handleInfo,
  sticker: handleSticker,
  s: handleSticker,
  static: handleStatic,
  video: handleVideo,
  gif: handleGif,
  meme: handleMeme,
  outline: handleOutline,
  shadow: handleShadow,
  rotate: handleRotate,
  flip: handleFlip,
  mirror: handleMirror,
  crop: handleCrop,
  trim: handleTrim,
  fps: handleFps,
  speed: handleSpeed,
  slow: handleSlow,
  random: handleRandom,
  pack: handlePack,
  meupack: handlePack,
  meuspacks: handlePack,
  packs: handlePack,
  pacote: handlePack,
  pacotes: handlePack,
  mode: handleMode,
  modo: handleMode,
  ranking: handleRanking,
  top: handleRanking,
  rank: handleRanking,
  perfil: handleProfile,
  profile: handleProfile,
  me: handleProfile,
  stats: handleProfile,
  vip: handleVip,
  pix: handleVip,
  assinar: handleVip,
  plano: handleVip,
  planos: handleVip,
  beneficios: handleVip,
  vantagens: handleVip,
  cafe: handleVip,
  doar: handleVip,
  doacao: handleVip,
  aprovar: handleApprove,
  liberar: handleApprove,
};

export class CommandRouter {
  /**
   * Executa o comando solicitado.
   */
  public async route(ctx: CommandContext): Promise<boolean> {
    const cmdName = ctx.command.name;
    const handler = commandHandlers[cmdName];

    if (!handler) {
      logger.debug({ cmdName }, 'Comando não reconhecido recebido em chat privado');
      await ctx.reply(
        '❓ Comando não reconhecido. Digite */help* para ver a lista de comandos disponíveis.'
      );
      return false;
    }

    try {
      logger.info({ cmdName, chatId: ctx.message.chatId }, `Executando comando /${cmdName}`);
      await handler(ctx);
      return true;
    } catch (err) {
      logger.error({ err, cmdName }, `Erro ao executar comando /${cmdName}`);
      await ctx.reply('❌ Ocorreu um erro ao executar esse comando.');
      return false;
    }
  }
}

export const commandRouter = new CommandRouter();
