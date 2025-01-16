import { useNavigate, useParams } from "react-router-dom";
import { ClientMixin, Response, useApi } from "../../../context/net";
import { RedeemingInvite, RedeemingService } from "../../../types/client";
import { useEffect, useMemo, useState } from "react";
import {
    Accordion,
    AccordionControl,
    AccordionItem,
    AccordionPanel,
    Badge,
    Box,
    Button,
    Divider,
    Group,
    Indicator,
    Loader,
    LoadingOverlay,
    Paper,
    ScrollAreaAutosize,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
    ThemeIcon,
} from "@mantine/core";
import { useNotifications } from "../../../util/notifications";
import { useTranslation } from "react-i18next";
import { useMobile } from "../../../util/hooks";
import {
    IconArrowRight,
    IconAt,
    IconLink,
    IconLock,
    IconLogin2,
    IconScript,
    IconServer,
    IconUser,
    IconUserPlus,
    IconX,
} from "@tabler/icons-react";
import { FormErrors, useForm, UseFormReturnType } from "@mantine/form";
import { PasswordField } from "../../../components/fields";
import { PluginFieldForm } from "../../../components/pluginFields";
import { DynamicAvatar } from "../../../components/icon";
import { FieldValue } from "../../../types/plugin";
import { isEmail } from "validator";
import { InviteRedemption } from "../../../types/invite";

type RedemptionForm = {
    user_creation:
        | {
              mode: "create";
              username: string;
              email: string;
              password: string;
              confirm_password: string;
          }
        | {
              mode: "login";
              username_or_email: string;
              password: string;
          }
        | {
              mode: "inactive";
          };
    services: {
        [service: string]: {
            [action: string]: {
                [field: string]: { value: FieldValue | null; valid: boolean };
            };
        };
    };
};

function ServiceItem({
    service,
    form,
}: {
    service: RedeemingService;
    form: UseFormReturnType<RedemptionForm>;
}) {
    useEffect(() => {
        form.setFieldValue("services", (current) => ({
            ...current,
            [service.id]: Object.entries(service.actions).reduce(
                (prevActions, [id, action]) => ({
                    ...prevActions,
                    [id]: action.arguments.reduce(
                        (prevFields, field) => ({
                            ...prevFields,
                            [field.key]: {
                                value: field.default,
                                valid:
                                    field.default === null
                                        ? field.required
                                            ? false
                                            : true
                                        : true,
                            },
                        }),
                        {}
                    ),
                }),
                {}
            ),
        }));
    }, [service.id]);

    const svcJson: { [key: string]: string } = Object.entries(
        form.values.services
    ).reduce((prev, [k, v]) => ({ ...prev, [k]: JSON.stringify(v) }), {});

    const validity = useMemo(() => {
        const checked: { [key: string]: boolean } = Object.entries(
            form.values.services[service.id] ?? {}
        ).reduce(
            (prev, [field, value]) => ({
                ...prev,
                [field]: Object.values(value).every((v) =>
                    v ? v.valid : false
                ),
            }),
            {}
        );
        return {
            all: Object.values(checked).every((v) => v),
            specific: checked,
        };
    }, [svcJson[service.id]]);

    return (
        <AccordionItem value={service.id} key={service.id}>
            <AccordionControl>
                <Group gap="md" justify="start" pr="md">
                    <Indicator color="red" disabled={validity.all}>
                        <DynamicAvatar
                            source={service.icon as any}
                            fallback={IconServer}
                            size={32}
                            variant="transparent"
                        />
                    </Indicator>
                    <Stack gap={0}>
                        <Text size="lg">{service.name}</Text>
                        {service.description && (
                            <Text size="xs" c="dimmed" lineClamp={1}>
                                {service.description}
                            </Text>
                        )}
                    </Stack>
                </Group>
            </AccordionControl>
            <AccordionPanel>
                <Stack gap="sm">
                    {Object.entries(service.actions).map(([id, action]) => (
                        <Paper withBorder className="action-form" key={id}>
                            <Stack gap={0}>
                                <Group gap="sm" wrap="nowrap" p="sm">
                                    <Indicator
                                        color="red"
                                        disabled={validity.specific[id]}
                                    >
                                        <DynamicAvatar
                                            source={action.icon as any}
                                            fallback={IconScript}
                                            size={32}
                                            variant="transparent"
                                        />
                                    </Indicator>
                                    <Stack gap={0}>
                                        <Text>{action.label}</Text>
                                        {action.description && (
                                            <Text
                                                c="dimmed"
                                                size="xs"
                                                lineClamp={1}
                                            >
                                                {action.description}
                                            </Text>
                                        )}
                                    </Stack>
                                </Group>
                                <Divider />
                                <Box p="sm">
                                    <PluginFieldForm
                                        plugin={action.plugin}
                                        fields={action.arguments}
                                        context="invite"
                                        value={Object.entries(
                                            (form.values.services[service.id] ??
                                                {})[id] ?? {}
                                        ).reduce(
                                            (prev, [key, value]) => ({
                                                ...prev,
                                                [key]: value,
                                            }),
                                            {}
                                        )}
                                        onChange={(values) =>
                                            form.setFieldValue(
                                                `services.${service.id}.${id}`,
                                                values
                                            )
                                        }
                                    />
                                </Box>
                            </Stack>
                        </Paper>
                    ))}
                </Stack>
            </AccordionPanel>
        </AccordionItem>
    );
}

