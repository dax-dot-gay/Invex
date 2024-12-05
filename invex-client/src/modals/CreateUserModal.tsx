import { Button, Group, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { ContextModalProps } from "@mantine/modals";
import {
    IconAt,
    IconPassword,
    IconPlus,
    IconUser,
    IconX,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { PasswordField } from "../components/fields";
import { useApi, UsersMixin } from "../context/net";
import { useNotifications } from "../util/notifications";
import { useState } from "react";

export function CreateUserModal({
    context,
    id,
    innerProps,
}: ContextModalProps<{ type: "admin" | "user"; refresh?: () => void }>) {
    const { t } = useTranslation();
    const form = useForm({
        initialValues: {
            username: "",
            email: "",
            password: "",
        },
        validate: {
            username: (v) => (v.length > 0 ? null : t("errors.form.empty")),
            email: (v) =>
                v.length > 0
                    ? /^\S+@\S+\.\S+$/.test(v)
                        ? null
                        : t("errors.form.invalidEmail")
                    : null,
            password: (v) => (v.length > 0 ? null : t("errors.form.empty")),
        },
    });
    const api = useApi(UsersMixin);
    const { success, error } = useNotifications();
    const [loading, setLoading] = useState(false);

    return (
        <form
            onSubmit={form.onSubmit((values) => {
                setLoading(true);
                api.createUser(
                    innerProps.type,
                    values.username,
                    values.email,
                    values.password
                ).then((response) => {
                    setLoading(false);
                    response
                        .and_then((_) => {
                            if (innerProps.refresh) {
                                innerProps.refresh();
                            }
                            success(t("modals.createUser.success"));
                            context.closeContextModal(id);
                        })
                        .or_else((_, reason) => {
                            if (reason) {
                                error(
                                    t("errors.network.response", {
                                        reason: reason,
                                    })
                                );
                            } else {
                                error(t("errors.network.unknown"));
                            }
                        });
                });
            })}
        >
            <Stack gap="sm">
                <TextInput
                    label={t("modals.createUser.username")}
                    leftSection={<IconUser size={20} />}
                    {...form.getInputProps("username")}
                    withAsterisk
                />
                <TextInput
                    label={t("modals.createUser.email")}
                    leftSection={<IconAt size={20} />}
                    {...form.getInputProps("email")}
                />
                <PasswordField
                    label={t("modals.createUser.password")}
                    leftSection={<IconPassword size={20} />}
                    {...form.getInputProps("password")}
                    withAsterisk
                />
                <Group gap="sm" grow>
                    <Button
                        variant="light"
                        leftSection={<IconX size={20} />}
                        justify="space-between"
                        onClick={() => {
                            context.closeContextModal(id, true);
                        }}
                    >
                        {t("actions.cancel")}
                    </Button>
                    <Button
                        leftSection={<IconPlus size={20} />}
                        justify="space-between"
                        type="submit"
                        loading={loading}
                    >
                        {t("modals.createUser.submit")}
                    </Button>
                </Group>
            </Stack>
        </form>
    );
}
