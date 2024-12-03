import { Button, Group, Stack, Textarea, TextInput } from "@mantine/core";
import { ContextModalProps } from "@mantine/modals";
import { IconPicker } from "../components/iconPicker";
import { AvatarSource } from "../components/icon";
import { useTranslation } from "react-i18next";
import { IconUpload } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { ServiceMixin, useApi } from "../context/net";
import { useNotifications } from "../util/notifications";
import { Service } from "../types/service";

export function UpdateServiceModal({
    id,
    context,
    innerProps,
}: ContextModalProps<{ refresh: () => void; service: Service }>) {
    const form = useForm<{
        icon: AvatarSource | null;
        name: string;
        description: string;
    }>({
        initialValues: {
            icon: innerProps.service.icon as AvatarSource | null,
            name: innerProps.service.name,
            description: innerProps.service.description ?? "",
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
                    placeholder={t("modals.updateService.placeholder")}
                    size="md"
                    style={{ flexGrow: 1 }}
                />
            </Group>
            <Textarea
                {...form.getInputProps("description")}
                autosize
                minRows={3}
                placeholder={t("modals.updateService.description")}
            />
            <Group justify="end">
                <Button
                    leftSection={<IconUpload size={20} />}
                    disabled={form.values.name.length < 1}
                    onClick={() => {
                        api.updateService(innerProps.service._id, {
                            name: form.values.name,
                            icon: form.values.icon,
                            description:
                                form.values.description.length > 0
                                    ? form.values.description
                                    : null,
                        }).then((response) => {
                            if (response.success) {
                                innerProps.refresh();
                                success(t("modals.updateService.success"));
                                context.closeContextModal(id);
                            } else {
                                error(t("modals.updateService.error"));
                            }
                        });
                    }}
                >
                    {t("common.actions.update")}
                </Button>
            </Group>
        </Stack>
    );
}
