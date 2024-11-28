import { LoginModal } from "./LoginModal";

export const modals = {
    login: LoginModal,
};

declare module "@mantine/modals" {
    export interface MantineModalsOverride {
        modals: typeof modals;
    }
}
