import { DecodeError } from "@wasm-audio-decoders/common/types";

declare module "ogg-vorbis-decoder" {
  export interface OggVorbisDecodedAudio {
    channelData: Float32Array[];
    samplesDecoded: number;
    sampleRate: number;
    bitDepth: 16;
    errors: DecodeError[];
  }

  export class OggVorbisDecoder {
    ready: Promise<void>;
    reset: () => Promise<void>;
    free: () => void;
    decode: (vorbisData: Uint8Array) => Promise<OggVorbisDecodedAudio>;
    flush: () => Promise<OggVorbisDecodedAudio>;
    decodeFile: (vorbisData: Uint8Array) => Promise<OggVorbisDecodedAudio>;
  }

  export class OggVorbisDecoderWebWorker {
    ready: Promise<void>;
    reset: () => Promise<void>;
    free: () => Promise<void>;
    decode: (vorbisData: Uint8Array) => Promise<OggVorbisDecodedAudio>;
    flush: () => Promise<OggVorbisDecodedAudio>;
    decodeFile: (vorbisData: Uint8Array) => Promise<OggVorbisDecodedAudio>;
  }
}
