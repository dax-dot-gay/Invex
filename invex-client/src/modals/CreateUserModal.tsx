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

export function CreateUserModal({
    context,
    id,
    innerProps,
}: ContextModalProps<{ type: "admin" | "user" }>) {
    const form = useForm({
        initialValues: {
            username: "",
            email: "",
            password: "",
        },
    });
    const { t } = useTranslation();
    return (
        <form onSubmit={form.onSubmit((values) => console.log(values))}>
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
                    >
                        {t("modals.createUser.submit")}
                    </Button>
                </Group>
            </Stack>
        </form>
    );
}
