import { ContextModalProps } from "@mantine/modals";
import {
    FieldValue,
    Plugin,
    PluginConfig,
    ValidatedForm,
} from "../types/plugin";
import { Carousel } from "@mantine/carousel";
import { PluginsMixin, useApi } from "../context/net";
import {
    ActionIcon,
    Button,
    Divider,
    Group,
    Paper,
    ScrollAreaAutosize,
    Stack,
    Text,
    TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    IconDeviceFloppy,
    IconPencil,
    IconPlus,
    IconSettingsPlus,
    IconTrashFilled,
    IconX,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { IconPicker } from "../components/iconPicker";
import { AvatarSource } from "../components/icon";
import { PluginFieldForm } from "../components/pluginFields";
import { useNotifications } from "../util/notifications";
import { isEqual } from "lodash";

function ProfileItem({
    id,
    config,
    validated,
    plugin,
    refresh,
}: {
    id: string;
    config: PluginConfig;
    validated: ValidatedForm;
    plugin: Plugin;
    refresh: () => void;
}) {
    const strArgs = JSON.stringify(validated.arguments);
    const initial = useMemo(
        () => ({
            icon: config.icon as any,
            name: config.name,
            options: Object.entries(validated.arguments).reduce(
                (prev, curr) => ({
                    ...prev,
                    [curr[0]]: {
                        value: curr[1].valid ? curr[1].value : curr[1].previous,
                        valid: curr[1].valid,
                    },
                }),
                {}
            ),
        }),
        [config.icon, config.name, strArgs]
    );

    const { t } = useTranslation();
    const api = useApi(PluginsMixin);
    const form = useForm<{
        icon: AvatarSource | null;
        name: string;
        options: {
            [key: string]: { value: FieldValue | null; valid: boolean };
        };
    }>({
        initialValues: initial,
        validate: {
            name: (v) => (v.length > 0 ? null : t("errors.form.empty")),
            options: (v) =>
                Object.values(v).filter((k) => !k.valid).length === 0
                    ? null
                    : t("errors.form.invalid"),
        },
    });
    return (
        <Paper className="profile-item paper-light" p="sm">
            <form
                onSubmit={form.onSubmit((values) => {
                    console.log(values);
                })}
            >
                <Stack gap="sm">
                    <Group gap="sm" wrap="nowrap">
                        <IconPicker
                            value={form.values.icon}
                            onChange={(v) => form.setFieldValue("icon", v)}
                            iconSize={32}
                            size={42}
                            variant="filled"
                            bg="var(--mantine-color-default)"
                            style={{ borderWidth: "0px" }}
                            defaultValue={"icon:IconSettings"}
                        />
                        <TextInput
                            placeholder={t("modals.pluginProfiles.create.name")}
                            leftSection={<IconPencil size={20} />}
                            size="md"
                            style={{ flexGrow: 1 }}
                            {...form.getInputProps("name")}
                        />
                        <ActionIcon
                            variant="light"
                            disabled={isEqual(initial, form.values)}
                            size="42"
                        >
                            <IconDeviceFloppy />
                        </ActionIcon>
                        <ActionIcon
                            variant="light"
                            color="red"
                            size="42"
                            onClick={() => {
                                api.plugin_config_delete(plugin.id, id).then(
                                    () => refresh()
                                );
                            }}
                        >
                            <IconTrashFilled />
                        </ActionIcon>
                    </Group>
                    <Divider />
                    <ScrollAreaAutosize
                        mah="calc(60vh - 128px)"
                        offsetScrollbars
                    >
                        <PluginFieldForm
                            plugin={plugin}
                            value={form.values.options}
                            onChange={(v) => form.setFieldValue("options", v)}
                        />
                    </ScrollAreaAutosize>
                </Stack>
            </form>
        </Paper>
    );
}

export function PluginProfilesModal({
    innerProps: { plugin, getConfigs },
}: ContextModalProps<{
    plugin: Plugin;
    getConfigs: () => Promise<{
        [key: string]: [PluginConfig, ValidatedForm];
    }>;
}>) {
    const { t } = useTranslation();
    const api = useApi(PluginsMixin);
    const [configs, setConfigs] = useState<{
        [key: string]: [PluginConfig, ValidatedForm];
    }>({});

    const refreshConfigs = useCallback(() => {
        getConfigs().then(setConfigs);
    }, [setConfigs, getConfigs]);

    useEffect(() => {
        refreshConfigs();
    }, [refreshConfigs]);

    const creationForm = useForm<{
        icon: AvatarSource | null;
        name: string;
        options: {
            [key: string]: { value: FieldValue | null; valid: boolean };
        };
    }>({
        initialValues: {
            icon: null,
            name: "",
            options: {},
        },
        validate: {
            name: (v) => (v.length > 0 ? null : t("errors.form.empty")),
            options: (v) =>
                Object.values(v).filter((k) => !k.valid).length === 0
                    ? null
                    : t("errors.form.invalid"),
        },
    });
    const [creating, setCreating] = useState(false);
    const { error, success } = useNotifications();

    return (
        <Carousel
            withIndicators
            height="60vh"
            classNames={{
                control: "carousel-control",
                controls: "carousel-controls",
            }}
            className="plugin-profile-carousel"
            loop
            slideGap="sm"
            slidesToScroll={1}
            draggable={false}
        >
            {Object.entries(configs).map(([id, [config, validated]]) => (
                <Carousel.Slide>
                    <ProfileItem
                        key={id}
                        id={id}
                        plugin={plugin}
                        config={config}
                        validated={validated}
                        refresh={refreshConfigs}
                    />
                </Carousel.Slide>
            ))}
            <Carousel.Slide>
                {creating ? (
                    <Paper
                        className="profile-item create open paper-light"
                        p="sm"
                    >
                        <form
                            onSubmit={creationForm.onSubmit((values) => {
                                api.plugin_config_create(
                                    plugin.id,
                                    values.name,
                                    Object.entries(values.options).reduce(
                                        (prev, current) => ({
                                            ...prev,
                                            [current[0]]: current[1].value,
                                        }),
                                        {}
                                    ),
                                    values.icon ?? "icon:IconSettings"
                                ).then((response) =>
                                    response
                                        .and_then(() => {
                                            success(
                                                t(
                                                    "modals.pluginProfiles.create.success"
                                                )
                                            );
                                            refreshConfigs();
                                            setCreating(false);
                                            creationForm.reset();
                                        })
                                        .or_else((_, reason) =>
                                            error(
                                                t(
                                                    "modals.pluginProfiles.create.error",
                                                    { errorReason: reason }
                                                )
                                            )
                                        )
                                );
                            })}
                        >
                            <Stack gap="sm">
                                <Group gap="sm" wrap="nowrap">
                                    <IconPicker
                                        value={creationForm.values.icon}
                                        onChange={(v) =>
                                            creationForm.setFieldValue(
                                                "icon",
                                                v
                                            )
                                        }
                                        iconSize={32}
                                        size={42}
                                        variant="transparent"
                                        style={{ borderWidth: "0px" }}
                                        defaultValue={"icon:IconSettings"}
                                    />
                                    <TextInput
                                        placeholder={t(
                                            "modals.pluginProfiles.create.name"
                                        )}
                                        leftSection={<IconPencil size={20} />}
                                        size="md"
                                        style={{ flexGrow: 1 }}
                                        {...creationForm.getInputProps("name")}
                                    />
                                </Group>
                                <Divider />
                                <ScrollAreaAutosize
                                    mah="calc(60vh - 190px)"
                                    offsetScrollbars
                                >
                                    <PluginFieldForm
                                        plugin={plugin}
                                        value={creationForm.values.options}
                                        onChange={(v) =>
                                            creationForm.setFieldValue(
                                                "options",
                                                v
                                            )
                                        }
                                    />
                                </ScrollAreaAutosize>
                                <Divider />
                                <Group
                                    gap="sm"
                                    justify="space-between"
                                    wrap="nowrap"
                                >
                                    <Button
                                        leftSection={<IconX size={20} />}
                                        variant="light"
                                        onClick={() => {
                                            setCreating(false);
                                            creationForm.reset();
                                        }}
                                    >
                                        {t("actions.cancel")}
                                    </Button>
                                    <Button
                                        leftSection={<IconPlus size={20} />}
                                        type="submit"
                                    >
                                        {t("actions.create")}
                                    </Button>
                                </Group>
                            </Stack>
                        </form>
                    </Paper>
                ) : (
                    <Paper
                        className="profile-item create closed"
                        p="sm"
                        onClick={() => setCreating(true)}
                    >
                        <Stack
                            gap="sm"
                            justify="center"
                            align="center"
                            className="label-stack"
                        >
                            <IconSettingsPlus
                                size={64}
                                opacity={0.5}
                                strokeWidth={1.5}
                            />
                            <Text fw={600} size="xl" opacity={0.5}>
                                {t("modals.pluginProfiles.create.button")}
                            </Text>
                        </Stack>
                    </Paper>
                )}
            </Carousel.Slide>
        </Carousel>
    );
}
