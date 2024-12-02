import { Button, Group, Stack, Textarea, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { ContextModalProps } from "@mantine/modals";
import { useState } from "react";
import { IconPicker } from "../components/iconPicker";
import { AvatarSource } from "../components/icon";
import { useTranslation } from "react-i18next";
import { IconPlus } from "@tabler/icons-react";
import { useForm } from "@mantine/form";

export function AddServiceModal({ id, context }: ContextModalProps<{}>) {
    const form = useForm<{
        icon: AvatarSource | null;
        name: string;
        description: string;
    }>({
        initialValues: {
            icon: null,
            name: "",
            description: "",
        },
    });
    const { t } = useTranslation();
    return (
        <Stack gap="sm">
            <Group gap="sm" wrap="nowrap">
                <IconPicker
                    defaultValue={"icon:IconServer"}
                    {...form.getInputProps("icon")}
                    variant="light"
                    size={42}
                    iconSize={32}
                />
                <TextInput
                    {...form.getInputProps("name")}
                    placeholder={t("modals.addService.placeholder")}
                    size="md"
                    style={{ flexGrow: 1 }}
                />
            </Group>
            <Textarea
                {...form.getInputProps("description")}
                autosize
                minRows={3}
                placeholder={t("modals.addService.description")}
            />
            <Group justify="end">
                <Button
                    leftSection={<IconPlus size={20} />}
                    disabled={form.values.name.length < 1}
                >
                    {t("common.actions.create")}
                </Button>
            </Group>
        </Stack>
    );
}
