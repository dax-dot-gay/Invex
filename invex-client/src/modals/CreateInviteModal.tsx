import {
    ActionIcon,
    ActionIconGroup,
    Button,
    Checkbox,
    Divider,
    Fieldset,
    Group,
    MultiSelect,
    NumberInput,
    Paper,
    Stack,
    Text,
    TextInput,
    Tooltip,
} from "@mantine/core";
import { ContextModalProps } from "@mantine/modals";
import { useTranslation } from "react-i18next";
import { InviteMixin, ServiceMixin, useApi } from "../context/net";
import { useForm } from "@mantine/form";
import { randomBytes } from "../util/funcs";
import { Expiration, Invite } from "../types/invite";
import {
    IconCalendar,
    IconCheck,
    IconCircleCheckFilled,
    IconClipboardCheck,
    IconClipboardCopy,
    IconLabelFilled,
    IconLink,
    IconLinkPlus,
    IconServer,
    IconUsers,
    IconX,
} from "@tabler/icons-react";
import { isNumber } from "lodash";
import { DateTimePicker } from "@mantine/dates";
import { useEffect, useState } from "react";
import { Service } from "../types/service";
import { DynamicAvatar } from "../components/icon";
import { isBase64 } from "validator";
import { useNotifications } from "../util/notifications";
import { useClipboard } from "@mantine/hooks";

