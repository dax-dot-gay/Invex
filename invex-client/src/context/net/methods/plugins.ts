import { Plugin } from "../../../types/plugin";
import { Response } from "../types";
import { ApiMixinConstructor } from "./base";

export function PluginsMixin<TBase extends ApiMixinConstructor>(base: TBase) {
    return class PluginsMixin extends base {
        public async add_plugin_from_file(
            file: File
        ): Promise<Response<Plugin>> {
            const data = new FormData();
            data.append("plugin", file);
            return await this.request<Plugin>("/plugins/add/file", {
                method: "post",
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                data,
            });
        }

        public async add_plugin_from_url(
            url: string
        ): Promise<Response<Plugin>> {
            return await this.request<Plugin>("/plugins/add/url", {
                method: "post",
                headers: {
                    "Content-Type": "application/json",
                },
                data: {
                    url,
                },
            });
        }

        public async list_plugins(): Promise<Response<Plugin[]>> {
            return await this.request<Plugin[]>("/plugins");
        }
    };
}
