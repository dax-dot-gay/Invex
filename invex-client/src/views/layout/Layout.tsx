import {
    ActionIcon,
    AppShell,
    Button,
    Group,
    Stack,
    Text,
    Title,
} from "@mantine/core";
import {
    IconArchiveFilled,
    IconLogin2,
    IconLogout,
    IconMailCog,
    IconShieldCog,
} from "@tabler/icons-react";
import { useMobile } from "../../util/hooks";
import { useTranslation } from "react-i18next";
import { useHover } from "@mantine/hooks";
import { randomBytes } from "../../util/funcs";
import { useMemo } from "react";
import { Outlet } from "react-router-dom";
import { useUser } from "../../context/net";

function UserActionButton() {
    const user = useUser();
    const { t } = useTranslation();

    if (user) {
        switch (user.type) {
            case "Admin":
                return (
                    <Group gap="xs">
                        <Button leftSection={<IconShieldCog size={20} />}>
                            {t("views.layout.action.admin")}
                        </Button>
                        <ActionIcon size={36} variant="light">
                            <IconLogout size={20} />
                        </ActionIcon>
                    </Group>
                );
            case "User":
                return (
                    <Group gap="xs">
                        <Button leftSection={<IconMailCog size={20} />}>
                            {t("views.layout.action.user")}
                        </Button>
                        <ActionIcon size={36} variant="light">
                            <IconLogout size={20} />
                        </ActionIcon>
                    </Group>
                );
            case "Ephemeral":
                return (
                    <Button leftSection={<IconLogin2 size={20} />}>
                        {t("views.layout.action.login")}
                    </Button>
                );
        }
    } else {
        return (
            <Button leftSection={<IconLogin2 size={20} />}>
                {t("views.layout.action.login")}
            </Button>
        );
    }
}

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
                    <UserActionButton />
                </Group>
            </AppShell.Header>
            <AppShell.Main className="app-layout-component content">
                <Outlet />
            </AppShell.Main>
        </AppShell>
    );
}
