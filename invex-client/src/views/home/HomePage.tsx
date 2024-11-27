import { Group, Paper, Stack, Text, TextInput, Title } from "@mantine/core";
import { IconArchiveFilled, IconLinkPlus } from "@tabler/icons-react";
import { useCustomization } from "../../context/net";
import { useTranslation } from "react-i18next";

export function HomePage() {
    const customization = useCustomization();
    const { t } = useTranslation();
    return (
        <Paper className="paper-light home-main" p="sm" radius="sm">
            <Stack gap="lg">
                <Group gap="sm" justify="space-between" align="center">
                    <IconArchiveFilled size={32} />
                    <Stack gap={0} align="end">
                        <Title order={3} fw={500}>
                            {customization?.server_name ??
                                t("views.home.defaultTitle")}
                        </Title>
                        {customization?.server_welcome && (
                            <Text size="sm" c="dimmed">
                                {customization.server_welcome}
                            </Text>
                        )}
                    </Stack>
                </Group>
                <TextInput
                    size="xl"
                    placeholder={t("views.home.input")}
                    leftSection={<IconLinkPlus size={28} />}
                    variant="filled"
                />
            </Stack>
        </Paper>
    );
}
