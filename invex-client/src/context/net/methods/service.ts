import { ValidatedForm } from "../../../types/plugin";
import { Service, ServiceGrant } from "../../../types/service";
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
            return result.or_default([]);
        }

        public async getService(id: string): Promise<Service | null> {
            const result = await this.request<Service>(`/services/${id}`);
            return result.success ? result.data : null;
        }

        public async deleteService(id: string): Promise<void> {
            await this.request<void>(`/services/${id}`, { method: "delete" });
        }

        public async updateService(
            id: string,
            update: {
                name: string;
                icon: string | null;
                description: string | null;
            }
        ): Promise<Response<Service>> {
            return await this.request<Service>(`/services/${id}/update`, {
                method: "post",
                data: update,
            });
        }

        public async createServiceGrant(
            service: string,
            grant: ServiceGrant
        ): Promise<Response<Service>> {
            return await this.request<Service>(`/services/${service}/grants`, {
                method: "post",
                data: grant,
            });
        }

        public async getServiceGrant(
            service: string,
            grant: string
        ): Promise<ServiceGrant | null> {
            const result = await this.request<ServiceGrant>(
                `/services/${service}/grants/${grant}`
            );
            return result.success ? result.data : null;
        }

        public async updateServiceGrant(
            service: string,
            grant: string,
            update: ServiceGrant
        ): Promise<Response<Service>> {
            return await this.request<Service>(
                `/services/${service}/grants/${grant}`,
                { method: "post", data: update }
            );
        }

        public async deleteServiceGrant(
            service: string,
            grant: string
        ): Promise<void> {
            await this.request<void>(`/services/${service}/grants/${grant}`, {
                method: "delete",
            });
        }

        public async validateServiceGrant(
            service: string,
            grant: string
        ): Promise<Response<[ServiceGrant, ValidatedForm]>> {
            return await this.request<[ServiceGrant, ValidatedForm]>(
                `/services/${service}/grants/${grant}/validated`
            );
        }
    };
}
