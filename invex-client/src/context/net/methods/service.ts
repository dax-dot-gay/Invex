import { Service } from "../../../types/service";
import { Response } from "../types";
import { ApiMixinConstructor } from "./base";

export function ServiceMixin<TBase extends ApiMixinConstructor>(base: TBase) {
    return class ServiceMixin extends base {
        public async createService(
            name: string,
            icon: string | null,
            description: string | null
        ): Promise<Response<Service>> {
            return await this.request<Service>("/services/create", {
                method: "post",
                data: {
                    name,
                    icon,
                    description,
                },
            });
        }

        public async getServices(): Promise<Service[]> {
            const result = await this.request<Service[]>("/services");
            return result.success ? result.data : [];
        }

        public async getService(id: string): Promise<Service | null> {
            const result = await this.request<Service>(`/services/${id}`);
            return result.success ? result.data : null;
        }
    };
}
