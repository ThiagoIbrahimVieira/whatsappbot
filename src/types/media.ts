export type MediaType =
  | 'IMAGE'
  | 'VIDEO'
  | 'GIF'
  | 'TEXT'
  | 'AUDIO'
  | 'DOCUMENT'
  | 'STICKER'
  | 'UNKNOWN';

export interface MediaInfo {
  type: MediaType;
  mimetype: string;
  filesize?: number;
  width?: number;
  height?: number;
  duration?: number;
  isGif?: boolean;
}

export interface ProcessingOptions {
  forceStatic?: boolean;
  forceAnimated?: boolean;
  maxDurationSeconds?: number;
  quality?: number;
  fps?: number;
  // Fases B, C, D, E:
  memeText?: string;
  topText?: string;
  bottomText?: string;
  memeStyle?: 'modern' | 'classic';
  staticTimestamp?: number | 'middle';
  trimSeconds?: number;
  speed?: number;
  rotate?: number;
  flip?: boolean;
  mirror?: boolean;
  crop?: 'square' | 'portrait' | 'auto';
  outline?: boolean | string;
  shadow?: boolean | 'soft' | 'hard';
  preset?: string;
}

export interface ProcessingResult {
  outputPath: string;
  outputBuffer: Buffer;
  mimetype: string;
  isAnimated: boolean;
  width: number;
  height: number;
  sizeBytes: number;
  processingTimeMs: number;
}
