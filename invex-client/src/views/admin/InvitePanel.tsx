import { Button, Divider, Group, Paper, Stack, Title } from "@mantine/core";
import { IconLink, IconLinkPlus } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

export function InvitePanel() {
    const { t } = useTranslation();
    return (
        <Paper withBorder p={0} className="admin-panel invites">
            <Stack gap={0} h="100%">
                <Group gap="sm" p="sm" justify="space-between">
                    <Group gap="sm">
                        <IconLink size={28} />
                        <Title order={3} fw={400}>
                            {t("views.admin.invites.header")}
                        </Title>
                    </Group>
                    <Button size="md" leftSection={<IconLinkPlus size={20} />}>
                        {t("views.admin.invites.create")}
                    </Button>
                </Group>
                <Divider />
            </Stack>
        </Paper>
    );
}
