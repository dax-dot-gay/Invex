import {
    ActionIcon,
    Anchor,
    Badge,
    Box,
    Center,
    Divider,
    Group,
    Loader,
    Paper,
    Stack,
    Text,
} from "@mantine/core";
import { ClientResourcePluginGrant } from "../../../../types/client";
import { PluginGIProps } from "../types";
import { ReactNode, useEffect, useState } from "react";
import {
    GrantResource_Account,
    GrantResource_Action,
    GrantResource_File,
    GrantResource_Url,
} from "../../../../types/plugin";
import { useTranslation } from "react-i18next";
import {
    IconAt,
    IconDownload,
    IconExternalLink,
    IconFile,
    IconFileCode2,
    IconFileDownload,
    IconFilePencil,
    IconId,
    IconLink,
    IconLock,
    IconScript,
    IconUser,
} from "@tabler/icons-react";
import { FilesMixin, useApi } from "../../../../context/net";
import { FileInfo } from "../../../../types/files";
import { extension } from "mime-types";
import { downloadURL } from "../../../../util/funcs";
import { FileIcon } from "../../../../components/fileIcon";

function InfoLine({
    icon,
    label,
    value,
}: {
    icon: JSX.Element;
    label: string;
    value: string | null;
}) {
    const { t } = useTranslation();
    return (
        <Paper p={0} radius="xl" className="paper-light">
            <Group gap="sm" justify="space-between" pr="sm">
                <Badge variant="light" size="xl" color="gray">
                    <Group gap="xs">
                        {icon}
                        {label}
                    </Group>
                </Badge>
                {value ? (
                    <Text ff="monospace" fw={600} size="sm">
                        {value}
                    </Text>
                ) : (
                    <Text c="dimmed" ff="monospace" fw={600} size="sm">
                        {t("views.invites.item.grant.plugin.unset")}
                    </Text>
                )}
            </Group>
        </Paper>
    );
}

function Resource({
    icon,
    label,
    children,
}: {
    icon: JSX.Element;
    label: string;
    children?: ReactNode | ReactNode[];
}) {
    return (
        <Paper bg="var(--mantine-color-default)">
            <Stack gap={0}>
                <Group gap="sm" p="sm">
                    {icon}
                    <Text size="lg" fw="600">
                        {label}
                    </Text>
                </Group>
                <Divider />
                <Box p="sm">{children}</Box>
            </Stack>
        </Paper>
    );
}

function AccountResource({
    resource,
}: { resource: GrantResource_Account } & PluginGIProps) {
    const { t } = useTranslation();
    return (
        <Resource
            icon={<IconUser />}
            label={t("views.invites.item.grant.plugin.account.label")}
        >
            <Stack gap="sm">
                <InfoLine
                    icon={<IconId size={20} />}
                    label={t("views.invites.item.grant.plugin.account.id")}
                    value={resource.user_id}
                />
                <InfoLine
                    icon={<IconUser size={20} />}
                    label={t(
                        "views.invites.item.grant.plugin.account.username"
                    )}
                    value={resource.username}
                />
                <InfoLine
                    icon={<IconAt size={20} />}
                    label={t("views.invites.item.grant.plugin.account.email")}
                    value={resource.email}
                />
                <InfoLine
                    icon={<IconLock size={20} />}
                    label={t(
                        "views.invites.item.grant.plugin.account.password"
                    )}
                    value={(resource.password
                        ? t("common.words.locked")
                        : t("common.words.unlocked")
                    ).toUpperCase()}
                />
            </Stack>
        </Resource>
    );
}

