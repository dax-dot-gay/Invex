import { ContextModalProps } from "@mantine/modals";
import { Service, ServiceGrant } from "../types/service";
import {
    ActionIcon,
    Button,
    Group,
    Paper,
    rem,
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
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { FileIcon } from "../components/fileIcon";
import { filesize } from "filesize";
import { FilesMixin, ServiceMixin, useApi } from "../context/net";
import { useNotifications } from "../util/notifications";

function AddAccount({
    service,
    refresh,
    close,
}: {
    service: Service;
    refresh: () => void;
    close: () => void;
}) {
    return <Stack gap="sm" className="grant-add account"></Stack>;
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
    return <Stack gap="sm" className="grant-add message"></Stack>;
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
        case "account":
            return (
                <AddAccount
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
