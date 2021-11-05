import fs from "fs/promises";
import path from "path";
import CodecParser from "codec-parser";

import { testDecoder_decode, testDecoder_decodeFrames } from "./utilities";

import { MPEGDecoder, MPEGDecoderWebWorker } from "../src/mpg123-decoder/index";
import { OpusDecoder, OpusDecoderWebWorker } from "../src/opus-decoder/index";
import {
  OggOpusDecoder,
  OggOpusDecoderWebWorker,
} from "../src/ogg-opus-decoder/index";

const EXPECTED_PATH = new URL("expected", import.meta.url).pathname;
const ACTUAL_PATH = new URL("actual", import.meta.url).pathname;
const TEST_DATA_PATH = new URL("data", import.meta.url).pathname;

const getTestPaths = (fileName) => ({
  fileName,
  inputPath: path.join(TEST_DATA_PATH, fileName),
  actualPath: path.join(ACTUAL_PATH, fileName + ".wav"),
  expectedPath: path.join(EXPECTED_PATH, fileName + ".wav"),
});

describe("mpg123-decoder", () => {
  it("should decode mpeg", async () => {
    const decoder = new MPEGDecoder();
    await decoder.ready;

    const fileName = "mpeg.cbr.mp3";
    const paths = getTestPaths(fileName);

    const { sampleRate, samplesDecoded } = await testDecoder_decode(
      decoder,
      fileName,
      paths.inputPath,
      paths.actualPath
    );

    decoder.free();

    const [actual, expected] = await Promise.all([
      fs.readFile(paths.actualPath),
      fs.readFile(paths.expectedPath),
    ]);

    expect(samplesDecoded).toEqual(3499776);
    expect(sampleRate).toEqual(44100);
    expect(actual.length).toEqual(expected.length);
    expect(Buffer.compare(actual, expected)).toEqual(0);
  });

  it("should decode mpeg in a web worker", async () => {
    const decoder = new MPEGDecoderWebWorker();
    await decoder.ready;

    const paths = getTestPaths("mpeg.cbr.mp3");

    const { sampleRate, samplesDecoded } = await testDecoder_decode(
      decoder,
      paths.fileName,
      paths.inputPath,
      paths.actualPath
    );

    decoder.terminate();

    const [actual, expected] = await Promise.all([
      fs.readFile(paths.actualPath),
      fs.readFile(paths.expectedPath),
    ]);

    expect(samplesDecoded).toEqual(3499776);
    expect(sampleRate).toEqual(44100);
    expect(actual.length).toEqual(expected.length);
    expect(Buffer.compare(actual, expected)).toEqual(0);
  });

  /*it("should decode a large mpeg", async () => {
    const decoder = new MPEGDecoder();
    await decoder.ready;

    const fileName = "waug-edm-fest-spr-2015.mp3";
    const paths = getTestPaths(fileName);

    const { sampleRate, samplesDecoded } = await testDecoder_decode(
      decoder,
      fileName,
      paths.inputPath,
      paths.actualPath
    );

    decoder.free()

    expect(samplesDecoded).toEqual(751564800);
    expect(sampleRate).toEqual(44100);
  }, 100000);*/

  describe("frame decoding", () => {
    let fileName,
      paths,
      frames = [],
      framesLength = 0;

    beforeAll(async () => {
      fileName = "mpeg.cbr.mp3";
      paths = getTestPaths("frames.mpeg.cbr.mp3");

      const parser = new CodecParser("audio/mpeg");
      const inputData = await fs.readFile(getTestPaths(fileName).inputPath);

      for (const { data } of parser.iterator(inputData)) {
        frames.push(data);
        framesLength += data.length;
      }
    });

    it("should decode mpeg frames", async () => {
      const decoder = new MPEGDecoder();
      await decoder.ready;

      const { sampleRate, samplesDecoded } = await testDecoder_decodeFrames(
        decoder,
        fileName,
        frames,
        framesLength,
        paths.actualPath
      );

      const [actual, expected] = await Promise.all([
        fs.readFile(paths.actualPath),
        fs.readFile(paths.expectedPath),
      ]);

      decoder.free();

      expect(samplesDecoded).toEqual(3497472);
      expect(sampleRate).toEqual(44100);
      expect(actual.length).toEqual(expected.length);
      expect(Buffer.compare(actual, expected)).toEqual(0);
    });

    it("should decode mpeg frames in a web worker", async () => {
      const decoder = new MPEGDecoderWebWorker();
      await decoder.ready;

      const { sampleRate, samplesDecoded } = await testDecoder_decodeFrames(
        decoder,
        fileName,
        frames,
        framesLength,
        paths.actualPath
      );

      const [actual, expected] = await Promise.all([
        fs.readFile(paths.actualPath),
        fs.readFile(paths.expectedPath),
      ]);

      decoder.terminate();

      expect(samplesDecoded).toEqual(3497472);
      expect(sampleRate).toEqual(44100);
      expect(actual.length).toEqual(expected.length);
      expect(Buffer.compare(actual, expected)).toEqual(0);
    });
  });
});

