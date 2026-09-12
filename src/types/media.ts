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
