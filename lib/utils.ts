// Utility functions to avoid extra dependencies

/**
 * Decodes a base64 string into an ArrayBuffer
 * Necessary for Supabase Storage uploads in React Native
 */
export const decode = (base64: string): ArrayBuffer => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  let bufferLength = base64.length * 0.75;
  if (base64[base64.length - 1] === '=') {
    bufferLength--;
    if (base64[base64.length - 2] === '=') {
      bufferLength--;
    }
  }

  const arraybuffer = new ArrayBuffer(bufferLength);
  const bytes = new Uint8Array(arraybuffer);
  
  let p = 0;
  let len = base64.length;
  
  for (let i = 0; i < len; i += 4) {
    const encoded1 = lookup[base64.charCodeAt(i)];
    const encoded2 = lookup[base64.charCodeAt(i + 1)];
    const encoded3 = lookup[base64.charCodeAt(i + 2)];
    const encoded4 = lookup[base64.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (encoded3 !== 255) { // 255 is filler value for logic, here logic relies on loop skip or check
        // Simplified check:
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    }
    if (encoded4 !== 255 && i + 3 < len && base64[i+3] !== '=') {
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
  }

  return arraybuffer;
};
