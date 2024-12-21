import { useCallback, useContext, useEffect } from "react";
import { RefreshProvider } from "./provider";
import { RefreshContext } from "./types";

export { RefreshProvider };

export function useRefreshCallback(
    callback: () => any,
    dependencies: any[]
): () => any {
    const ctx = useContext(RefreshContext);
    const cb = useCallback(callback, dependencies);

    useEffect(() => {
        const id = ctx.register(cb);
        return () => ctx.deregister(id);
    }, [cb, ctx.register, ctx.deregister]);

    return useCallback(() => ctx.refresh(), [...dependencies, cb, ctx.refresh]);
}
