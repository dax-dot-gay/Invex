import { createContext } from "react";

export type RefreshContextType = {
    register: (callback: () => any) => string;
    deregister: (id: string) => void;
    refresh: () => void;
};

export const RefreshContext = createContext<RefreshContextType>(null as any);
