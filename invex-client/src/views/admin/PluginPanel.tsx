import { useTranslation } from "react-i18next";
import { PluginsMixin, useApi } from "../../context/net";
import {
    ActionIcon,
    Anchor,
    Button,
    Chip,
    Divider,
    Group,
    Paper,
    SegmentedControl,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title,
    Tooltip,
} from "@mantine/core";
import {
    IconAssemblyFilled,
    IconBoltFilled,
    IconCloudUp,
    IconFolderCode,
    IconLink,
    IconPuzzle,
    IconTrashFilled,
    IconUpload,
    IconUserEdit,
    IconWorldCode,
} from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import { ModalTitle } from "../../modals";
import { useNotifications } from "../../util/notifications";
import {
    MutableRefObject,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { Plugin } from "../../types/plugin";
import { DynamicAvatar } from "../../components/icon";
import { useDebouncedValue } from "@mantine/hooks";

function PluginItem({
    plugin,
    refresh,
}: {
    plugin: Plugin;
    refresh: () => void;
}) {
    const { t } = useTranslation();
    const selfRef: MutableRefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement>() as any;
    const api = useApi(PluginsMixin);
    const [enabled, setEnabled] = useState(plugin.enabled);
    const [debouncedEnabled] = useDebouncedValue(enabled, 250, {
        leading: true,
    });

    useEffect(() => {
        if (debouncedEnabled != plugin.enabled) {
            if (debouncedEnabled) {
                api.enable_plugin(plugin.id).then(refresh);
            } else {
                api.disable_plugin(plugin.id).then(refresh);
            }
        }
    }, [debouncedEnabled]);

    return (
        <Paper
            className="paper-light plugin-item"
            p="sm"
            shadow="sm"
            ref={selfRef}
        >
            <Group
                gap="md"
                justify="space-between"
                wrap="nowrap"
                align="start"
                pos="relative"
            >
                <Stack gap="sm" style={{ flexGrow: 1 }}>
                    <Group gap="sm" justify="space-between">
                        <Group gap="sm">
                            <DynamicAvatar
                                source={
                                    (plugin.metadata.icon as any) ??
                                    "icon:IconPuzzle"
                                }
                                fallback={IconPuzzle}
                                size={28}
                            />
                            <Stack gap={0}>
                                <Text fw="600">{plugin.metadata.name}</Text>
                                <Text c="dimmed" size="xs">
                                    {plugin.metadata.id} - v
                                    {plugin.metadata.version}
                                </Text>
                            </Stack>
                        </Group>
                    </Group>
                    <Paper bg="var(--mantine-color-default)" p="xs">
                        {plugin.metadata.description ? (
                            <Text>{plugin.metadata.description}</Text>
                        ) : (
                            <Text c="dimmed">
                                {t("views.admin.plugins.noDesc")}
                            </Text>
                        )}
                    </Paper>
                    <Group gap="sm" grow>
                        <Group gap="xs">
                            <ThemeIcon variant="transparent">
                                <IconUserEdit size={20} />
                            </ThemeIcon>
                            {plugin.metadata.author ? (
                                <Text>{plugin.metadata.author}</Text>
                            ) : (
                                <Text c="dimmed" fs="italic">
                                    {t("views.admin.plugins.noAuthor")}
                                </Text>
                            )}
                        </Group>
                        <Group gap="xs">
                            <ThemeIcon variant="transparent">
                                <IconLink size={20} />
                            </ThemeIcon>
                            {plugin.metadata.url ? (
                                <Anchor
                                    href={plugin.metadata.url}
                                    target="_blank"
                                >
                                    {new URL(plugin.metadata.url).origin}
                                </Anchor>
                            ) : (
                                <Text c="dimmed" fs="italic">
                                    {t("views.admin.plugins.noUrl")}
                                </Text>
                            )}
                        </Group>
                    </Group>
                    <Group gap="sm" wrap="nowrap">
                        <ThemeIcon variant="transparent">
                            <IconAssemblyFilled size={20} />
                        </ThemeIcon>
                        <Group gap={4}>
                            <Chip
                                checked={
                                    plugin.metadata.capabilities.filter(
                                        (v) => v.type === "grant"
                                    ).length > 0
                                }
                            >
                                {t("views.admin.plugins.capability.grant")}
                            </Chip>
                            <Chip
                                checked={
                                    plugin.metadata.capabilities.filter(
                                        (v) => v.type === "revoke"
                                    ).length > 0
                                }
                            >
                                {t("views.admin.plugins.capability.revoke")}
                            </Chip>
                            <Chip
                                checked={
                                    plugin.metadata.capabilities.filter(
                                        (v) => v.type === "action"
                                    ).length > 0
                                }
                            >
                                {(() => {
                                    const actions =
                                        plugin.metadata.capabilities.filter(
                                            (v) => v.type === "action"
                                        ).length;
                                    return actions
                                        ? t(
                                              "views.admin.plugins.capability.action.count",
                                              {
                                                  actionCount:
                                                      actions.toString(),
                                              }
                                          )
                                        : t(
                                              "views.admin.plugins.capability.action.countNone"
                                          );
                                })()}
                            </Chip>
                        </Group>
                    </Group>
                    <Group gap="sm" wrap="nowrap">
                        <ThemeIcon variant="transparent">
                            <IconBoltFilled size={20} />
                        </ThemeIcon>
                        <SegmentedControl
                            value={enabled ? "on" : "off"}
                            onChange={(v) => setEnabled(v === "on")}
                            style={{ flexGrow: 1 }}
                            color="primary"
                            bg="var(--mantine-color-default)"
                            data={[
                                {
                                    value: "on",
                                    label: t(
                                        "views.admin.plugins.item.state.on"
                                    ),
                                },
                                {
                                    value: "off",
                                    label: t(
                                        "views.admin.plugins.item.state.off"
                                    ),
                                },
                            ]}
                        />
                    </Group>
                </Stack>
                <Divider orientation="vertical" />
                <Stack
                    gap="sm"
                    justify="space-between"
                    style={{ alignSelf: "stretch" }}
                >
                    <Stack gap="sm">
                        <Tooltip
                            label={t("views.admin.plugins.item.delete")}
                            position="left"
                            withArrow
                            color="var(--mantine-color-body)"
                        >
                            <ActionIcon
                                variant="light"
                                size="lg"
                                radius="xl"
                                onClick={() => {
                                    if (selfRef.current) {
                                        selfRef.current.hidden = true;
                                    }
                                    api.delete_plugin(plugin.id).then(refresh);
                                }}
                            >
                                <IconTrashFilled size={20} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip
                            label={t("views.admin.plugins.item.update")}
                            position="left"
                            withArrow
                            color="var(--mantine-color-body)"
                        >
                            <ActionIcon variant="light" size="lg" radius="xl">
                                <IconCloudUp size={20} />
                            </ActionIcon>
                        </Tooltip>
                    </Stack>
                    {plugin.url ? (
                        <Tooltip
                            label={t("views.admin.plugins.item.origin.web")}
                            position="left"
                            withArrow
                            color="var(--mantine-color-body)"
                        >
                            <ThemeIcon
                                variant="transparent"
                                size="lg"
                                color="primary.2"
                            >
                                <IconWorldCode size={20} />
                            </ThemeIcon>
                        </Tooltip>
                    ) : (
                        <Tooltip
                            label={t("views.admin.plugins.item.origin.upload")}
                            position="left"
                            withArrow
                            color="var(--mantine-color-body)"
                        >
                            <ThemeIcon
                                variant="transparent"
                                size="lg"
                                color="primary.2"
                            >
                                <IconFolderCode size={20} />
                            </ThemeIcon>
                        </Tooltip>
                    )}
                </Stack>
            </Group>
        </Paper>
    );
}

export function PluginPanel() {
    const api = useApi(PluginsMixin);
    const { success, error } = useNotifications();
    const { t } = useTranslation();
    const [plugins, setPlugins] = useState<Plugin[]>([]);

    const refresh = useCallback(() => {
        api.list_plugins().then((r) => {
            setPlugins(r.or_default([]));
        });
    }, [setPlugins, api.list_plugins]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return (
        <Paper withBorder radius="sm" className="admin-panel plugins">
            <Stack gap={0}>
                <Group gap="sm" justify="space-between" p="sm">
                    <Group gap="sm">
                        <IconPuzzle size={28} />
                        <Title order={3} fw={400}>
                            {t("views.admin.plugins.header")}
                        </Title>
                    </Group>
                    <Button
                        size="md"
                        leftSection={<IconUpload size={20} />}
                        onClick={() =>
                            modals.openContextModal({
                                modal: "addPlugin",
                                title: (
                                    <ModalTitle
                                        icon={IconUpload}
                                        name={t("modals.addPlugin.title")}
                                    />
                                ),
                                innerProps: {
                                    onSubmitFile: async function (
                                        file: File
                                    ): Promise<void> {
                                        const response =
                                            await api.add_plugin_from_file(
                                                file
                                            );
                                        response
                                            .and_then((data) => {
                                                success(
                                                    t(
                                                        "views.admin.plugins.feedback.uploadSuccess",
                                                        {
                                                            name: data.metadata
                                                                .name,
                                                        }
                                                    )
                                                );
                                                refresh();
                                            })
                                            .or_else((_, reason) =>
                                                error(
                                                    t(
                                                        "views.admin.plugins.feedback.uploadError",
                                                        {
                                                            reason:
                                                                reason ??
                                                                "Unknown Error",
                                                        }
                                                    )
                                                )
                                            );
                                    },
                                    onSubmitUrl: async function (
                                        url: string
                                    ): Promise<void> {
                                        const response =
                                            await api.add_plugin_from_url(url);
                                        response
                                            .and_then((data) => {
                                                success(
                                                    t(
                                                        "views.admin.plugins.feedback.uploadSuccess",
                                                        {
                                                            name: data.metadata
                                                                .name,
                                                        }
                                                    )
                                                );
                                                refresh();
                                            })
                                            .or_else((_, reason) =>
                                                error(
                                                    t(
                                                        "views.admin.plugins.feedback.uploadError",
                                                        {
                                                            reason:
                                                                reason ??
                                                                "Unknown Error",
                                                        }
                                                    )
                                                )
                                            );
                                    },
                                },
                                size: "lg",
                            })
                        }
                    >
                        {t("views.admin.plugins.upload")}
                    </Button>
                </Group>
                <Divider />
                <SimpleGrid
                    spacing="sm"
                    verticalSpacing="sm"
                    p="sm"
                    className="plugin-list"
                    cols={{ base: 1, md: 2, xl: 3 }}
                >
                    {plugins.map((v) => (
                        <PluginItem plugin={v} key={v.id} refresh={refresh} />
                    ))}
                </SimpleGrid>
            </Stack>
        </Paper>
    );
}
