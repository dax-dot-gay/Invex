import { Button, Group, Stack, Textarea, TextInput } from "@mantine/core";
import { ContextModalProps } from "@mantine/modals";
import { IconPicker } from "../components/iconPicker";
import { AvatarSource } from "../components/icon";
import { useTranslation } from "react-i18next";
import { IconPlus } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { ServiceMixin, useApi } from "../context/net";
import { useNotifications } from "../util/notifications";

export function AddServiceModal({
    id,
    context,
    innerProps,
}: ContextModalProps<{ refresh: () => void }>) {
    const form = useForm<{
        icon: AvatarSource | null;
        name: string;
        description: string;
    }>({
        initialValues: {
            icon: "icon:IconServer",
            name: "",
            description: "",
        },
    });
    const api = useApi(ServiceMixin);
    const { error, success } = useNotifications();
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
                    onClick={() => {
                        api.createService(
                            form.values.name,
                            form.values.icon,
                            form.values.description.length > 0
                                ? form.values.description
                                : null
                        ).then((response) => {
                            if (response.success) {
                                innerProps.refresh();
                                success(t("modals.addService.success"));
                                context.closeContextModal(id);
                            } else {
                                error(t("modals.addService.error"));
                            }
                        });
                    }}
                >
                    {t("common.actions.create")}
                </Button>
            </Group>
        </Stack>
    );
}