describe("opus-decoder", () => {
  let fileName,
    paths,
    frames = [],
    framesLength = 0;

  beforeAll(async () => {
    fileName = "ogg.opus";
    paths = getTestPaths("frames.opus");

    const parser = new CodecParser("application/ogg");
    const inputData = await fs.readFile(getTestPaths(fileName).inputPath);

    for (const { codecFrames } of parser.iterator(inputData)) {
      for (const { data } of codecFrames) {
        frames.push(data);
        framesLength += data.length;
      }
    }
  });

  it("should decode opus frames", async () => {
    const decoder = new OpusDecoder();
    await decoder.ready;

    const { sampleRate, samplesDecoded } = await testDecoder_decodeFrames(
      decoder,
      fileName,
      frames,
      framesLength,
      paths.actualPath
    );

    const [actual, expected] = await Promise.all([
      fs.readFile(paths.actualPath),
      fs.readFile(paths.expectedPath),
    ]);

    decoder.free();

    expect(samplesDecoded).toEqual(3791040);
    expect(sampleRate).toEqual(48000);
    expect(actual.length).toEqual(expected.length);
    expect(Buffer.compare(actual, expected)).toEqual(0);
  });

  it("should decode opus frames in a web worker", async () => {
    const decoder = new OpusDecoderWebWorker();
    await decoder.ready;

    const { sampleRate, samplesDecoded } = await testDecoder_decodeFrames(
      decoder,
      fileName,
      frames,
      framesLength,
      paths.actualPath
    );

    const [actual, expected] = await Promise.all([
      fs.readFile(paths.actualPath),
      fs.readFile(paths.expectedPath),
    ]);

    decoder.terminate();

    expect(samplesDecoded).toEqual(3791040);
    expect(sampleRate).toEqual(48000);
    expect(actual.length).toEqual(expected.length);
    expect(Buffer.compare(actual, expected)).toEqual(0);
  });
});

describe("ogg-opus-decoder", () => {
  it("should decode ogg opus", async () => {
    const decoder = new OggOpusDecoder();
    await decoder.ready;

    const fileName = "ogg.opus";
    const paths = getTestPaths(fileName);

    const { sampleRate, samplesDecoded } = await testDecoder_decode(
      decoder,
      fileName,
      paths.inputPath,
      paths.actualPath
    );

    decoder.free();

    const [actual, expected] = await Promise.all([
      fs.readFile(paths.actualPath),
      fs.readFile(paths.expectedPath),
    ]);

    expect(samplesDecoded).toEqual(3806842);
    expect(sampleRate).toEqual(48000);
    expect(actual.length).toEqual(expected.length);
    expect(Buffer.compare(actual, expected)).toEqual(0);
  });

  it("should decode ogg opus in a web worker", async () => {
    const decoder = new OggOpusDecoderWebWorker();
    await decoder.ready;

    const paths = getTestPaths("ogg.opus");

    const { sampleRate, samplesDecoded } = await testDecoder_decode(
      decoder,
      paths.fileName,
      paths.inputPath,
      paths.actualPath
    );

    decoder.terminate();

    const [actual, expected] = await Promise.all([
      fs.readFile(paths.actualPath),
      fs.readFile(paths.expectedPath),
    ]);

    expect(samplesDecoded).toEqual(3806842);
    expect(sampleRate).toEqual(48000);
    expect(actual.length).toEqual(expected.length);
    expect(Buffer.compare(actual, expected)).toEqual(0);
  });
});