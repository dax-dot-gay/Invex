import { User } from "../../../types/auth";
import { Paginated } from "../types";
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
            return result.success
                ? result.data
                : { offset: 0, total: 0, results: [] };
        }
    };
}
