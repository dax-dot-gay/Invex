import { fromByteArray } from "base64-js";

export function randomBytes(size: number): string {
    const buffer = new Uint8Array(size);
    window.crypto.getRandomValues(buffer);
    return fromByteArray(buffer);
}
