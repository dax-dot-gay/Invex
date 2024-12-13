import { ContextModalProps } from "@mantine/modals";
import {
    FieldValue,
    Plugin,
    PluginConfig,
    ValidatedForm,
} from "../types/plugin";
import { Carousel } from "@mantine/carousel";
import { PluginsMixin, useApi } from "../context/net";
import { useAsynchronous } from "../util/hooks";
import { Divider, Group, Paper, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { IconPencil, IconSettingsPlus } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { IconPicker } from "../components/iconPicker";
import { AvatarSource } from "../components/icon";

function ProfileItem({
    id,
    config,
    validated,
    plugin,
}: {
    id: string;
    config: PluginConfig;
    validated: ValidatedForm;
    plugin: Plugin;
}) {
    return <Paper className="profile-item paper-light" p="sm"></Paper>;
}

export function PluginProfilesModal({
    context,
    id,
    innerProps: { plugin },
}: ContextModalProps<{ plugin: Plugin }>) {
    const { t } = useTranslation();
    const api = useApi(PluginsMixin);
    const configs: { [key: string]: [PluginConfig, ValidatedForm] } =
        useAsynchronous(api.plugin_config_list_validated, [plugin.id], {}) ??
        {};

    const creationForm = useForm<{
        icon: AvatarSource | null;
        name: string;
        options: { [key: string]: FieldValue | null };
    }>({
        initialValues: {
            icon: null,
            name: "",
            options: {},
        },
    });
    const [creating, setCreating] = useState(false);

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
        >
            {Object.entries(configs).map(([id, [config, validated]]) => (
                <Carousel.Slide>
                    {" "}
                    <ProfileItem
                        key={id}
                        id={id}
                        plugin={plugin}
                        config={config}
                        validated={validated}
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
                                console.log(values);
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
