import {
    ActionIcon,
    Button,
    Divider,
    Group,
    Loader,
    Paper,
    Pill,
    rem,
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
import { isString } from "lodash";
import { DynamicIcon } from "../components/icon";
import { useInputState } from "@mantine/hooks";
import validator from "validator";

function PluginPreview({
    preview,
    onRemove,
    onConfirm,
}: {
    preview: PluginMeta;
    onRemove: () => void;
    onConfirm: () => void;
}) {
    const { t } = useTranslation();
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
                        <DynamicIcon
                            fallback={IconPuzzle}
                            icon={preview.icon ?? "IconPuzzle"}
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
                    <Group gap="sm" wrap="nowrap">
                        <ThemeIcon variant="transparent">
                            <IconAssemblyFilled size={20} />
                        </ThemeIcon>
                        <Group gap={4}>
                            {preview.capabilities.map((v) => (
                                <Pill bg="gray.8" key={v}>
                                    {t(`views.admin.plugins.capability.${v}`)}
                                </Pill>
                            ))}
                        </Group>
                    </Group>
                </Stack>
                <ActionIcon variant="transparent" size="md" onClick={onRemove}>
                    <IconX />
                </ActionIcon>
            </Group>
            <Group justify="end">
                <Button
                    leftSection={<IconUpload size={20} />}
                    onClick={onConfirm}
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
    onSubmitFile: (file: File) => void;
    onSubmitUrl: (url: string) => void;
}>) {
    const [selectedFile, setSelectedFile] = useState<FileWithPath | null>(null);
    const [filePreview, setFilePreview] = useState<PluginMeta | null>(null);
    const [urlPreview, setUrlPreview] = useState<PluginMeta | null>(null);
    const [pluginUrl, setPluginUrl] = useInputState("");
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();
    const { error } = useNotifications();
    const api = useApi(PluginsMixin);

    return (
        <Stack gap="sm" className="add-plugin-main">
            <Dropzone
                disabled={filePreview && selectedFile ? true : false}
                onDrop={(files) => {
                    setLoading(true);
                    api.preview_plugin_from_file(files[0]).then((response) => {
                        setLoading(false);
                        if (response.success) {
                            setFilePreview(response.data);
                            setSelectedFile(files[0]);
                        } else {
                            error(
                                t("modals.addPlugin.error", {
                                    reason: response.response
                                        ? isString(response)
                                            ? response.response
                                            : (response.response.data as any)
                                                  .description ??
                                              "Unknown Error"
                                        : "Unknown Error",
                                })
                            );
                        }
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
                            onConfirm={() => {}}
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
                        {loading ? (
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
                <ActionIcon
                    disabled={
                        !validator.isURL(pluginUrl, {
                            protocols: ["http", "https"],
                            validate_length: true,
                        })
                    }
                    size={42}
                >
                    <IconUpload />
                </ActionIcon>
            </Group>
        </Stack>
    );
}
