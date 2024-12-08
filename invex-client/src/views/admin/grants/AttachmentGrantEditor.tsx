import {
    AspectRatio,
    Divider,
    Group,
    Loader,
    Paper,
    Stack,
    Text,
} from "@mantine/core";
import { Service, ServiceGrant } from "../../../types/service";
import { useTranslation } from "react-i18next";
import { FilesMixin, ServiceMixin, useApi } from "../../../context/net";
import { useCallback, useEffect, useState } from "react";
import { FileInfo } from "../../../types/files";
import { FileIcon } from "../../../components/fileIcon";
import { IconFile, IconId, IconLabel } from "@tabler/icons-react";

export function AttachmentGrantEditor({
    id,
    service,
    grant,
    save,
}: {
    id: string;
    service: Service;
    grant: Extract<ServiceGrant, { type: "attachment" }>;
    save: (grant: ServiceGrant) => Promise<void>;
}) {
    const { t } = useTranslation();
    const api = useApi(ServiceMixin, FilesMixin);
    const [metadata, setMetadata] = useState<FileInfo | null>(null);
    const refreshSelf = useCallback(() => {
        api.get_file_info(grant.file_id).then(setMetadata);
    }, [id, grant.display_name, grant.file_id, grant.help, grant.preview]);

    useEffect(() => {
        refreshSelf();
    }, [refreshSelf]);

    return metadata ? (
        <Stack gap="sm">
            <Group gap="sm" wrap="nowrap" align="stretch">
                <Paper
                    className="paper-light"
                    p={0}
                    style={{ overflow: "hidden" }}
                    shadow="sm"
                >
                    <AspectRatio ratio={1} maw={200} mah={200} mx="auto">
                        {grant.preview &&
                        metadata.content_type.startsWith("image/") ? (
                            <img
                                src={`${location.origin}/api/files/${grant.file_id}`}
                            />
                        ) : (
                            <Stack
                                w="200"
                                h="200"
                                justify="center"
                                align="center"
                            >
                                <FileIcon
                                    mime={metadata.content_type}
                                    size={64}
                                />
                                <Text c="dimmed" size="lg">
                                    {metadata.content_type}
                                </Text>
                            </Stack>
                        )}
                    </AspectRatio>
                </Paper>
                <Paper
                    mih="100%"
                    p="md"
                    style={{ flexGrow: 1 }}
                    className="paper-light"
                >
                    <Stack gap="sm">
                        <Group gap="sm" wrap="nowrap">
                            <FileIcon size="32" mime={metadata.content_type} />
                            <Text size="lg" fw={600}>
                                {grant.display_name}
                            </Text>
                        </Group>
                        <Divider />
                        <Group gap="sm" wrap="nowrap">
                            <IconId size={28} />
                            <Text
                                lineClamp={1}
                                style={{ whiteSpace: "nowrap" }}
                            >
                                {metadata.id}
                            </Text>
                        </Group>
                        <Group gap="sm" wrap="nowrap">
                            <IconFile size={28} />
                            <Text>{metadata.content_type}</Text>
                        </Group>
                        <Group gap="sm" wrap="nowrap">
                            <IconLabel size={28} />
                            <Text>
                                {metadata.original_filename ??
                                    grant.display_name}
                            </Text>
                        </Group>
                    </Stack>
                </Paper>
            </Group>
        </Stack>
    ) : (
        <Stack align="center" justify="center" p="xl">
            <Loader />
        </Stack>
    );
}
