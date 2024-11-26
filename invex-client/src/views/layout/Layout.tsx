import { AppShell, Group, Stack, Text, Title } from "@mantine/core";
import { IconArchiveFilled } from "@tabler/icons-react";
import { useMobile } from "../../util/hooks";
import { useTranslation } from "react-i18next";
import { useHover } from "@mantine/hooks";
import { randomBytes } from "../../util/funcs";

export function Layout() {
    const mobile = useMobile();
    const { hovered, ref } = useHover();
    const { t } = useTranslation();
    return (
        <AppShell
            header={{ height: mobile ? 48 : 60 }}
            className="app-layout"
            padding="sm"
        >
            <AppShell.Header
                ref={ref}
                className="app-layout-component header"
                withBorder={false}
            >
                <Group
                    gap="sm"
                    justify="space-between"
                    align="center"
                    h={mobile ? 48 : 60}
                    px="sm"
                >
                    <Group gap="sm" align="start">
                        <IconArchiveFilled size={mobile ? 24 : 32} />
                        <Stack gap={4}>
                            <Title order={3} fw={600}>
                                {t("common.appName")}
                            </Title>
                            <Text c="dimmed" size="sm">
                                {hovered
                                    ? t("views.layout.desc")
                                    : randomBytes(8)}
                            </Text>
                        </Stack>
                    </Group>
                </Group>
            </AppShell.Header>
        </AppShell>
    );
}
