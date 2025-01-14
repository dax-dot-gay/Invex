import { RedeemingInvite } from "../../../types/client";
import { Response } from "../types";
import { ApiMixinConstructor } from "./base";

export function ClientMixin<TBase extends ApiMixinConstructor>(base: TBase) {
    return class ClientMixin extends base {
        public async get_invite_info(
            code: string
        ): Promise<Response<RedeemingInvite>> {
            return await this.request<RedeemingInvite>(`/client/${code}/info`);
        }
    };
}