export function CreateInviteModal({
    id,
    context,
    innerProps: { refresh },
}: ContextModalProps<{ refresh: () => void }>) {
    const { t } = useTranslation();
    const api = useApi(ServiceMixin, InviteMixin);
    const form = useForm<{
        code: string;
        services: string[];
        expiration: Expiration | null;
        alias: string;
    }>({
        initialValues: {
            code: randomBytes(8),
            services: [],
            expiration: null,
            alias: "",
        },
        validate: {
            code: (code) =>
                code.length < 6
                    ? t("modals.createInvite.errors.codeTooShort")
                    : isBase64(code, { urlSafe: true })
                    ? null
                    : t("modals.createInvite.errors.codeInvalid"),
            services: (services) =>
                services.length === 0 ? t("errors.form.empty") : null,
        },
    });

    const [services, setServices] = useState<{ [key: string]: Service }>({});
    useEffect(() => {
        api.getServices().then((s) =>
            setServices(
                s.reduce((prev, cur) => ({ ...prev, [cur._id]: cur }), {})
            )
        );
    }, [api.getServices, setServices]);
    const { error } = useNotifications();
    const [created, setCreated] = useState<Invite | null>(null);
    const clipboard = useClipboard();

    return created ? (
        <Stack gap="sm">
            <Divider />
            <Group gap="sm" justify="center">
                <IconCircleCheckFilled
                    color="var(--mantine-color-green-6)"
                    size={28}
                />
                <Text
                    fw={600}
                    size="lg"
                    style={{ transform: "translate(0, -2px)" }}
                >
                    {t("modals.createInvite.created.title")}
                </Text>
            </Group>
            <TextInput
                w="100%"
                style={{ cursor: "pointer" }}
                className="readonly-input"
                readOnly
                value={`${window.location.origin}/inv/${created.invite.code}`}
                leftSection={
                    clipboard.copied ? (
                        <IconClipboardCheck size={24} />
                    ) : (
                        <IconClipboardCopy size={24} />
                    )
                }
                size="md"
                onClick={() =>
                    clipboard.copy(
                        `${window.location.origin}/inv/${created.invite.code}`
                    )
                }
            />
            <Group w="100%" justify="end">
                <Button
                    leftSection={<IconCheck size={20} />}
                    onClick={() => context.closeContextModal(id)}
                >
                    {t("common.words.done")}
                </Button>
            </Group>
        </Stack>
    ) : (
        <form
            onSubmit={form.onSubmit((values) => {
                api.create_invite(
                    values.code,
                    values.services,
                    values.expiration,
                    values.alias
                ).then((response) =>
                    response
                        .and_then((invite) => {
                            setCreated(invite);
                            refresh();
                        })
                        .or_else((_, reason) =>
                            error(
                                t("modals.createInvite.errors.creation", {
                                    reason,
                                })
                            )
                        )
                );
            })}
        >
            <Stack gap="sm">
                <TextInput
                    leftSection={<IconLink size={20} />}
                    label={t("modals.createInvite.fields.code.label")}
                    description={t("modals.createInvite.fields.code.desc")}
                    {...form.getInputProps("code")}
                    withAsterisk
                />
                <TextInput
                    leftSection={<IconLabelFilled size={20} />}
                    label={t("modals.createInvite.fields.alias.label")}
                    {...form.getInputProps("alias")}
                />
                <Fieldset
                    bg="#00000000"
                    variant="unstyled"
                    legend={t("modals.createInvite.fields.expiration.main")}
                >
                    <Group gap="sm" wrap="nowrap">
                        <ActionIconGroup>
                            <Tooltip
                                label={t(
                                    "modals.createInvite.fields.expiration.mode.never.tooltip"
                                )}
                                color="dark"
                                withArrow
                            >
                                <ActionIcon
                                    size={36}
                                    variant={
                                        form.values.expiration === null
                                            ? "filled"
                                            : "light"
                                    }
                                    onClick={() =>
                                        form.setFieldValue("expiration", null)
                                    }
                                >
                                    <IconX size={20} />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip
                                label={t(
                                    "modals.createInvite.fields.expiration.mode.uses.tooltip"
                                )}
                                color="dark"
                                withArrow
                            >
                                <ActionIcon
                                    size={36}
                                    variant={
                                        Object.keys(
                                            form.values.expiration ?? {}
                                        ).includes("uses")
                                            ? "filled"
                                            : "light"
                                    }
                                    onClick={() =>
                                        form.setFieldValue("expiration", {
                                            uses: 10,
                                        })
                                    }
                                >
                                    <IconUsers size={20} />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip
                                label={t(
                                    "modals.createInvite.fields.expiration.mode.date.tooltip"
                                )}
                                color="dark"
                                withArrow
                            >
                                <ActionIcon
                                    variant={
                                        Object.keys(
                                            form.values.expiration ?? {}
                                        ).includes("datetime")
                                            ? "filled"
                                            : "light"
                                    }
                                    size={36}
                                    onClick={() =>
                                        form.setFieldValue("expiration", {
                                            datetime: (() => {
                                                const date = new Date(
                                                    Date.now()
                                                );
                                                date.setDate(
                                                    date.getDate() + 7
                                                );
                                                return date.getTime();
                                            })(),
                                        })
                                    }
                                >
                                    <IconCalendar size={20} />
                                </ActionIcon>
                            </Tooltip>
                        </ActionIconGroup>
                        {form.values.expiration === null && (
                            <Paper
                                h={36}
                                style={{ flexGrow: 1 }}
                                bg="var(--mantine-color-default)"
                            >
                                <Stack align="center" justify="center" h="100%">
                                    <Text size="sm" c="dimmed">
                                        {t(
                                            "modals.createInvite.fields.expiration.neverExpires"
                                        )}
                                    </Text>
                                </Stack>
                            </Paper>
                        )}
                        {form.values.expiration &&
                            Object.keys(form.values.expiration).includes(
                                "uses"
                            ) && (
                                <NumberInput
                                    min={1}
                                    allowDecimal={false}
                                    value={
                                        (form.values.expiration as any).uses ??
                                        1
                                    }
                                    onChange={(val) =>
                                        form.setFieldValue("expiration", {
                                            uses: isNumber(val) ? val : 1,
                                        })
                                    }
                                    style={{ flexGrow: 1 }}
                                    leftSection={<IconUsers size={20} />}
                                    error={
                                        form.getInputProps("expiration").error
                                    }
                                />
                            )}
                        {form.values.expiration &&
                            Object.keys(form.values.expiration).includes(
                                "datetime"
                            ) && (
                                <DateTimePicker
                                    value={
                                        new Date(
                                            (form.values.expiration as any)
                                                .datetime as number
                                        )
                                    }
                                    onChange={(v) =>
                                        form.setFieldValue("expiration", {
                                            datetime:
                                                v?.getTime() ??
                                                (form.values.expiration as any)
                                                    .datetime,
                                        })
                                    }
                                    style={{ flexGrow: 1 }}
                                    leftSection={<IconCalendar size={20} />}
                                    minDate={new Date(Date.now())}
                                    valueFormat="MM/DD/YYYY hh:mm A"
                                    error={
                                        form.getInputProps("expiration").error
                                    }
                                />
                            )}
                    </Group>
                </Fieldset>
                <MultiSelect
                    withAsterisk
                    data={Object.values(services).map((s) => ({
                        value: s._id,
                        label: s.name,
                    }))}
                    {...form.getInputProps("services")}
                    renderOption={({ option, checked }) => {
                        return (
                            <Group gap="xs">
                                <Checkbox checked={checked} readOnly />
                                <Divider orientation="vertical" />
                                <DynamicAvatar
                                    source={
                                        services[option.value].icon ??
                                        ("icon:IconServer" as any)
                                    }
                                    fallback={IconServer}
                                    size={24}
                                />
                                <Text size="sm">
                                    {services[option.value].name}
                                </Text>
                            </Group>
                        );
                    }}
                    label={t("modals.createInvite.fields.services")}
                    leftSection={<IconServer size={20} />}
                />
                <Group gap="sm" justify="space-between">
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
                        leftSection={<IconLinkPlus size={20} />}
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
