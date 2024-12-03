import { ContextModalProps } from "@mantine/modals";
import { Service, ServiceGrant } from "../types/service";
import { Stack } from "@mantine/core";

function AddAccount({
    service,
    refresh,
    close,
}: {
    service: Service;
    refresh: () => void;
    close: () => void;
}) {
    return <Stack gap="sm" className="grant-add account"></Stack>;
}

function AddAttachment({
    service,
    refresh,
    close,
}: {
    service: Service;
    refresh: () => void;
    close: () => void;
}) {
    return <Stack gap="sm" className="grant-add attachment"></Stack>;
}

function AddMessage({
    service,
    refresh,
    close,
}: {
    service: Service;
    refresh: () => void;
    close: () => void;
}) {
    return <Stack gap="sm" className="grant-add message"></Stack>;
}

export function AddServiceGrantModal({
    id,
    context,
    innerProps,
}: ContextModalProps<{
    type: ServiceGrant["type"];
    service: Service;
    refresh: () => void;
}>) {
    switch (innerProps.type) {
        case "account":
            return (
                <AddAccount
                    {...innerProps}
                    close={() => context.closeContextModal(id)}
                />
            );
        case "attachment":
            return (
                <AddAttachment
                    {...innerProps}
                    close={() => context.closeContextModal(id)}
                />
            );
        case "message":
            return (
                <AddMessage
                    {...innerProps}
                    close={() => context.closeContextModal(id)}
                />
            );
        default:
            return <></>;
    }
}
