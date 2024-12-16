import { ContextModalProps } from "@mantine/modals";
import { Service, ServiceGrant } from "../types/service";
import {
    ActionIcon,
    Button,
    Center,
    Group,
    Paper,
    rem,
    Select,
    Stack,
    Text,
    Textarea,
    TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Dropzone } from "@mantine/dropzone";
import {
    IconUpload,
    IconX,
    IconFile,
    IconEdit,
    IconPlus,
    IconLabelFilled,
    IconLabel,
    IconPuzzle,
    IconCheck,
    IconSettings,
    IconScript,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { FileIcon } from "../components/fileIcon";
import { filesize } from "filesize";
import { FilesMixin, PluginsMixin, ServiceMixin, useApi } from "../context/net";
import { useNotifications } from "../util/notifications";
import {
    FieldValue,
    GrantAction,
    Plugin,
    PluginConfig,
    ValidatedForm,
} from "../types/plugin";
import { DynamicAvatar } from "../components/icon";
import { PluginFieldForm } from "../components/pluginFields";

function AddGrant({
    service,
    refresh,
    close,
}: {
    service: Service;
    refresh: () => void;
    close: () => void;
}) {
    const { t } = useTranslation();
    const api = useApi(PluginsMixin, ServiceMixin);

    const form = useForm<{
        plugin: string | null;
        config: string | null;
        grant: string | null;
        values: { [key: string]: { value: FieldValue | null; valid: boolean } };
    }>({
        initialValues: {
            plugin: null,
            config: null,
            grant: null,
            values: {},
        },
    });

    const [plugins, setPlugins] = useState<{ [key: string]: Plugin }>({});
    const [configs, setConfigs] = useState<{
        [key: string]: [PluginConfig, ValidatedForm];
    }>({});

    useEffect(() => {
        api.list_plugins().then((resp) =>
            setPlugins(
                resp
                    .or_default([])
                    .reduce((prev, cur) => ({ ...prev, [cur.id]: cur }), {})
            )
        );
    }, [api.list_plugins, setPlugins]);

    useEffect(() => {
        if (form.values.plugin) {
            api.plugin_config_list_validated(form.values.plugin).then(
                setConfigs
            );
        } else {
            setConfigs({});
            form.setFieldValue("config", null);
            form.setFieldValue("grant", null);
        }
    }, [setConfigs, api.plugin_config_list_validated, form.values.plugin]);

    const grants: { [key: string]: GrantAction } = useMemo(() => {
        if (
            form.values.plugin &&
            plugins[form.values.plugin] &&
            form.values.config &&
            configs[form.values.config]
        ) {
            return plugins[form.values.plugin].metadata.grants.reduce(
                (prev, cur) => ({ ...prev, [cur.key]: cur }),
                {}
            );
        } else {
            form.setFieldValue("grant", null);
            form.setFieldValue("values", {});
            return {};
        }
    }, [
        form.values.plugin,
        plugins[form.values.plugin ?? ""],
        form.values.config,
        configs[form.values.config ?? ""],
    ]);

    return (
        <Stack gap="sm" className="grant-add grant">
            <Group gap="sm" wrap="nowrap" grow>
                <Select
                    data={Object.entries(plugins)
                        .filter(([_, { enabled }]) => enabled)
                        .map(([id, plug]) => ({
                            value: id,
                            label: plug.metadata.name,
                        }))}
                    {...form.getInputProps("plugin")}
                    leftSection={
                        form.values.plugin ? (
                            plugins[form.values.plugin]?.metadata.icon ? (
                                <DynamicAvatar
                                    source={
                                        plugins[form.values.plugin].metadata
                                            .icon as any
                                    }
                                    fallback={IconPuzzle}
                                    size={20}
                                />
                            ) : (
                                <IconPuzzle size={20} />
                            )
                        ) : (
                            <IconPuzzle size={20} />
                        )
                    }
                    nothingFoundMessage={t("common.feedback.noResults")}
                    renderOption={(option) => (
                        <Group gap="sm" justify="space-between">
                            {option.checked ? (
                                <IconCheck size={20} />
                            ) : option.option.value ? (
                                plugins[option.option.value]?.metadata.icon ? (
                                    <DynamicAvatar
                                        source={
                                            plugins[option.option.value]
                                                .metadata.icon as any
                                        }
                                        fallback={IconPuzzle}
                                        size={20}
                                    />
                                ) : (
                                    <IconPuzzle size={20} />
                                )
                            ) : (
                                <IconPuzzle size={20} />
                            )}
                            <Text>
                                {plugins[option.option.value]?.metadata.name}
                            </Text>
                        </Group>
                    )}
                    searchable
                    clearable
                    label={t("modals.addGrant.grant.field.plugin")}
                />
                <Select
                    data={Object.entries(configs)
                        .filter(([_, [__, { valid }]]) => valid)
                        .map(([id, [config]]) => ({
                            value: id,
                            label: config.name,
                        }))}
                    {...form.getInputProps("config")}
                    leftSection={
                        form.values.config ? (
                            configs[form.values.config] ? (
                                <DynamicAvatar
                                    source={
                                        (configs[form.values.config][0]
                                            .icon as any) ?? null
                                    }
                                    fallback={IconSettings}
                                    size={20}
                                />
                            ) : (
                                <IconSettings size={20} />
                            )
                        ) : (
                            <IconSettings size={20} />
                        )
                    }
                    nothingFoundMessage={t("common.feedback.noResults")}
                    renderOption={(option) => (
                        <Group gap="sm" justify="space-between">
                            {option.checked ? (
                                <IconCheck size={20} />
                            ) : option.option.value ? (
                                configs[option.option.value] ? (
                                    <DynamicAvatar
                                        source={
                                            (configs[option.option.value][0]
                                                .icon as any) ?? null
                                        }
                                        fallback={IconSettings}
                                        size={20}
                                    />
                                ) : (
                                    <IconSettings size={20} />
                                )
                            ) : (
                                <IconSettings size={20} />
                            )}
                            <Text>{configs[option.option.value][0].name}</Text>
                        </Group>
                    )}
                    searchable
                    clearable
                    label={t("modals.addGrant.grant.field.config")}
                    disabled={form.values.plugin === null}
                />
            </Group>
            {form.values.config && form.values.plugin ? (
                <>
                    <Select
                        data={Object.entries(grants).map(([key, grant]) => ({
                            value: key,
                            label: grant.label,
                        }))}
                        {...form.getInputProps("grant")}
                        leftSection={
                            form.values.grant ? (
                                grants[form.values.grant] ? (
                                    <DynamicAvatar
                                        source={
                                            (grants[form.values.grant]
                                                .icon as any) ?? null
                                        }
                                        fallback={IconScript}
                                        size={20}
                                    />
                                ) : (
                                    <IconScript size={20} />
                                )
                            ) : (
                                <IconScript size={20} />
                            )
                        }
                        nothingFoundMessage={t("common.feedback.noResults")}
                        renderOption={(option) => (
                            <Group gap="sm" justify="space-between">
                                {option.checked ? (
                                    <IconCheck size={20} />
                                ) : option.option.value ? (
                                    grants[option.option.value] ? (
                                        <DynamicAvatar
                                            source={
                                                (grants[option.option.value]
                                                    .icon as any) ?? null
                                            }
                                            fallback={IconScript}
                                            size={20}
                                            variant="transparent"
                                        />
                                    ) : (
                                        <IconScript size={20} />
                                    )
                                ) : (
                                    <IconScript size={20} />
                                )}
                                <Text>{grants[option.option.value].label}</Text>
                            </Group>
                        )}
                        searchable
                        clearable
                        label={t("modals.addGrant.grant.field.grant")}
                        disabled={form.values.plugin === null}
                    />
                    {form.values.grant &&
                    form.values.config &&
                    form.values.plugin ? (
                        <PluginFieldForm
                            plugin={plugins[form.values.plugin]}
                            fields={grants[form.values.grant].options}
                            context="service"
                            selector={{
                                config: form.values.config,
                                grant: form.values.grant,
                            }}
                            value={form.values.values}
                            onChange={(v) => form.setFieldValue("values", v)}
                        />
                    ) : (
                        <Paper className="paper-light" p="md">
                            <Center>
                                <Text c="dimmed">
                                    {t("modals.addGrant.grant.selectGrant")}
                                </Text>
                            </Center>
                        </Paper>
                    )}
                </>
            ) : (
                <Paper className="paper-light" p="md">
                    <Center>
                        <Text c="dimmed">
                            {t("modals.addGrant.grant.selectPlugin")}
                        </Text>
                    </Center>
                </Paper>
            )}
        </Stack>
    );
}

function AddAttachment({
    service,
    refresh,
    close,
}: {
    service: Service;
    refresh: () => void;
    close: () => void;
}) {
    const { t } = useTranslation();
    const form = useForm<{
        file: File | null;
        display_name: string;
        preview: boolean;
        help_text: string;
    }>({
        initialValues: {
            file: null,
            display_name: "",
            preview: false,
            help_text: "",
        },
    });
    const api = useApi(FilesMixin, ServiceMixin);
    const { error, success } = useNotifications();

    const fileData = useMemo(() => {
        if (form.values.file) {
            return {
                name: form.values.file.name,
                size: form.values.file.size,
                type: form.values.file.type,
            };
        } else {
            return null;
        }
    }, [
        form.values.file?.name,
        form.values.file?.size,
        form.values.file?.type,
    ]);

    return (
        <form
            onSubmit={form.onSubmit(
                ({ file, display_name, preview, help_text }) => {
                    if (file && display_name) {
                        api.upload_file(file).then((file_resp) => {
                            file_resp
                                .and_then(({ id }) =>
                                    api
                                        .createServiceGrant(service._id, {
                                            type: "attachment",
                                            file_id: id,
                                            display_name,
                                            preview,
                                            help:
                                                help_text.length > 0
                                                    ? help_text
                                                    : null,
                                        })
                                        .then((service_resp) =>
                                            service_resp
                                                .and_then((_) => {
                                                    refresh();
                                                    close();
                                                    success(
                                                        t(
                                                            "modals.addGrant.feedback.success"
                                                        )
                                                    );
                                                })
                                                .or_else((_, reason) =>
                                                    error(
                                                        t(
                                                            "modals.addGrant.feedback.error",
                                                            { reason }
                                                        )
                                                    )
                                                )
                                        )
                                )
                                .or_else((_, reason) =>
                                    error(
                                        t(
                                            "modals.addGrant.attachment.fileError",
                                            { reason }
                                        )
                                    )
                                );
                        });
                    }
                }
            )}
        >
            <Stack gap="sm" className="grant-add attachment">
                <Dropzone
                    onDrop={(files) => {
                        const file = files[0];
                        if (file.type.startsWith("image/")) {
                            form.setFieldValue("preview", true);
                        } else {
                            form.setFieldValue("preview", false);
                        }
                        form.setFieldValue("file", file);
                        if (form.values.display_name.length === 0) {
                            form.setFieldValue("display_name", file.name);
                        }
                    }}
                    maxSize={1024 ** 3}
                    maxFiles={1}
                    className="attachment-drop"
                    bg="var(--mantine-color-default)"
                >
                    {fileData ? (
                        <Group
                            justify="center"
                            mih={220}
                            className="attachment-drop-inner preview"
                        >
                            <Paper
                                p="lg"
                                miw="50%"
                                style={{ pointerEvents: "all" }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Group justify="space-between">
                                    <Group gap="md">
                                        <FileIcon
                                            mime={fileData.type}
                                            size={48}
                                        />
                                        <Stack gap={2}>
                                            <Text size="md">
                                                {fileData.name}
                                            </Text>
                                            <Text size="sm" c="dimmed">
                                                {filesize(fileData.size)}
                                            </Text>
                                        </Stack>
                                    </Group>
                                    <ActionIcon
                                        size="lg"
                                        onClick={() => {
                                            if (
                                                form.values.display_name ===
                                                fileData.name
                                            ) {
                                                form.setFieldValue(
                                                    "display_name",
                                                    ""
                                                );
                                            }
                                            form.setFieldValue("file", null);
                                            form.setFieldValue(
                                                "preview",
                                                false
                                            );
                                        }}
                                        variant="transparent"
                                    >
                                        <IconX />
                                    </ActionIcon>
                                </Group>
                            </Paper>
                        </Group>
                    ) : (
                        <Group
                            justify="center"
                            gap="xl"
                            mih={220}
                            style={{ pointerEvents: "none" }}
                            className="attachment-drop-inner"
                        >
                            <Dropzone.Accept>
                                <IconUpload
                                    style={{
                                        width: rem(52),
                                        height: rem(52),
                                    }}
                                    stroke={1.5}
                                />
                            </Dropzone.Accept>
                            <Dropzone.Reject>
                                <IconX
                                    style={{
                                        width: rem(52),
                                        height: rem(52),
                                    }}
                                    stroke={1.5}
                                />
                            </Dropzone.Reject>
                            <Dropzone.Idle>
                                <IconFile
                                    style={{
                                        width: rem(52),
                                        height: rem(52),
                                    }}
                                    stroke={1.5}
                                />
                            </Dropzone.Idle>
                            <Stack gap={0} className="attachment-drop-text">
                                <Text size="xl">
                                    {t("modals.addGrant.attachment.drop.title")}
                                </Text>
                                <Text size="sm" c="dimmed" mt={7}>
                                    {t(
                                        "modals.addGrant.attachment.drop.subtitle"
                                    )}
                                </Text>
                            </Stack>
                        </Group>
                    )}
                </Dropzone>
                <TextInput
                    placeholder={t("modals.addGrant.attachment.displayName")}
                    leftSection={<IconEdit size={20} />}
                    size="md"
                    style={{ flexGrow: 1 }}
                    {...form.getInputProps("display_name")}
                />
                <Textarea
                    placeholder={t("modals.addGrant.attachment.helpText")}
                    {...form.getInputProps("help_text")}
                    minRows={2}
                    maxRows={6}
                    autosize
                    size="md"
                />
                <Group gap="sm" justify="space-between">
                    <Button
                        leftSection={<IconX size={24} />}
                        variant="light"
                        size="md"
                        onClick={close}
                    >
                        {t("actions.cancel")}
                    </Button>
                    <Button
                        leftSection={<IconPlus size={24} />}
                        size="md"
                        disabled={
                            form.values.file === null ||
                            form.values.display_name === null
                        }
                        type="submit"
                    >
                        {t("actions.create")}
                    </Button>
                </Group>
            </Stack>
        </form>
    );
}

function AddMessage({
    service,
    refresh,
    close,
}: {
    service: Service;
    refresh: () => void;
    close: () => void;
}) {
    const { t } = useTranslation();
    const api = useApi(ServiceMixin);
    const form = useForm({
        initialValues: {
            title: "",
            subtitle: "",
        },
        validate: {
            title: (value) =>
                value.length > 0 ? null : t("errors.form.empty"),
        },
        transformValues(values) {
            return {
                title: values.title,
                subtitle: values.subtitle.length > 0 ? values.subtitle : null,
                content: "",
            };
        },
    });
    const { success, error } = useNotifications();
    return (
        <form
            onSubmit={form.onSubmit((values) => {
                api.createServiceGrant(service._id, {
                    type: "message",
                    ...values,
                }).then((response) =>
                    response
                        .and_then((_) => {
                            success(t("modals.addGrant.feedback.success"));
                            refresh();
                            close();
                        })
                        .or_else((_, reason) =>
                            error(
                                t("modals.addGrant.feedback.error", { reason })
                            )
                        )
                );
            })}
        >
            <Stack gap="sm" className="grant-add message">
                <TextInput
                    size="md"
                    label={t("modals.addGrant.message.field.title")}
                    withAsterisk
                    {...form.getInputProps("title")}
                    leftSection={<IconLabelFilled />}
                />
                <TextInput
                    size="md"
                    label={t("modals.addGrant.message.field.subtitle")}
                    {...form.getInputProps("subtitle")}
                    leftSection={<IconLabel />}
                />
                <Group gap="sm" justify="space-between">
                    <Button
                        leftSection={<IconX size={24} />}
                        variant="light"
                        size="md"
                        onClick={close}
                    >
                        {t("actions.cancel")}
                    </Button>
                    <Button
                        leftSection={<IconPlus size={24} />}
                        size="md"
                        type="submit"
                    >
                        {t("actions.create")}
                    </Button>
                </Group>
            </Stack>
        </form>
    );
}

export function AddServiceGrantModal({
    id,
    context,
    innerProps,
}: ContextModalProps<{
    type: ServiceGrant["type"];
    service: Service;
    refresh: () => void;
}>) {
    switch (innerProps.type) {
        case "grant":
            return (
                <AddGrant
                    {...innerProps}
                    close={() => context.closeContextModal(id)}
                />
            );
        case "attachment":
            return (
                <AddAttachment
                    {...innerProps}
                    close={() => context.closeContextModal(id)}
                />
            );
        case "message":
            return (
                <AddMessage
                    {...innerProps}
                    close={() => context.closeContextModal(id)}
                />
            );
        default:
            return <></>;
    }
}
