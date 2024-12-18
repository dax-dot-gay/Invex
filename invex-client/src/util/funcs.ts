import { Base64 } from "js-base64";

export function randomBytes(size: number): string {
    const buffer = new Uint8Array(size);
    window.crypto.getRandomValues(buffer);
    return Base64.fromUint8Array(buffer, true).slice(0, size);
}
