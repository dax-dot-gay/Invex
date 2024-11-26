import { AppShell, Group, Stack, Text, Title } from "@mantine/core";
import { IconArchiveFilled } from "@tabler/icons-react";
import { useMobile } from "../../util/hooks";
import { useTranslation } from "react-i18next";
import { useHover } from "@mantine/hooks";
import { randomBytes } from "../../util/funcs";
import { useMemo } from "react";

export function Layout() {
    const mobile = useMobile();
    const { hovered, ref } = useHover();
    const rng = useMemo(() => "invex/" + randomBytes(4), [hovered]);
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
                    <Group gap="sm" align="center">
                        <IconArchiveFilled size={mobile ? 24 : 32} />
                        <Stack gap={0}>
                            <Title order={4} fw={600}>
                                {t("common.appName")}
                            </Title>
                            {!mobile && (
                                <Text c="dimmed" size="xs">
                                    {hovered ? t("views.layout.desc") : rng}
                                </Text>
                            )}
                        </Stack>
                    </Group>
                </Group>
            </AppShell.Header>
        </AppShell>
    );
}
