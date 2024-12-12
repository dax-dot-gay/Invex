import { ContextModalProps } from "@mantine/modals";
import { Plugin } from "../types/plugin";
import { Stack } from "@mantine/core";

export function PluginProfilesModal({
    context,
    id,
    innerProps: { plugin },
}: ContextModalProps<{ plugin: Plugin }>) {
    return <Stack gap="sm"></Stack>;
}
