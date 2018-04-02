const omggif = require('omggif');
import createImageData from './create_image_data';

export interface Frame {
    readonly info: any
    readonly data: ImageData;
}

export interface Gif {
    readonly width: number
    readonly height: number
    readonly frames: Frame[]
}

/**
 * Get a file as binary data.
 */
const loadBinaryData = (url: string): Promise<Uint8Array> => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "arraybuffer";

    const p = new Promise<Uint8Array>((resolve, reject) => {
        xhr.onload = () => {
            if (xhr.status !== 200)
                return reject(`Could not load: ${url}`);
            const arrayBuffer = xhr.response;
            resolve(new Uint8Array(arrayBuffer));
        };
    });
    xhr.send(null);
    return p;
};

/**
 * Extract metadata and frames from binary gif data.
 */
export const decodeGif = (byteArray: Uint8Array): Gif => {
    const gr = new omggif.GifReader(byteArray);
    return {
        width: gr.width,
        height: gr.height,
        frames: extractGifFrameData(gr)
    };
};

/**
 * Extract each frame of metadata / frame data  from a gif.
 */
const extractGifFrameData = (reader: any): Frame[] => {
    const frames: Frame[] = []
    const { width, height } = reader;

    let previousImageData;
    for (let i = 0, len = reader.numFrames(); i < len; ++i) {
        const info = reader.frameInfo(i);
        const imageData = createImageData(width, height);
        if (previousImageData) {
            for (let i = 0, len = previousImageData.data.length; i < len; ++i) {
                imageData.data[i] = previousImageData.data[i];
            }
        }

        reader.decodeAndBlitFrameRGBA(i, imageData.data);
        frames.push({ info, data: imageData });
        previousImageData = imageData;
    }
    return frames;
};

/**
 * Load and decode a gif.
 */
export const loadGif = (url: string): Promise<Gif> =>
    loadBinaryData(url).then(decodeGif);
