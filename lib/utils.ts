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

/**
 * Parses a YYYY-MM-DD string into a Date object at local midnight.
 * Avoids the UTC-shift bug when using new Date('YYYY-MM-DD').
 * Throws an error if the input is not a valid YYYY-MM-DD string.
 */
export const parseLocalDate = (dateStr: string): Date => {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error(`parseLocalDate: expected 'YYYY-MM-DD' string, got '${dateStr}'`);
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  // Final validation to catch cases like 2026-02-31 (which JS converts to March)
  if (isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new Error(`parseLocalDate: invalid calendar date '${dateStr}'`);
  }
  
  return date;
};
