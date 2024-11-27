import { Axios, AxiosError, AxiosResponse } from "axios";
import { ServerCustomization, User } from "../../types/auth";
import { createContext } from "react";

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

export type Response<T> =
    | (AxiosResponse<T> & { success: true })
    | (AxiosError & { success: false });
