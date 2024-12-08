import {
    ActionIcon,
    Button,
    Divider,
    Group,
    Loader,
    Paper,
    rem,
    Space,
    Stack,
    Text,
    TextInput,
    ThemeIcon,
} from "@mantine/core";
import { ContextModalProps } from "@mantine/modals";
import { Dropzone, FileWithPath } from "@mantine/dropzone";
import { useState } from "react";
import {
    IconAssemblyFilled,
    IconLink,
    IconPuzzle,
    IconUpload,
    IconUserEdit,
    IconX,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useNotifications } from "../util/notifications";
import { PluginMeta } from "../types/plugin";
import { PluginsMixin, useApi } from "../context/net";
import { DynamicAvatar } from "../components/icon";
import { useInputState } from "@mantine/hooks";
import validator from "validator";

function PluginPreview({
    preview,
    onRemove,
    onConfirm,
}: {
    preview: PluginMeta;
    onRemove: () => void;
    onConfirm: () => Promise<void>;
}) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    return (
        <Paper
            className="paper-light"
            p="sm"
            shadow="sm"
            style={{ pointerEvents: "all" }}
            onClick={(e) => e.stopPropagation()}
        >
            <Group gap="sm" justify="space-between" align="start" wrap="nowrap">
                <Stack gap="sm">
                    <Group gap="sm">
                        <DynamicAvatar
                            fallback={IconPuzzle}
                            source={(preview.icon as any) ?? "icon:_"}
                            size={28}
                        />
                        <Stack gap={0}>
                            <Text fw={600}>{preview.name}</Text>
                            <Text size="xs" c="dimmed">
                                v{preview.version}
                            </Text>
                        </Stack>
                    </Group>
                    <Group gap="sm">
                        <ThemeIcon variant="transparent">
                            <IconUserEdit size={20} />
                        </ThemeIcon>
                        {preview.author ? (
                            <Text>{preview.author}</Text>
                        ) : (
                            <Text c="dimmed" fs="italic">
                                {t("views.admin.plugins.noAuthor")}
                            </Text>
                        )}
                    </Group>
                </Stack>
                <ActionIcon variant="transparent" size="md" onClick={onRemove}>
                    <IconX />
                </ActionIcon>
            </Group>
            <Space h="sm" />
            <Group justify="end">
                <Button
                    leftSection={<IconUpload size={20} />}
                    onClick={() => {
                        setLoading(true);
                        onConfirm().then(() => setLoading(false));
                    }}
                    loading={loading}
                >
                    {t("modals.addPlugin.upload.confirm")}
                </Button>
            </Group>
        </Paper>
    );
}

export function AddPluginModal({
    id,
    context,
    innerProps,
}: ContextModalProps<{
    onSubmitFile: (file: File) => Promise<void>;
    onSubmitUrl: (url: string) => Promise<void>;
}>) {
    const [selectedFile, setSelectedFile] = useState<FileWithPath | null>(null);
    const [filePreview, setFilePreview] = useState<PluginMeta | null>(null);
    const [urlPreview, setUrlPreview] = useState<PluginMeta | null>(null);
    const [pluginUrl, setPluginUrl] = useInputState("");
    const [confirmedPluginUrl, setConfirmedPluginUrl] = useState<string | null>(
        null
    );
    const [fileLoading, setFileLoading] = useState(false);
    const [urlLoading, setUrlLoading] = useState(false);
    const { t } = useTranslation();
    const { error } = useNotifications();
    const api = useApi(PluginsMixin);

    return (
        <Stack gap="sm" className="add-plugin-main">
            <Dropzone
                disabled={filePreview && selectedFile ? true : false}
                onDrop={(files) => {
                    setFileLoading(true);
                    api.preview_plugin_from_file(files[0]).then((response) => {
                        setFileLoading(false);
                        response
                            .and_then((data) => {
                                setFilePreview(data);
                                setSelectedFile(files[0]);
                            })
                            .or_else((_) =>
                                error(
                                    t("modals.addPlugin.error", {
                                        reason:
                                            response.reason ?? "Unknown Error",
                                    })
                                )
                            );
                    });
                }}
                onReject={console.log}
                maxSize={1024 ** 3}
                maxFiles={1}
                accept={["application/wasm"]}
                className="add-plugin-drop"
                bg="var(--mantine-color-default)"
            >
                {filePreview ? (
                    <Group
                        justify="center"
                        align="center"
                        mih={220}
                        grow
                        p="xl"
                    >
                        <PluginPreview
                            preview={filePreview}
                            onConfirm={async () => {
                                await innerProps.onSubmitFile(
                                    selectedFile as File
                                );
                                context.closeContextModal(id);
                            }}
                            onRemove={() => {
                                setSelectedFile(null);
                                setFilePreview(null);
                            }}
                        />
                    </Group>
                ) : (
                    <Group
                        justify="center"
                        gap="xl"
                        mih={220}
                        style={{ pointerEvents: "none" }}
                        className="add-plugin-drop-inner"
                    >
                        {fileLoading ? (
                            <Loader />
                        ) : (
                            <>
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
                                    <IconAssemblyFilled
                                        style={{
                                            width: rem(52),
                                            height: rem(52),
                                        }}
                                        stroke={1.5}
                                    />
                                </Dropzone.Idle>
                            </>
                        )}
                        <Stack gap={0} className="add-plugin-drop-text">
                            <Text size="xl">
                                {t("modals.addPlugin.upload.title")}
                            </Text>
                            <Text size="sm" c="dimmed" mt={7}>
                                {t("modals.addPlugin.upload.desc")}
                            </Text>
                        </Stack>
                    </Group>
                )}
            </Dropzone>
            <Divider label={t("common.words.or").toUpperCase()} />
            <Group wrap="nowrap" gap="sm">
                <TextInput
                    size="md"
                    placeholder={t("modals.addPlugin.url.placeholder")}
                    leftSection={<IconLink size={20} />}
                    value={pluginUrl}
                    onChange={setPluginUrl}
                    style={{ flexGrow: 1 }}
                />
                {confirmedPluginUrl ? (
                    <ActionIcon
                        size={42}
                        onClick={() => {
                            setPluginUrl("");
                            setConfirmedPluginUrl(null);
                            setUrlPreview(null);
                        }}
                    >
                        <IconX />
                    </ActionIcon>
                ) : (
                    <ActionIcon
                        disabled={
                            !validator.isURL(pluginUrl, {
                                protocols: ["http", "https"],
                                validate_length: true,
                            })
                        }
                        size={42}
                        loading={urlLoading}
                        onClick={() => {
                            setUrlLoading(true);
                            api.preview_plugin_from_url(pluginUrl).then(
                                (response) => {
                                    setUrlLoading(false);
                                    response
                                        .and_then((data) => {
                                            setUrlPreview(data);
                                            setConfirmedPluginUrl(pluginUrl);
                                        })
                                        .or_else((_) =>
                                            error(
                                                t("modals.addPlugin.error", {
                                                    reason:
                                                        response.reason ??
                                                        "Unknown Error",
                                                })
                                            )
                                        );
                                }
                            );
                        }}
                    >
                        <IconUpload />
                    </ActionIcon>
                )}
            </Group>
            {confirmedPluginUrl && urlPreview && (
                <PluginPreview
                    preview={urlPreview}
                    onConfirm={async () => {
                        await innerProps.onSubmitUrl(
                            confirmedPluginUrl as string
                        );
                        context.closeContextModal(id);
                    }}
                    onRemove={() => {
                        setConfirmedPluginUrl(null);
                        setUrlPreview(null);
                        setPluginUrl("");
                    }}
                />
            )}
        </Stack>
    );
}
