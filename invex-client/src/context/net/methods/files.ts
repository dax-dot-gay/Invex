import { FileInfo } from "../../../types/files";
import { Response } from "../types";
import { ApiMixinConstructor } from "./base";

export function FilesMixin<TBase extends ApiMixinConstructor>(base: TBase) {
    return class FilesMixin extends base {
        public async upload_file(file: File): Promise<Response<FileInfo>> {
            const form = new FormData();
            form.append("file", file);
            return await this.request<FileInfo>("/files", {
                method: "post",
                data: form,
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
        }

        public async get_file_info(id: string): Promise<FileInfo | null> {
            const result = await this.request<FileInfo>(`/files/${id}/meta`);
            return result.success ? result.data : null;
        }

        public async delete_file(id: string): Promise<void> {
            await this.request<void>(`/files/${id}`, { method: "delete" });
        }
    };
}
