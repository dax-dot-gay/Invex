import { Button, Group, Stack, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { ContextModalProps } from "@mantine/modals";
import { useState } from "react";
import { IconPicker } from "../components/iconPicker";
import { AvatarSource } from "../components/icon";
import { useTranslation } from "react-i18next";
import { IconPlus } from "@tabler/icons-react";

export function AddServiceModal({ id, context }: ContextModalProps<{}>) {
    const [icon, setIcon] = useState<AvatarSource | null>(null);
    const [name, setName] = useInputState("");
    const { t } = useTranslation();
    return (
        <Stack gap="sm">
            <Group gap="sm" wrap="nowrap">
                <IconPicker
                    defaultValue={"icon:IconServer"}
                    value={icon}
                    onChange={setIcon}
                    variant="light"
                    size={42}
                    iconSize={32}
                />
                <TextInput
                    value={name}
                    onChange={setName}
                    placeholder={t("modals.addService.placeholder")}
                    size="md"
                    style={{ flexGrow: 1 }}
                />
            </Group>
            <Group justify="end">
                <Button
                    leftSection={<IconPlus size={20} />}
                    disabled={name.length < 1}
                >
                    {t("common.actions.create")}
                </Button>
            </Group>
        </Stack>
    );
}
