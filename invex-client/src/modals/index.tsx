import { AddPluginModal } from "./AddPluginModal";
import { AddServiceModal } from "./AddServiceModal";
import { CreateUserModal } from "./CreateUserModal";
import { LoginModal } from "./LoginModal";
import { Group, Title } from "@mantine/core";
import { UpdateServiceModal } from "./UpdateServiceModal";

export const modals = {
    login: LoginModal,
    createUser: CreateUserModal,
    addPlugin: AddPluginModal,
    addService: AddServiceModal,
    updateService: UpdateServiceModal,
};

declare module "@mantine/modals" {
    export interface MantineModalsOverride {
        modals: typeof modals;
    }
}

export function ModalTitle({
    icon,
    name,
}: {
    icon: (...args: any) => any;
    name: string | null;
}) {
    let Icon = icon;
    return (
        <Group gap="sm" align="start" className="modal-title-wrapper">
            <Icon className="modal-title-icon" />
            <Title order={4} className="modal-title-text">
                {name}
            </Title>
        </Group>
    );
}
