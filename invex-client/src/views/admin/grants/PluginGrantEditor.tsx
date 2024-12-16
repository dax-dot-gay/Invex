import {
    Badge,
    Button,
    Center,
    Divider,
    Fieldset,
    Group,
    Loader,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    Textarea,
    TextInput,
    ThemeIcon,
} from "@mantine/core";
import { Service, ServiceGrant } from "../../../types/service";
import { useDebouncedValue, useInputState } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import {
    IconAlertTriangleFilled,
    IconCheck,
    IconDeviceFloppy,
    IconLink,
    IconPuzzle,
    IconSettings,
    IconX,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import isURL from "validator/lib/isURL";
import {
    PluginsMixin,
    Response,
    ServiceMixin,
    useApi,
} from "../../../context/net";
import {
    FieldValue,
    Plugin,
    PluginConfig,
    ValidatedForm,
} from "../../../types/plugin";
import { DynamicAvatar } from "../../../components/icon";
import { capitalCase } from "change-case";
import { PluginFieldForm } from "../../../components/pluginFields";

export function PluginGrantEditor({
    id,
    service,
    grant,
    save,
}: {
    id: string;
    service: Service;
    grant: Extract<ServiceGrant, { type: "grant" }>;
    save: (grant: ServiceGrant) => Promise<void>;
}) {
    const { t } = useTranslation();
    const api = useApi(PluginsMixin, ServiceMixin);
    const [url, setUrl] = useInputState(grant.url ?? "");
    const [help, setHelp] = useInputState(grant.help ?? "");
    const [urlError, setUrlError] = useState<string | null>(null);

    const [debounced] = useDebouncedValue(
        {
            url: url.length === 0 ? null : url,
            help: help.length === 0 ? null : help,
        },
        500
    );

    useEffect(() => {
        if ((debounced.url && isURL(debounced.url)) || !debounced.url) {
            setUrlError(null);
            save({ ...grant, ...debounced });
        } else {
            setUrlError(t("errors.form.invalidUrl"));
        }
    }, [debounced.help, debounced.url, save]);

    const [plugin, setPlugin] = useState<Response<Plugin> | null>(null);
    const [config, setConfig] = useState<Response<
        [PluginConfig, ValidatedForm]
    > | null>(null);
    const [validatedGrant, setValidatedGrant] = useState<Response<
        [Extract<ServiceGrant, { type: "grant" }>, ValidatedForm]
    > | null>(null);
    const [grantOptions, setGrantOptions] = useState<{
        [key: string]: {
            value: FieldValue | null;
            valid: boolean;
        };
    }>({});

    useEffect(() => {
        api.get_plugin(grant.plugin_id).then(setPlugin);
    }, [api.get_plugin, grant.plugin_id, setPlugin]);

    useEffect(() => {
        api.plugin_config_validate(grant.plugin_id, grant.config_id).then(
            setConfig
        );
    }, [
        api.get_plugin_config_with_response,
        grant.plugin_id,
        grant.config_id,
        setConfig,
    ]);

    useEffect(() => {
        api.validateServiceGrant(service._id, id).then((response) => {
            setValidatedGrant(response as any);
            response.and_then(([_, validated]) =>
                setGrantOptions(
                    Object.entries(validated.arguments).reduce(
                        (prev, [key, arg]) => ({
                            ...prev,
                            [key]: { value: arg.value, valid: arg.valid },
                        }),
                        {}
                    )
                )
            );
        });
    }, [api.validateServiceGrant, service._id, id, setValidatedGrant]);

    return (
        <Stack gap="xs">
            <TextInput
                leftSection={<IconLink size={20} />}
                label={t("views.admin.services.config.grants.grant.field.url")}
                value={url}
                onChange={setUrl}
                className="dark-input"
                error={urlError ?? undefined}
            />
            <Textarea
                label={t("views.admin.services.config.grants.grant.field.help")}
                value={help}
                onChange={setHelp}
                className="dark-input"
            />
            <Divider />
            {plugin && config && validatedGrant ? (
                <Stack gap="sm">
                    <SimpleGrid
                        cols={{ base: 1, xl: 3 }}
                        spacing="xs"
                        verticalSpacing="xs"
                    >
                        {plugin.resolve(
                            (plug) => (
                                <Paper
                                    className="paper-light grant-status plugin"
                                    p="sm"
                                >
                                    <Badge
                                        color="primary"
                                        variant="light"
                                        className="status-mark"
                                    >
                                        {t(
                                            "views.admin.services.config.grants.grant.status.plugin"
                                        )}
                                    </Badge>
                                    <Group gap="sm" wrap="nowrap">
                                        {plug.enabled ? (
                                            <ThemeIcon
                                                color="green"
                                                radius="xl"
                                                size="lg"
                                            >
                                                <IconCheck size={20} />
                                            </ThemeIcon>
                                        ) : (
                                            <ThemeIcon
                                                color="yellow"
                                                radius="xl"
                                                size="lg"
                                            >
                                                <IconAlertTriangleFilled
                                                    size={20}
                                                />
                                            </ThemeIcon>
                                        )}
                                        <Stack gap={4}>
                                            <Group gap="xs" wrap="nowrap">
                                                <DynamicAvatar
                                                    source={
                                                        (plug.metadata
                                                            .icon as any) ??
                                                        "icon:IconPuzzle"
                                                    }
                                                    fallback={IconPuzzle}
                                                    size={20}
                                                />
                                                <Text>
                                                    {plug.metadata.name}
                                                </Text>
                                            </Group>

                                            <Group gap="xs" wrap="nowrap">
                                                <Text c="dimmed" size="xs">
                                                    {plug.metadata.id} - v
                                                    {plug.metadata.version}
                                                </Text>
                                                <Badge
                                                    variant="light"
                                                    size="xs"
                                                    color={
                                                        plug.enabled
                                                            ? "green"
                                                            : "yellow"
                                                    }
                                                >
                                                    {plug.enabled
                                                        ? t(
                                                              "views.admin.plugins.item.state.on"
                                                          )
                                                        : t(
                                                              "views.admin.plugins.item.state.off"
                                                          )}
                                                </Badge>
                                            </Group>
                                        </Stack>
                                    </Group>
                                </Paper>
                            ),
                            (_, reason) => (
                                <Paper
                                    className="paper-light grant-status plugin"
                                    p="sm"
                                >
                                    <Badge
                                        color="primary"
                                        variant="light"
                                        className="status-mark"
                                    >
                                        {t(
                                            "views.admin.services.config.grants.grant.status.plugin"
                                        )}
                                    </Badge>
                                    <Group gap="sm" wrap="nowrap">
                                        <ThemeIcon
                                            color="red"
                                            radius="xl"
                                            size="lg"
                                        >
                                            <IconX size={20} />
                                        </ThemeIcon>
                                        <Stack gap={4}>
                                            <Text>
                                                {t(
                                                    "views.admin.services.config.grants.grant.errorStatus.plugin"
                                                )}
                                            </Text>
                                            <Text c="dimmed" size="xs">
                                                {reason}
                                            </Text>
                                        </Stack>
                                    </Group>
                                </Paper>
                            )
                        )}
                        {config.resolve(
                            (conf) => (
                                <Paper
                                    className="paper-light grant-status config"
                                    p="sm"
                                >
                                    <Badge
                                        color="primary"
                                        variant="light"
                                        className="status-mark"
                                    >
                                        {t(
                                            "views.admin.services.config.grants.grant.status.config"
                                        )}
                                    </Badge>
                                    <Group gap="sm" wrap="nowrap">
                                        {conf[1].valid ? (
                                            <ThemeIcon
                                                color="green"
                                                radius="xl"
                                                size="lg"
                                            >
                                                <IconCheck size={20} />
                                            </ThemeIcon>
                                        ) : (
                                            <ThemeIcon
                                                color="yellow"
                                                radius="xl"
                                                size="lg"
                                            >
                                                <IconAlertTriangleFilled
                                                    size={20}
                                                />
                                            </ThemeIcon>
                                        )}
                                        <Stack gap={4}>
                                            <Group gap="xs" wrap="nowrap">
                                                <DynamicAvatar
                                                    source={
                                                        (conf[0].icon as any) ??
                                                        "icon:IconSettings"
                                                    }
                                                    fallback={IconSettings}
                                                    size={20}
                                                />
                                                <Text>{conf[0].name}</Text>
                                            </Group>

                                            <Badge
                                                variant="light"
                                                size="xs"
                                                color={
                                                    conf[1].valid
                                                        ? "green"
                                                        : "yellow"
                                                }
                                            >
                                                {conf[1].valid
                                                    ? t("common.words.valid")
                                                    : t("common.words.invalid")}
                                            </Badge>
                                        </Stack>
                                    </Group>
                                </Paper>
                            ),
                            (_, reason) => (
                                <Paper
                                    className="paper-light grant-status config"
                                    p="sm"
                                >
                                    <Badge
                                        color="primary"
                                        variant="light"
                                        className="status-mark"
                                    >
                                        {t(
                                            "views.admin.services.config.grants.grant.status.config"
                                        )}
                                    </Badge>
                                    <Group gap="sm" wrap="nowrap">
                                        <ThemeIcon
                                            color="red"
                                            radius="xl"
                                            size="lg"
                                        >
                                            <IconX size={20} />
                                        </ThemeIcon>
                                        <Stack gap={4}>
                                            <Text>
                                                {t(
                                                    "views.admin.services.config.grants.grant.errorStatus.config"
                                                )}
                                            </Text>
                                            <Text c="dimmed" size="xs">
                                                {reason}
                                            </Text>
                                        </Stack>
                                    </Group>
                                </Paper>
                            )
                        )}
                        {validatedGrant.resolve(
                            ([grant, validation]) => (
                                <Paper
                                    className="paper-light grant-status grant"
                                    p="sm"
                                >
                                    <Badge
                                        color="primary"
                                        variant="light"
                                        className="status-mark"
                                    >
                                        {t(
                                            "views.admin.services.config.grants.grant.status.grant"
                                        )}
                                    </Badge>
                                    <Group gap="sm" wrap="nowrap">
                                        {validation.valid ? (
                                            <ThemeIcon
                                                color="green"
                                                radius="xl"
                                                size="lg"
                                            >
                                                <IconCheck size={20} />
                                            </ThemeIcon>
                                        ) : (
                                            <ThemeIcon
                                                color="yellow"
                                                radius="xl"
                                                size="lg"
                                            >
                                                <IconAlertTriangleFilled
                                                    size={20}
                                                />
                                            </ThemeIcon>
                                        )}
                                        <Stack gap={4}>
                                            <Text>
                                                {capitalCase(grant.plugin_id)}{" "}
                                                :: {capitalCase(grant.grant_id)}
                                            </Text>

                                            <Badge
                                                variant="light"
                                                size="xs"
                                                color={
                                                    validation.valid
                                                        ? "green"
                                                        : "yellow"
                                                }
                                            >
                                                {validation.valid
                                                    ? t("common.words.valid")
                                                    : t("common.words.invalid")}
                                            </Badge>
                                        </Stack>
                                    </Group>
                                </Paper>
                            ),
                            (_, reason) => (
                                <Paper
                                    className="paper-light grant-status grant"
                                    p="sm"
                                >
                                    <Badge
                                        color="primary"
                                        variant="light"
                                        className="status-mark"
                                    >
                                        {t(
                                            "views.admin.services.config.grants.grant.status.grant"
                                        )}
                                    </Badge>
                                    <Group gap="sm" wrap="nowrap">
                                        <ThemeIcon
                                            color="red"
                                            radius="xl"
                                            size="lg"
                                        >
                                            <IconX size={20} />
                                        </ThemeIcon>
                                        <Stack gap={4}>
                                            <Text>
                                                {t(
                                                    "views.admin.services.config.grants.grant.errorStatus.grant"
                                                )}
                                            </Text>
                                            <Text c="dimmed" size="xs">
                                                {reason}
                                            </Text>
                                        </Stack>
                                    </Group>
                                </Paper>
                            )
                        )}
                    </SimpleGrid>
                    {plugin.resolve(
                        (p) => {
                            const action = p.metadata.grants.find(
                                (a) => a.key === grant.grant_id
                            );
                            if (action) {
                                return (
                                    <Fieldset
                                        p="sm"
                                        legend={t(
                                            "views.admin.services.config.grants.grant.config"
                                        )}
                                    >
                                        {action.arguments.length > 0 ? (
                                            <Stack gap="sm">
                                                <PluginFieldForm
                                                    context="service"
                                                    plugin={p}
                                                    fields={action.options}
                                                    value={grantOptions}
                                                    onChange={setGrantOptions}
                                                    selector={{
                                                        config: config.resolve(
                                                            (v) => v[0]._id,
                                                            undefined
                                                        ),
                                                        grant: action.key,
                                                    }}
                                                />
                                                <Group gap="sm" justify="end">
                                                    <Button
                                                        leftSection={
                                                            <IconDeviceFloppy
                                                                size={20}
                                                            />
                                                        }
                                                        disabled={
                                                            !Object.values(
                                                                grantOptions
                                                            ).every(
                                                                (v) => v.valid
                                                            )
                                                        }
                                                        onClick={() => {
                                                            save({
                                                                ...grant,
                                                                options:
                                                                    Object.entries(
                                                                        grantOptions
                                                                    ).reduce(
                                                                        (
                                                                            prev,
                                                                            [
                                                                                key,
                                                                                {
                                                                                    value,
                                                                                },
                                                                            ]
                                                                        ) => ({
                                                                            ...prev,
                                                                            [key]: value,
                                                                        }),
                                                                        {}
                                                                    ),
                                                            });
                                                        }}
                                                    >
                                                        {t(
                                                            "common.actions.save"
                                                        )}
                                                    </Button>
                                                </Group>
                                            </Stack>
                                        ) : (
                                            <Center p="md">
                                                {t("common.feedback.noFields")}
                                            </Center>
                                        )}
                                    </Fieldset>
                                );
                            } else {
                                return (
                                    <Paper p="sm" className="paper-light">
                                        <Group gap="sm" wrap="nowrap">
                                            <ThemeIcon
                                                color="red"
                                                radius="xl"
                                                size="lg"
                                            >
                                                <IconX size={20} />
                                            </ThemeIcon>
                                            <Text>
                                                {t(
                                                    "views.admin.services.config.grants.grant.unknownGrant"
                                                )}
                                            </Text>
                                        </Group>
                                    </Paper>
                                );
                            }
                        },
                        (_, reason) => (
                            <Paper p="sm" className="paper-light">
                                <Group gap="sm" wrap="nowrap">
                                    <ThemeIcon
                                        color="red"
                                        radius="xl"
                                        size="lg"
                                    >
                                        <IconX size={20} />
                                    </ThemeIcon>
                                    <Stack gap={4}>
                                        <Text>
                                            {t(
                                                "views.admin.services.config.grants.grant.unknownGrant"
                                            )}
                                        </Text>
                                        <Text c="dimmed" size="xs">
                                            {reason}
                                        </Text>
                                    </Stack>
                                </Group>
                            </Paper>
                        )
                    )}
                </Stack>
            ) : (
                <Center p="xl">
                    <Loader />
                </Center>
            )}
        </Stack>
    );
}
