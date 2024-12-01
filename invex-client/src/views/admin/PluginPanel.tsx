import { useTranslation } from "react-i18next";
import { PluginsMixin, useApi } from "../../context/net";
import {
    ActionIcon,
    Anchor,
    Button,
    Divider,
    Group,
    Paper,
    Pill,
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
import { isString } from "lodash";
import {
    MutableRefObject,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { Plugin } from "../../types/plugin";
import { DynamicAvatar, DynamicIcon } from "../../components/icon";
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
                api.enable_plugin(plugin._id).then(refresh);
            } else {
                api.disable_plugin(plugin._id).then(refresh);
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
                                    (plugin.info.metadata.icon as any) ??
                                    "icon:IconPuzzle"
                                }
                                fallback={IconPuzzle}
                                size={28}
                            />
                            <Stack gap={0}>
                                <Text fw="600">
                                    {plugin.info.metadata.name}
                                </Text>
                                <Text c="dimmed" size="xs">
                                    {plugin.info.metadata.id} - v
                                    {plugin.info.metadata.version}
                                </Text>
                            </Stack>
                        </Group>
                    </Group>
                    <Paper bg="var(--mantine-color-default)" p="xs">
                        {plugin.info.metadata.description ? (
                            <Text>{plugin.info.metadata.description}</Text>
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
                            {plugin.info.metadata.author ? (
                                <Text>{plugin.info.metadata.author}</Text>
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
                            {plugin.info.metadata.url ? (
                                <Anchor
                                    href={plugin.info.metadata.url}
                                    target="_blank"
                                >
                                    {new URL(plugin.info.metadata.url).origin}
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
                            {plugin.info.metadata.capabilities.map((v) => (
                                <Pill bg="gray.8" key={v}>
                                    {t(`views.admin.plugins.capability.${v}`)}
                                </Pill>
                            ))}
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
                                    api.delete_plugin(plugin._id).then(refresh);
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
            if (r.success) {
                setPlugins(r.data);
            } else {
                setPlugins([]);
            }
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
                                        if (response.success) {
                                            success(
                                                t(
                                                    "views.admin.plugins.feedback.uploadSuccess",
                                                    {
                                                        name: response.data.info
                                                            .metadata.name,
                                                    }
                                                )
                                            );
                                            refresh();
                                        } else {
                                            error(
                                                t(
                                                    "views.admin.plugins.feedback.uploadError",
                                                    {
                                                        reason: response.response
                                                            ? isString(response)
                                                                ? response.response
                                                                : (
                                                                      response
                                                                          .response
                                                                          .data as any
                                                                  )
                                                                      .description ??
                                                                  "Unknown Error"
                                                            : "Unknown Error",
                                                    }
                                                )
                                            );
                                        }
                                    },
                                    onSubmitUrl: async function (
                                        url: string
                                    ): Promise<void> {
                                        const response =
                                            await api.add_plugin_from_url(url);
                                        if (response.success) {
                                            success(
                                                t(
                                                    "views.admin.plugins.feedback.uploadSuccess",
                                                    {
                                                        name: response.data.info
                                                            .metadata.name,
                                                    }
                                                )
                                            );
                                            refresh();
                                        } else {
                                            error(
                                                t(
                                                    "views.admin.plugins.feedback.uploadError",
                                                    {
                                                        reason: response.response
                                                            ? isString(response)
                                                                ? response.response
                                                                : (
                                                                      response
                                                                          .response
                                                                          .data as any
                                                                  )
                                                                      .description ??
                                                                  "Unknown Error"
                                                            : "Unknown Error",
                                                    }
                                                )
                                            );
                                        }
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
                        <PluginItem plugin={v} key={v._id} refresh={refresh} />
                    ))}
                </SimpleGrid>
            </Stack>
        </Paper>
    );
}
