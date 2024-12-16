import { AxiosError } from "axios";
import {
    MethodCall,
    MethodResponse,
    MethodResult,
    Plugin,
    PluginConfig,
    PluginMeta,
    ValidatedForm,
} from "../../../types/plugin";
import { Response } from "../types";
import { ApiMixinConstructor } from "./base";
import { isString } from "lodash";

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

        public async preview_plugin_from_file(
            file: File
        ): Promise<Response<PluginMeta>> {
            const data = new FormData();
            data.append("plugin", file);
            return await this.request<PluginMeta>("/plugins/preview/file", {
                method: "post",
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                data,
            });
        }

        public async preview_plugin_from_url(
            url: string
        ): Promise<Response<PluginMeta>> {
            return await this.request<PluginMeta>("/plugins/preview/url", {
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

        public async delete_plugin(id: string): Promise<void> {
            await this.request<void>(`/plugins/${id}`, { method: "delete" });
        }

        public async enable_plugin(id: string): Promise<void> {
            await this.request<void>(`/plugins/${id}/enable`, {
                method: "post",
            });
        }

        public async disable_plugin(id: string): Promise<void> {
            await this.request<void>(`/plugins/${id}/disable`, {
                method: "post",
            });
        }

        public async plugin_config_create(
            plugin: string,
            name: string,
            options: { [key: string]: any },
            icon?: string
        ): Promise<Response<PluginConfig>> {
            return await this.request<PluginConfig>(
                `/plugins/${plugin}/configs`,
                {
                    method: "post",
                    data: {
                        name,
                        icon: icon ?? undefined,
                        options,
                    },
                }
            );
        }

        public async plugin_config_list(
            plugin: string
        ): Promise<PluginConfig[]> {
            return (
                await this.request<PluginConfig[]>(`/plugins/${plugin}/configs`)
            ).or_default([]);
        }

        public async plugin_config_get(
            plugin: string,
            config_id: string
        ): Promise<PluginConfig | null> {
            return (
                await this.request<PluginConfig>(
                    `/plugins/${plugin}/configs/${config_id}`
                )
            ).or_default(null);
        }

        public async plugin_config_edit(
            plugin: string,
            config_id: string,
            name: string,
            options: { [key: string]: any },
            icon?: string
        ): Promise<Response<PluginConfig>> {
            return await this.request<PluginConfig>(
                `/plugins/${plugin}/configs/${config_id}`,
                {
                    method: "post",
                    data: {
                        name,
                        icon: icon ?? undefined,
                        options,
                    },
                }
            );
        }

        public async plugin_config_delete(
            plugin: string,
            config_id: string
        ): Promise<void> {
            await this.request<PluginConfig>(
                `/plugins/${plugin}/configs/${config_id}`,
                { method: "delete" }
            );
        }

        public async plugin_config_list_validated(
            plugin: string
        ): Promise<{ [key: string]: [PluginConfig, ValidatedForm] }> {
            return (
                await this.request<{
                    [key: string]: [PluginConfig, ValidatedForm];
                }>(`/plugins/${plugin}/configs/validated`)
            ).or_default({});
        }

        public async call_plugin_method<T extends MethodCall["method"]>(
            plugin: string,
            method: T,
            options: Omit<Extract<MethodCall, { method: T }>, "method">
        ): Promise<MethodResponse<T>> {
            const result = await this.request<MethodResult<T>>(
                `/plugins/${plugin}/call`,
                {
                    method: "post",
                    data: {
                        method,
                        ...options,
                    },
                }
            );

            return result.resolve(
                (data) => new MethodResponse(data),
                (error: AxiosError) => {
                    if (error.response) {
                        return new MethodResponse({
                            type: "failure",
                            code: error.response.status,
                            reason: isString(error.response.data)
                                ? error.response.data
                                : error.response.statusText,
                        });
                    } else if (error.request) {
                        return new MethodResponse({
                            type: "failure",
                            code: -1,
                            reason: error.message,
                        });
                    } else {
                        return new MethodResponse({
                            type: "failure",
                            code: -2,
                            reason: error.message,
                        });
                    }
                }
            );
        }
    };
}
