import { ConnectionInfo, LoginResponse, User } from "../../../types/auth";
import { Response } from "../types";
import { ApiMixinConstructor } from "./base";

export function AuthMixin<TBase extends ApiMixinConstructor>(base: TBase) {
    return class AuthMixin extends base {
        public async getSessionInfo(): Promise<Response<ConnectionInfo>> {
            return await this.request<ConnectionInfo>("/");
        }

        public async login(
            username: string,
            password: string
        ): Promise<User | null> {
            const result = await this.request<LoginResponse>("/login", {
                method: "post",
                data: { email: username, password },
            });
            await this.refresh();

            return result.resolve((data) => {
                this.setSecretKey(data.client_key);
                return data.user;
            }, null);
        }

        public async logout(): Promise<Response<void>> {
            const result = await this.request<void>("/logout", {
                method: "delete",
            });
            await this.refresh();
            return result;
        }
    };
}
