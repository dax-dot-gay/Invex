import { useContext, useMemo } from "react";
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
    Response,
} from "./types";
import { ApiBase, ApiMixin, generateMethods } from "./methods/base";
import { UnionToIntersection, ValuesType } from "utility-types";
import { ServerCustomization, User } from "../../types/auth";

export { NetProvider, NetContext, isReady };
export type {
    NetContextType,
    NetState,
    NetStateAuthed,
    NetStateError,
    NetStateNew,
    NetStateReady,
    Response,
};

import { AuthMixin } from "./methods/auth";
import { UsersMixin } from "./methods/users";
import { PluginsMixin } from "./methods/plugins";
import { ServiceMixin } from "./methods/service";
import { FilesMixin } from "./methods/files";

export { AuthMixin, UsersMixin, PluginsMixin, ServiceMixin, FilesMixin };

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

export function useUser(): User | null {
    const state = useNetworkState();
    if (state.state === "authed") {
        return state.user;
    }
    return null;
}

export function useApi<TMixins extends ApiMixin<any, any>[]>(
    ...mixins: TMixins
): UnionToIntersection<ReturnType<ValuesType<TMixins>>["prototype"]> & ApiBase {
    const context = useNet();
    const names = useMemo(() => mixins.map((v) => v.name).join(":"), [mixins]);
    const user = useMemo(() => {
        if (context.state.state === "authed") {
            return context.state.user;
        } else {
            return null;
        }
    }, [context.state]);

    const token = useMemo(() => {
        if (
            context.state.state === "authed" ||
            context.state.state === "ready"
        ) {
            return context.state.token;
        } else {
            return null;
        }
    }, [context.state]);

    const methods = useMemo(() => {
        return generateMethods(context, ...mixins);
    }, [context.state.state, user?.id, token, names]);

    return methods;
}

export function useCustomization(): ServerCustomization | null {
    return useNet().customization;
}
