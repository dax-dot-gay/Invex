import {
    ActionIcon,
    AppShell,
    Box,
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
import { Outlet, useNavigate } from "react-router-dom";
import { useApi, useUser } from "../../context/net";
import { openContextModal } from "@mantine/modals";
import { AuthMixin } from "../../context/net/methods/auth";
import { ModalTitle } from "../../modals";

function UserActionButton() {
    const user = useUser();
    const { t } = useTranslation();
    const api = useApi(AuthMixin);
    const nav = useNavigate();

    if (user) {
        switch (user.kind) {
            case "admin":
                return (
                    <Group gap="xs">
                        <Button
                            leftSection={<IconShieldCog size={20} />}
                            onClick={() => nav("/admin")}
                        >
                            {t("views.layout.action.admin")}
                        </Button>
                        <ActionIcon
                            size={36}
                            variant="light"
                            onClick={() => api.logout()}
                        >
                            <IconLogout size={20} />
                        </ActionIcon>
                    </Group>
                );
            case "user":
                return (
                    <Group gap="xs">
                        <Button
                            leftSection={<IconMailCog size={20} />}
                            onClick={() => nav("/invites")}
                        >
                            {t("views.layout.action.user")}
                        </Button>
                        <ActionIcon
                            size={36}
                            variant="light"
                            onClick={() => api.logout()}
                        >
                            <IconLogout size={20} />
                        </ActionIcon>
                    </Group>
                );
        }
    } else {
        return (
            <Button
                leftSection={<IconLogin2 size={20} />}
                onClick={() =>
                    openContextModal({
                        modal: "login",
                        title: (
                            <ModalTitle
                                icon={IconLogin2}
                                name={t("modals.login.title")}
                            />
                        ),
                        innerProps: {},
                    })
                }
            >
                {t("views.layout.action.login")}
            </Button>
        );
    }
}

export function Layout() {
    const mobile = useMobile();
    const { hovered, ref } = useHover();
    const rng = useMemo(() => "invex/" + randomBytes(8), [hovered]);
    const { t } = useTranslation();

    return (
        <AppShell
            header={{ height: mobile ? 48 : 60 }}
            className="app-layout"
            padding={0}
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
                <Box className="app-container">
                    <Outlet />
                </Box>
            </AppShell.Main>
        </AppShell>
    );
}
