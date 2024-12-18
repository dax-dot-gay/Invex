import { Expiration, Invite } from "../../../types/invite";
import { Paginated, Response } from "../types";
import { ApiMixinConstructor } from "./base";

export function InviteMixin<TBase extends ApiMixinConstructor>(base: TBase) {
    return class InviteMixin extends base {
        public async paginate_invites(
            page: number,
            size: number
        ): Promise<Paginated<Invite>> {
            return (
                await this.request<Paginated<Invite>>("/invites/", {
                    params: {
                        page,
                        size,
                    },
                })
            ).or_default({ offset: 0, total: 0, results: [] });
        }

        public async get_invite(id: string): Promise<Invite | null> {
            return (await this.request<Invite>(`/invites/${id}`)).or_default(
                null
            );
        }

        public async create_invite(
            code: string,
            services: string[],
            expiration?: Expiration | null
        ): Promise<Response<Invite>> {
            return await this.request<Invite>("/invites", {
                method: "post",
                data: {
                    code,
                    services,
                    expiration: expiration ?? null,
                },
            });
        }
    };
}
