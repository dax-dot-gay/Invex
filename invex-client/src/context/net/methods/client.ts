import { RedeemingInvite } from "../../../types/client";
import { InviteRedemption } from "../../../types/invite";
import { FieldValue } from "../../../types/plugin";
import { Response } from "../types";
import { ApiMixinConstructor } from "./base";

type RedemptionForm = {
    user_creation:
        | {
              mode: "create";
              username: string;
              email: string;
              password: string;
              confirm_password: string;
          }
        | {
              mode: "login";
              username_or_email: string;
              password: string;
          }
        | {
              mode: "inactive";
          };
    services: {
        [service: string]: {
            [action: string]: {
                [field: string]: { value: FieldValue | null; valid: boolean };
            };
        };
    };
};

export function ClientMixin<TBase extends ApiMixinConstructor>(base: TBase) {
    return class ClientMixin extends base {
        public async get_invite_info(
            code: string
        ): Promise<Response<RedeemingInvite>> {
            return await this.request<RedeemingInvite>(`/client/${code}/info`);
        }

        public async redeem_invite(
            code: string,
            data: RedemptionForm,
            dry_run?: boolean
        ): Promise<Response<InviteRedemption>> {
            return await this.request<InviteRedemption>(
                `/client/${code}/redeem`,
                {
                    method: "post",
                    params: { dry: dry_run ?? false },
                    data: {
                        user_creation: data.user_creation,
                        services: Object.entries(data.services).reduce(
                            (prevServices, [aid, actions]) => ({
                                ...prevServices,
                                [aid]: Object.entries(actions).reduce(
                                    (prevActions, [sid, fields]) => ({
                                        ...prevActions,
                                        [sid]: Object.entries(fields).reduce(
                                            (prevFields, [key, { value }]) => ({
                                                ...prevFields,
                                                [key]: value,
                                            }),
                                            {}
                                        ),
                                    }),
                                    {}
                                ),
                            }),
                            {}
                        ),
                    },
                }
            );
        }
    };
}