export function RedeemInviteView() {
    const params = useParams();
    const nav = useNavigate();
    const code = params.code ?? null;
    const api = useApi(ClientMixin);
    const [redeeming, setRedeeming] = useState<RedeemingInvite | null>(null);
    const { error } = useNotifications();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [redeemed, setRedeemed] = useState<Response<InviteRedemption> | null>(
        null
    );

    const mobile = useMobile();
    const form = useForm<RedemptionForm>({
        initialValues: {
            user_creation: {
                mode: "inactive",
            },
            services: {},
        },
        validate: (values) => {
            let result: FormErrors = {};
            switch (values.user_creation.mode) {
                case "inactive":
                    result.user_creation = null;
                    break;
                case "create":
                    result["user_creation.username"] =
                        values.user_creation.username.length > 0
                            ? null
                            : t("errors.form.empty");
                    result["user_creation.email"] =
                        values.user_creation.email.length > 0
                            ? isEmail(values.user_creation.email)
                                ? null
                                : t("errors.form.invalidEmail")
                            : null;
                    result["user_creation.password"] =
                        values.user_creation.password.length > 0
                            ? null
                            : t("errors.form.empty");
                    result["user_creation.confirm_password"] =
                        values.user_creation.confirm_password.length > 0
                            ? values.user_creation.confirm_password ===
                              values.user_creation.password
                                ? null
                                : t("errors.form.passwordMatch")
                            : t("errors.form.empty");
                    break;
                case "login":
                    result["user_creation.username_or_email"] =
                        values.user_creation.username_or_email.length > 0
                            ? values.user_creation.username_or_email.includes(
                                  "@"
                              )
                                ? isEmail(
                                      values.user_creation.username_or_email
                                  )
                                    ? null
                                    : t("errors.form.invalidEmail")
                                : null
                            : t("errors.form.empty");
                    result["user_creation.password"] =
                        values.user_creation.password.length > 0
                            ? null
                            : t("errors.form.empty");
                    break;
            }
            result["services"] = Object.values(values.services).every(
                (service) =>
                    Object.values(service).every((action) =>
                        Object.values(action).every((field) => field.valid)
                    )
            )
                ? null
                : "err";
            return result;
        },
    });

    useEffect(() => {
        if (api.ready) {
            api.get_invite_info(code ?? "").then((response) =>
                response.and_then(setRedeeming).or_else((_, reason) => {
                    error(t("errors.network.response", { reason }));
                    nav("/");
                })
            );
        }
    }, [code, api.get_invite_info, nav]);

    const jsonified = JSON.stringify(form.values);
    const valid = useMemo(() => {
        console.log("VAL");
        return form.isValid();
    }, [jsonified]);

    useEffect(() => {
        if (
            !api.authenticated &&
            api.ready &&
            form.values.user_creation.mode === "inactive"
        ) {
            form.setFieldValue("user_creation", {
                mode: "create",
                username: "",
                email: "",
                password: "",
                confirm_password: "",
            });
        }
    }, [
        form.setFieldValue,
        api.authenticated,
        api.ready,
        form.values.user_creation.mode,
    ]);

    return redeeming === null ? (
        <Stack align="center" justify="center" h="100%">
            <Loader size="lg" />
        </Stack>
    ) : (
        <Box pos="relative" h="100%">
            <LoadingOverlay visible={loading} />
            <Stack className="invite-redeem-stack" p="sm" h="100%">
                <Paper className="paper-light" p="sm">
                    <Group gap="sm" wrap="nowrap">
                        <ThemeIcon variant="transparent" color="gray" size="lg">
                            <IconLink />
                        </ThemeIcon>
                        <Divider orientation="vertical" />
                        <Group
                            gap={0}
                            justify="end"
                            style={{ flexGrow: 1 }}
                            pr="sm"
                        >
                            {!mobile && (
                                <Text
                                    size="lg"
                                    ff="monospace"
                                    c="dimmed"
                                    fw="bold"
                                >
                                    {window.location.origin}/inv/
                                </Text>
                            )}
                            <Text size="lg" ff="monospace" fw="bold">
                                {code}
                            </Text>
                        </Group>
                    </Group>
                </Paper>
                <Paper
                    withBorder
                    p={0}
                    className="redemption-form"
                    h="100%"
                    mah="calc(100% - 75px)"
                    style={{ overflow: "hidden" }}
                >
                    <ScrollAreaAutosize
                        mah="calc(100% - 60px)"
                        h="100%"
                        p="sm"
                        offsetScrollbars
                    >
                        <Accordion variant="separated" multiple>
                            {form.values.user_creation.mode === "create" && (
                                <AccordionItem value="user">
                                    <AccordionControl>
                                        <Group
                                            gap="md"
                                            justify="space-between"
                                            pr="md"
                                        >
                                            <Group gap="md">
                                                <Indicator
                                                    disabled={
                                                        form.values
                                                            .user_creation
                                                            .username.length >
                                                            0 &&
                                                        form.values
                                                            .user_creation
                                                            .password.length >
                                                            0 &&
                                                        form.values
                                                            .user_creation
                                                            .password ===
                                                            form.values
                                                                .user_creation
                                                                .confirm_password
                                                    }
                                                    color="red"
                                                >
                                                    <ThemeIcon
                                                        size="xl"
                                                        variant="light"
                                                        color="gray"
                                                    >
                                                        <IconUserPlus />
                                                    </ThemeIcon>
                                                </Indicator>
                                                <Text size="xl" fw="600">
                                                    {t(
                                                        "views.redeem.create_user.title"
                                                    )}
                                                </Text>
                                                {redeemed && (
                                                    <Badge
                                                        size="md"
                                                        style={{
                                                            transform:
                                                                "translate(0, 2px)",
                                                        }}
                                                        color={
                                                            redeemed.success
                                                                ? "green"
                                                                : "red"
                                                        }
                                                    >
                                                        {redeemed.resolve(
                                                            t(
                                                                "views.redeem.status.valid"
                                                            ),
                                                            (_, reason) =>
                                                                reason
                                                        )}
                                                    </Badge>
                                                )}
                                            </Group>
                                            <Button
                                                size="md"
                                                leftSection={
                                                    <IconLogin2 size={24} />
                                                }
                                                justify="space-between"
                                                variant="light"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    form.setFieldValue(
                                                        "user_creation",
                                                        {
                                                            mode: "login",
                                                            username_or_email:
                                                                "",
                                                            password: "",
                                                        }
                                                    );
                                                }}
                                            >
                                                <Text
                                                    fw={600}
                                                    style={{
                                                        transform:
                                                            "translate(0, -2px)",
                                                    }}
                                                >
                                                    {t(
                                                        "views.redeem.login.switch_to"
                                                    )}
                                                </Text>
                                            </Button>
                                        </Group>
                                    </AccordionControl>
                                    <AccordionPanel>
                                        <Stack gap="sm">
                                            <SimpleGrid
                                                spacing="sm"
                                                verticalSpacing="sm"
                                                cols={{ base: 1, lg: 2 }}
                                            >
                                                <TextInput
                                                    className="dark-input"
                                                    withAsterisk
                                                    label={t(
                                                        "views.redeem.create_user.username"
                                                    )}
                                                    leftSection={
                                                        <IconUser size={20} />
                                                    }
                                                    {...form.getInputProps(
                                                        "user_creation.username"
                                                    )}
                                                    size="md"
                                                />
                                                <TextInput
                                                    className="dark-input"
                                                    label={t(
                                                        "views.redeem.create_user.email"
                                                    )}
                                                    leftSection={
                                                        <IconAt size={20} />
                                                    }
                                                    {...form.getInputProps(
                                                        "user_creation.email"
                                                    )}
                                                    size="md"
                                                />
                                            </SimpleGrid>
                                            <PasswordField
                                                className="dark-input"
                                                label={t(
                                                    "views.redeem.create_user.password"
                                                )}
                                                withAsterisk
                                                size="md"
                                                leftSection={
                                                    <IconLock size={20} />
                                                }
                                                {...form.getInputProps(
                                                    "user_creation.password"
                                                )}
                                            />
                                            <PasswordField
                                                className="dark-input"
                                                label={t(
                                                    "views.redeem.create_user.confirm_password"
                                                )}
                                                withAsterisk
                                                size="md"
                                                leftSection={
                                                    <IconLock size={20} />
                                                }
                                                {...form.getInputProps(
                                                    "user_creation.confirm_password"
                                                )}
                                            />
                                        </Stack>
                                    </AccordionPanel>
                                </AccordionItem>
                            )}
                            {form.values.user_creation.mode === "login" && (
                                <AccordionItem value="user">
                                    <AccordionControl>
                                        <Group
                                            gap="md"
                                            justify="space-between"
                                            pr="md"
                                        >
                                            <Group gap="md">
                                                <Indicator
                                                    disabled={
                                                        form.values
                                                            .user_creation
                                                            .username_or_email
                                                            .length > 0 &&
                                                        form.values
                                                            .user_creation
                                                            .password.length > 0
                                                    }
                                                    color="red"
                                                >
                                                    <ThemeIcon
                                                        size="xl"
                                                        variant="light"
                                                        color="gray"
                                                    >
                                                        <IconLogin2 />
                                                    </ThemeIcon>
                                                </Indicator>
                                                <Text size="xl" fw="600">
                                                    {t(
                                                        "views.redeem.login.title"
                                                    )}
                                                </Text>
                                                {redeemed && (
                                                    <Badge
                                                        size="md"
                                                        style={{
                                                            transform:
                                                                "translate(0, 2px)",
                                                        }}
                                                        color={
                                                            redeemed.success
                                                                ? "green"
                                                                : "red"
                                                        }
                                                    >
                                                        {redeemed.resolve(
                                                            t(
                                                                "views.redeem.status.valid"
                                                            ),
                                                            (_, reason) =>
                                                                reason
                                                        )}
                                                    </Badge>
                                                )}
                                            </Group>
                                            <Button
                                                size="md"
                                                leftSection={
                                                    <IconUserPlus size={24} />
                                                }
                                                justify="space-between"
                                                variant="light"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    form.setFieldValue(
                                                        "user_creation",
                                                        {
                                                            mode: "create",
                                                            username: "",
                                                            email: "",
                                                            password: "",
                                                            confirm_password:
                                                                "",
                                                        }
                                                    );
                                                }}
                                            >
                                                <Text
                                                    fw={600}
                                                    style={{
                                                        transform:
                                                            "translate(0, -2px)",
                                                    }}
                                                >
                                                    {t(
                                                        "views.redeem.create_user.switch_to"
                                                    )}
                                                </Text>
                                            </Button>
                                        </Group>
                                    </AccordionControl>
                                    <AccordionPanel>
                                        <Stack gap="sm">
                                            <TextInput
                                                className="dark-input"
                                                withAsterisk
                                                label={t(
                                                    "views.redeem.login.username_or_email"
                                                )}
                                                leftSection={
                                                    <IconAt size={20} />
                                                }
                                                {...form.getInputProps(
                                                    "user_creation.username_or_email"
                                                )}
                                                size="md"
                                            />
                                            <PasswordField
                                                className="dark-input"
                                                label={t(
                                                    "views.redeem.login.password"
                                                )}
                                                withAsterisk
                                                size="md"
                                                leftSection={
                                                    <IconLock size={20} />
                                                }
                                                {...form.getInputProps(
                                                    "user_creation.password"
                                                )}
                                            />
                                        </Stack>
                                    </AccordionPanel>
                                </AccordionItem>
                            )}
                            {redeeming.services.map((service) => (
                                <ServiceItem
                                    key={service.id}
                                    service={service}
                                    form={form}
                                />
                            ))}
                        </Accordion>
                    </ScrollAreaAutosize>
                    <Divider />
                    <Group p="sm" justify="end" gap="sm">
                        <Button
                            variant="light"
                            color="red"
                            leftSection={<IconX size={20} />}
                            onClick={() => nav("/")}
                        >
                            {t("actions.cancel")}
                        </Button>
                        <Button
                            variant="light"
                            leftSection={<IconArrowRight size={20} />}
                            disabled={!valid}
                            onClick={() => {
                                setLoading(true);
                                api.redeem_invite(
                                    redeeming.invite.code,
                                    form.values,
                                    true
                                ).then((response) => {
                                    setRedeemed(response);
                                    setLoading(false);
                                });
                            }}
                        >
                            {!loading
                                ? t("actions.redeem")
                                : t("views.redeem.status.validating")}
                        </Button>
                    </Group>
                </Paper>
            </Stack>
        </Box>
    );
}
