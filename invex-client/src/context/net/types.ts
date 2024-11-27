import { Axios, AxiosError, AxiosRequestConfig } from "axios";
import { User } from "../../types/auth";
import { createContext } from "react";

export type NetStateNew = { state: "new" };
export type NetStateError = { state: "error"; code: number; reason?: any };
export type NetStateReady = { state: "ready"; token: string };
export type NetStateAuthed = { state: "authed"; token: string; user: User };

export type NetState =
    | NetStateNew
    | NetStateError
    | NetStateReady
    | NetStateAuthed;

export type NetContextType = { refresh: () => Promise<void> } & (
    | {
          axios: Axios;
          state: NetStateReady | NetStateAuthed;
          setSecretKey: (key: string) => void;
      }
    | {
          state: NetStateNew | NetStateError;
      }
);

export const NetContext = createContext<NetContextType>({
    refresh: async () => {},
    state: { state: "error", code: 0, reason: "Provider not initialized" },
});
