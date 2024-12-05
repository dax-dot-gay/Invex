import { User } from "../../../types/auth";
import { Paginated, Response } from "../types";
import { ApiMixinConstructor } from "./base";
import { omitBy } from "lodash";

export function UsersMixin<TBase extends ApiMixinConstructor>(base: TBase) {
    return class UsersMixin extends base {
        public async getUsers(
            options?: Partial<{
                kind: "user" | "admin";
                search: string;
                page: number;
                size: number;
            }>
        ): Promise<Paginated<User>> {
            const result = await this.request<Paginated<User>>(
                "/users",
                options && {
                    params: omitBy(options, (v) => v === undefined),
                }
            );
            return result.or_default({ offset: 0, total: 0, results: [] });
        }

        public async createUser(
            kind: "admin" | "user",
            username: string,
            email: string,
            password: string
        ): Promise<Response<User>> {
            return await this.request<User>("/users/create", {
                method: "post",
                data: {
                    kind,
                    username,
                    email: email.length > 0 ? email : null,
                    password,
                },
            });
        }

        public async deleteUser(id: string): Promise<void> {
            await this.request<void>(`/users/${id}`, { method: "delete" });
        }
    };
}
