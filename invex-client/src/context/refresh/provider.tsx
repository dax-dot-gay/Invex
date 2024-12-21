import { ReactNode, useCallback } from "react";
import { RefreshContext } from "./types";
import { randomId, useMap } from "@mantine/hooks";

export function RefreshProvider({
    children,
}: {
    children?: ReactNode | ReactNode[];
}) {
    const callbacks = useMap<string, () => any>([]);

    const refresh = useCallback(() => {
        for (const cb of callbacks.values()) {
            cb();
        }
    }, [callbacks]);

    const register = useCallback(
        (callback: () => any) => {
            const id = randomId();
            callbacks.set(id, callback);
            return id;
        },
        [callbacks]
    );

    const deregister = useCallback(
        (id: string) => {
            callbacks.delete(id);
        },
        [callbacks]
    );

    return (
        <RefreshContext.Provider
            value={{
                register,
                deregister,
                refresh,
            }}
        >
            {children}
        </RefreshContext.Provider>
    );
}
