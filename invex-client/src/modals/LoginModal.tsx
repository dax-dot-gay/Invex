import {
    ActionIcon,
    Button,
    Divider,
    Group,
    Stack,
    TextInput,
} from "@mantine/core";
import { ContextModalProps } from "@mantine/modals";
import {
    IconArrowRight,
    IconAt,
    IconLinkPlus,
    IconLogin2,
    IconPassword,
    IconX,
} from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import { PasswordField } from "../components/fields";
import { useInputState } from "@mantine/hooks";
import { useApi } from "../context/net";
import { AuthMixin } from "../context/net/methods/auth";
import { useNotifications } from "../util/notifications";
import { useState } from "react";

export function LoginModal({ context, id }: ContextModalProps<{}>) {
    const { t } = useTranslation();
    const api = useApi(AuthMixin);
    const { success, error } = useNotifications();
    const form = useForm({
        initialValues: {
            email: "",
            password: "",
        },
        validate: {
            email: (value) => {
                if (value.length < 1) {
                    return t("errors.form.empty");
                }
                if (value.includes("@")) {
                    if (/^\S+@\S+\.\S+$/.test(value)) {
                        return null;
                    }
                    return t("errors.form.invalidEmail");
                }
                return null;
            },
            password: (value) =>
                value.length < 1 ? t("errors.form.empty") : null,
        },
    });
    const [invite, setInvite] = useInputState("");
    const [loading, setLoading] = useState(false);

    return (
        <Stack gap="sm">
            <form
                onSubmit={form.onSubmit((values) => {
                    setLoading(true);
                    api.login(values.email, values.password).then((v) => {
                        setLoading(false);
                        if (v) {
                            success(
                                t("modals.login.success", { user: v.username })
                            );
                            context.closeContextModal(id);
                        } else {
                            error(t("modals.login.error"));
                        }
                    });
                })}
            >
                <Stack gap="sm">
                    <TextInput
                        leftSection={<IconAt size={20} />}
                        label={t("modals.login.email")}
                        withAsterisk
                        {...form.getInputProps("email")}
                    />
                    <PasswordField
                        leftSection={<IconPassword size={20} />}
                        label={t("modals.login.password")}
                        withAsterisk
                        {...form.getInputProps("password")}
                    />
                    <Group gap="sm" justify="space-between" grow>
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
                            leftSection={<IconLogin2 size={20} />}
                            justify="space-between"
                            type="submit"
                            loading={loading}
                        >
                            {t("modals.login.login")}
                        </Button>
                    </Group>
                </Stack>
            </form>
            <Divider label={t("common.words.or").toLocaleUpperCase()} />
            <Group gap="sm">
                <TextInput
                    leftSection={<IconLinkPlus size={20} />}
                    placeholder={t("modals.login.invite")}
                    value={invite}
                    onChange={setInvite}
                    size="md"
                    style={{ flexGrow: 1 }}
                />
                <ActionIcon
                    disabled={invite.length === 0}
                    variant="filled"
                    size={42}
                >
                    <IconArrowRight />
                </ActionIcon>
            </Group>
        </Stack>
    );
}
