import { useEffect, useState } from "react";
import { FilesMixin, useApi } from "../../../../context/net";
import { AttachmentGIProps } from "../types";
import { FileInfo } from "../../../../types/files";
import { extension } from "mime-types";
import {
    ActionIcon,
    Badge,
    Center,
    Group,
    Loader,
    Paper,
    Stack,
    Text,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import { FileIcon } from "../../../../components/fileIcon";
import {
    IconDownload,
    IconFileCode2,
    IconFileDescription,
    IconFileDownload,
    IconFilePencil,
} from "@tabler/icons-react";
import { downloadURL } from "../../../../util/funcs";

export function AttachmentItem({ grant }: AttachmentGIProps) {
    const api = useApi(FilesMixin);
    const [metadata, setMetadata] = useState<FileInfo | null>(null);
    const { t } = useTranslation();

    useEffect(() => {
        api.get_file_info(grant.file_id).then(setMetadata);
    }, [grant.file_id, api.get_file_info, setMetadata]);

    return metadata ? (
        <Group p="sm" gap="sm" wrap="nowrap">
            <Paper
                h={192}
                w={192}
                style={{ overflow: "hidden", position: "relative" }}
                className="paper-light"
                withBorder
            >
                {grant.preview ? (
                    <img
                        src={`${location.origin}/api/files/${grant.file_id}`}
                        height={192}
                        width={192}
                    />
                ) : (
                    <Center>
                        <FileIcon size={32} mime={metadata.content_type} />
                    </Center>
                )}
                <ActionIcon
                    style={{
                        bottom: "8px",
                        right: "8px",
                        position: "absolute",
                        zIndex: 100,
                    }}
                    size="lg"
                    radius="xl"
                    variant="white"
                    onClick={() =>
                        downloadURL(
                            `${location.origin}/api/files/${grant.file_id}`,
                            metadata.original_filename
                                ? metadata.original_filename +
                                      "." +
                                      (extension(metadata.content_type) ??
                                          "bin")
                                : grant.file_id +
                                      "." +
                                      (extension(metadata.content_type) ??
                                          "bin")
                        )
                    }
                >
                    <IconDownload size={20} />
                </ActionIcon>
            </Paper>
            <Stack gap="sm" justify="start" h="192px" w="calc(100% - 204px)">
                {grant.display_name && (
                    <Paper className="paper-light" radius="xl" pr="md">
                        <Group gap="md" justify="space-between">
                            <Badge
                                size="xl"
                                color="gray"
                                variant="light"
                                leftSection={<IconFileDescription size={20} />}
                            >
                                {t(
                                    "views.invites.item.grant.attachment.displayName"
                                )}
                            </Badge>
                            <Text fw="600" size="sm" ff="monospace">
                                {grant.display_name}
                            </Text>
                        </Group>
                    </Paper>
                )}
                <Paper className="paper-light" radius="xl" pr="md">
                    <Group gap="md" justify="space-between">
                        <Badge
                            size="xl"
                            color="gray"
                            variant="light"
                            leftSection={<IconFilePencil size={20} />}
                        >
                            {t(
                                "views.invites.item.grant.attachment.ogFileName"
                            )}
                        </Badge>
                        <Text fw="600" size="sm" ff="monospace">
                            {metadata.original_filename
                                ? metadata.original_filename +
                                  "." +
                                  (extension(metadata.content_type) ?? "bin")
                                : "-"}
                        </Text>
                    </Group>
                </Paper>
                <Paper className="paper-light" radius="xl" pr="md">
                    <Group gap="md" justify="space-between">
                        <Badge
                            size="xl"
                            color="gray"
                            variant="light"
                            leftSection={<IconFileCode2 size={20} />}
                        >
                            {t("views.invites.item.grant.attachment.mime")}
                        </Badge>
                        <Text fw="600" size="sm" ff="monospace">
                            {metadata.content_type}
                        </Text>
                    </Group>
                </Paper>
                <Paper className="paper-light" radius="xl" pr="md">
                    <Group gap="md" justify="space-between">
                        <Badge
                            size="xl"
                            color="gray"
                            variant="light"
                            leftSection={<IconFileDownload size={20} />}
                        >
                            {t("views.invites.item.grant.attachment.id")}
                        </Badge>
                        <Text fw="600" size="sm" ff="monospace">
                            {grant.file_id}
                        </Text>
                    </Group>
                </Paper>
            </Stack>
        </Group>
    ) : (
        <Center p="xl" w="100%">
            <Group gap="sm">
                <Loader size="sm" color="gray" />
                <Text
                    size="lg"
                    fw={600}
                    style={{ transform: "translate(0, -1px)" }}
                >
                    {t("views.invites.item.grant.attachment.loading")}
                </Text>
            </Group>
        </Center>
    );
}
