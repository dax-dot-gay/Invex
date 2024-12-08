export function selectFile(contentType: string): Promise<File | null> {
    return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = false;
        input.accept = contentType;
        input.onchange = () => {
            let files = Array.from(input.files ?? []);
            resolve(files.length > 0 ? files[0] : null);
        };
        input.click();
    });
}
