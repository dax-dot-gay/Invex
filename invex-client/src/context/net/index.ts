import { useContext } from "react";
import { NetProvider } from "./Provider";
import {
    NetContext,
    NetContextType,
    NetState,
    NetStateAuthed,
    NetStateError,
    NetStateNew,
    NetStateReady,
    isReady,
} from "./types";

export { NetProvider, NetContext, isReady };
export type {
    NetContextType,
    NetState,
    NetStateAuthed,
    NetStateError,
    NetStateNew,
    NetStateReady,
};

export function useNet(): NetContextType {
    return useContext(NetContext);
}

export function useNetworkState(): NetState {
    return useNet().state;
}

export function useNetError(): NetStateError | null {
    const state = useNetworkState();
    if (state.state === "error") {
        return state;
    }
    return null;
}

export function useNetAccessible(): boolean {
    const state = useNetworkState();
    return state.state === "authed" || state.state === "ready";
}
