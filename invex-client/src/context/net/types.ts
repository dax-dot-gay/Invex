import { Axios, AxiosError, AxiosResponse } from "axios";
import { ServerCustomization, User } from "../../types/auth";
import { createContext } from "react";
import { isFunction } from "lodash";

export type NetStateNew = { state: "new" };
export type NetStateError = { state: "error"; code: number; reason?: any };
export type NetStateReady = {
    state: "ready";
    token: string;
};
export type NetStateAuthed = {
    state: "authed";
    token: string;
    user: User;
};

export type NetState =
    | NetStateNew
    | NetStateError
    | NetStateReady
    | NetStateAuthed;

export type ReadyNetContext = {
    refresh: () => Promise<void>;
    axios: Axios;
    state: NetStateReady | NetStateAuthed;
    setSecretKey: (key: string) => void;
    customization: ServerCustomization | null;
};

export type NetContextType =
    | ReadyNetContext
    | {
          refresh: () => Promise<void>;
          state: NetStateNew | NetStateError;
          customization: ServerCustomization | null;
      };

export const NetContext = createContext<NetContextType>({
    refresh: async () => {},
    state: { state: "error", code: 0, reason: "Provider not initialized" },
    customization: null,
});

export function isReady(obj: NetContextType): obj is ReadyNetContext {
    return ["authed", "ready"].includes(obj.state.state);
}

export class Response<T> {
    public constructor(
        private response: AxiosResponse<T> | null,
        private error: AxiosError | null
    ) {}

    public static ok<X>(response: AxiosResponse<X>): Response<X> {
        return new Response<X>(response, null);
    }

    public static err<X = any>(error: AxiosError): Response<X> {
        return new Response<X>(null, error);
    }

    public get success() {
        return this.response !== null && this.error === null;
    }

    public and_then(fn: (data: T) => void): Response<T> {
        if (this.response !== null) {
            fn(this.response.data);
        }
        return this;
    }

    public or_default<D = T>(value: D): D | T {
        if (this.response !== null) {
            return this.response.data;
        } else {
            return value;
        }
    }

    public or_else(
        fn: (error: AxiosError, reason: string | null) => void
    ): Response<T> {
        if (this.error !== null) {
            fn(this.error, this.reason);
        }
        return this;
    }

    public resolve<R>(
        success: ((data: T) => R) | R,
        error:
            | ((error: AxiosError) => R)
            | ((error: AxiosError, reason: string | null) => R)
            | R
    ): R {
        if (this.response !== null) {
            if (isFunction(success)) {
                return success(this.response.data);
            } else {
                return success;
            }
        } else {
            const err = this.error as AxiosError;
            if (isFunction(error)) {
                return error(err, this.reason);
            } else {
                return error;
            }
        }
    }

    public get data(): T | null {
        return this.or_default(null);
    }

    public get status(): number {
        if (this.response) {
            return this.response.status;
        } else {
            return (this.error as AxiosError).status ?? 0;
        }
    }

    public get reason(): string | null {
        if (this.error) {
            return this.error.response
                ? (this.error.response.data as string)
                : this.error.message;
        }
        return null;
    }
}

export type Paginated<T> = {
    offset: number;
    total: number;
    results: T[];
};
