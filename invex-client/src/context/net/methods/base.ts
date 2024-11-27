import { Axios, AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import {
    isReady,
    NetContextType,
    NetStateAuthed,
    NetStateReady,
    Response,
} from "../types";
import { randomId } from "@mantine/hooks";
import { User } from "../../../types/auth";
import { UnionToIntersection, ValuesType } from "utility-types";

export class ApiBase {
    private _id: string;
    public constructor(private context: NetContextType) {
        this._id = randomId();
    }

    public get id(): string {
        return this._id;
    }

    public setSecretKey(value: string | null): void {
        if (isReady(this.context)) {
            this.context.setSecretKey(value ?? "");
        }
    }

    public async request<T, E = any>(
        url: string,
        config?: AxiosRequestConfig
    ): Promise<Response<T>> {
        if (isReady(this.context)) {
            try {
                const result = await this.context.axios.request<T>({
                    url,
                    ...(config ?? {}),
                });
                return { success: true, ...result };
            } catch (e: any) {
                const error: AxiosError<E> = e;
                return { success: false, ...error };
            }
        } else {
            return {
                success: false,
                status: 0,
                message: "Network context not ready",
                isAxiosError: false,
                name: "context.not_ready",
                toJSON: () => ({}),
            };
        }
    }

    public get token(): string | null {
        if (isReady(this.context)) {
            return this.context.state.token;
        }
        return null;
    }

    public get user(): User | null {
        if (this.context.state.state === "authed") {
            return this.context.state.user;
        }
        return null;
    }

    public async refresh(): Promise<void> {
        await this.context.refresh();
    }

    public get ready(): boolean {
        return isReady(this.context);
    }

    public get authenticated(): boolean {
        return this.context.state.state === "authed";
    }
}

export type ApiMixinConstructor = new (...args: any[]) => ApiBase;
export type ApiMixin<
    TBase extends ApiMixinConstructor,
    TOut extends ApiBase
> = (base: TBase) => TOut;

export function generateMethods<TMixins extends ApiMixin<any, any>[]>(
    context: NetContextType,
    ...mixins: TMixins
): UnionToIntersection<ReturnType<ValuesType<TMixins>>["prototype"]> & ApiBase {
    return new (mixins.reduce((prev, current) => current(prev), ApiBase))(
        context
    ) as any;
}