function FileResource({
    resource,
    ...props
}: { resource: GrantResource_File } & PluginGIProps) {
    const api = useApi(FilesMixin);
    const [metadata, setMetadata] = useState<FileInfo | null>(null);
    const { t } = useTranslation();

    useEffect(() => {
        api.get_file_info(resource.file_id).then(setMetadata);
    }, [resource.file_id, api.get_file_info, setMetadata]);

    return (
        <Resource
            icon={<IconFile />}
            label={t("views.invites.item.grant.plugin.file.label")}
        >
            {metadata ? (
                <Group p="sm" gap="sm" wrap="nowrap">
                    <Paper
                        h={192}
                        w={192}
                        style={{ overflow: "hidden", position: "relative" }}
                        className="paper-light"
                        withBorder
                    >
                        {resource.content_type &&
                        resource.content_type.startsWith("image/") ? (
                            <img
                                src={`${location.origin}/api/files/${resource.file_id}`}
                                height={192}
                                width={192}
                            />
                        ) : (
                            <Center h="100%">
                                <FileIcon
                                    size={32}
                                    mime={metadata.content_type}
                                />
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
                                    `${location.origin}/api/files/${resource.file_id}`,
                                    metadata.original_filename
                                        ? metadata.original_filename.includes(
                                              "."
                                          )
                                            ? metadata.original_filename
                                            : metadata.original_filename +
                                              "." +
                                              (extension(
                                                  metadata.content_type
                                              ) ?? "bin")
                                        : resource.file_id +
                                              "." +
                                              (extension(
                                                  metadata.content_type
                                              ) ?? "bin")
                                )
                            }
                        >
                            <IconDownload size={20} />
                        </ActionIcon>
                    </Paper>
                    <Stack
                        gap="sm"
                        justify="start"
                        h="192px"
                        w="calc(100% - 204px)"
                    >
                        <InfoLine
                            icon={<IconFilePencil size={20} />}
                            label={t(
                                "views.invites.item.grant.plugin.file.filename"
                            )}
                            value={metadata.original_filename}
                        />
                        <InfoLine
                            icon={<IconFileCode2 size={20} />}
                            label={t(
                                "views.invites.item.grant.plugin.file.contentType"
                            )}
                            value={metadata.content_type}
                        />
                        <InfoLine
                            icon={<IconFileDownload size={20} />}
                            label={t(
                                "views.invites.item.grant.plugin.file.fileId"
                            )}
                            value={resource.file_id}
                        />
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
            )}
        </Resource>
    );
}

function URLResource({
    resource,
    ...props
}: { resource: GrantResource_Url } & PluginGIProps) {
    const { t } = useTranslation();
    return (
        <Resource
            icon={<IconLink />}
            label={t("views.invites.item.grant.plugin.url.label")}
        >
            <Paper
                className="paper-light"
                p="xs"
                px="md"
                style={{ flexGrow: 1 }}
            >
                <Group gap="sm" justify="space-between" wrap="nowrap">
                    <Stack gap={0}>
                        {resource.label || resource.alias ? (
                            <Text
                                style={{
                                    userSelect: "none",
                                    pointerEvents: "none",
                                }}
                                ff="monospace"
                                opacity={0.8}
                            >
                                {resource.label ?? resource.alias}
                            </Text>
                        ) : (
                            <></>
                        )}
                        <Anchor
                            size="lg"
                            ff="monospace"
                            href={resource.url}
                            target="_blank"
                        >
                            {resource.url}
                        </Anchor>
                    </Stack>
                    <ActionIcon
                        size="xl"
                        variant="light"
                        color="gray"
                        onClick={() => window.open(resource.url, "_blank")}
                    >
                        <IconExternalLink />
                    </ActionIcon>
                </Group>
            </Paper>
        </Resource>
    );
}

function ActionResource({
    resource,
    ...props
}: { resource: GrantResource_Action } & PluginGIProps) {
    const { t } = useTranslation();
    return (
        <Resource
            icon={<IconScript />}
            label={t("views.invites.item.grant.plugin.action.label")}
        ></Resource>
    );
}

export function PluginItem(props: PluginGIProps) {
    const result = props.grant.result as Extract<
        ClientResourcePluginGrant,
        { type: "success" }
    >;

    return (
        <Stack gap="sm" p="sm">
            {result.resources.map((resource) => {
                switch (resource.type) {
                    case "account":
                        return (
                            <AccountResource
                                resource={resource}
                                {...props}
                                key={resource.id}
                            />
                        );
                    case "action":
                        return (
                            <ActionResource
                                resource={resource}
                                {...props}
                                key={resource.id}
                            />
                        );
                    case "file":
                        return (
                            <FileResource
                                resource={resource}
                                {...props}
                                key={resource.id}
                            />
                        );
                    case "url":
                        return (
                            <URLResource
                                resource={resource}
                                {...props}
                                key={resource.id}
                            />
                        );
                }
            })}
        </Stack>
    );
}
