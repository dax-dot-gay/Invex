import { ConnectionInfo } from "../../../types/auth";
import { Response } from "../types";
import { ApiMixinConstructor } from "./base";

export function AuthMixin<TBase extends ApiMixinConstructor>(base: TBase) {
    return class AuthMixin extends base {
        public async getSessionInfo(): Promise<Response<ConnectionInfo>> {
            return await this.request<ConnectionInfo>("/");
        }
    };
}
