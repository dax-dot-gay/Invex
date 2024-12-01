import { useTranslation } from "react-i18next";
import { PluginsMixin, useApi } from "../../context/net";
import { Button, Divider, Group, Paper, Stack, Title } from "@mantine/core";
import { IconPuzzle, IconUpload } from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import { ModalTitle } from "../../modals";

export function PluginPanel() {
    const api = useApi(PluginsMixin);
    const { t } = useTranslation();
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
                                    onSubmitFile: function (file: File): void {
                                        throw new Error(
                                            "Function not implemented."
                                        );
                                    },
                                    onSubmitUrl: function (url: string): void {
                                        throw new Error(
                                            "Function not implemented."
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
            </Stack>
        </Paper>
    );
}
