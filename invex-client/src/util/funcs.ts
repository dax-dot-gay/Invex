import { Base64 } from "js-base64";

export function randomBytes(size: number): string {
    const buffer = new Uint8Array(size);
    window.crypto.getRandomValues(buffer);
    return Base64.fromUint8Array(buffer, true).slice(0, size);
}

export function downloadURL(url: string, filename: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
