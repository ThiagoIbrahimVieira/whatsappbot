declare module 'node-webpmux' {
  export class Image {
    width: number;
    height: number;
    hasAnim: boolean;
    hasAlpha: boolean;
    exif?: Buffer;
    load(pathOrBuffer: string | Buffer): Promise<void>;
    save(path: string | null, options?: any): Promise<Buffer>;
  }

  const webpmux: {
    Image: typeof Image;
  };

  export default webpmux;
}
