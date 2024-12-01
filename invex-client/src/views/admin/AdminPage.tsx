import { useNavigate, useSearchParams } from "react-router-dom";
import { useNetAccessible, useUser } from "../../context/net";
import { useEffect, useState } from "react";
import { Group, Tabs, Text } from "@mantine/core";
import {
    IconLink,
    IconPuzzle,
    IconServer,
    IconUser,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { UserPanel } from "./UserPanel";
import { PluginPanel } from "./PluginPanel";

type TabType = "users" | "services" | "invites" | "plugins";

export function AdminPage() {
    const nav = useNavigate();
    const user = useUser();
    const accessible = useNetAccessible();
    const [tab, setTab] = useState<TabType>("users");
    const { t } = useTranslation();
    const [params, setParams] = useSearchParams(
        new URLSearchParams({ tab: "users" })
    );

    useEffect(() => {
        if (params.has("tab") && params.get("tab") !== tab) {
            setTab(params.get("tab") as TabType);
        }
    }, [params, setTab]);

    useEffect(() => {
        if (user?.kind !== "admin" && accessible) {
            nav("/");
        }
    }, [user?.id, user?.kind, accessible]);

    return (
        <Tabs
            value={tab}
            onChange={(v) => {
                setTab(v ? (v as TabType) : "users");
                setParams(
                    new URLSearchParams({ tab: v ? (v as TabType) : "users" })
                );
            }}
            variant="outline"
            className="admin-tabs"
        >
            <Tabs.List pt="sm" px="sm">
                <Tabs.Tab value="users">
                    <Group gap="xs">
                        <IconUser size={20} />
                        <Text fw={600}>{t("views.admin.users.title")}</Text>
                    </Group>
                </Tabs.Tab>
                <Tabs.Tab value="invites">
                    <Group gap="xs">
                        <IconLink size={20} />
                        <Text fw={600}>{t("views.admin.invites.title")}</Text>
                    </Group>
                </Tabs.Tab>
                <Tabs.Tab value="services">
                    <Group gap="xs">
                        <IconServer size={20} />
                        <Text fw={600}>{t("views.admin.services.title")}</Text>
                    </Group>
                </Tabs.Tab>
                <Tabs.Tab value="plugins">
                    <Group gap="xs">
                        <IconPuzzle size={20} />
                        <Text fw={600}>{t("views.admin.plugins.title")}</Text>
                    </Group>
                </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="users" p="sm" className="admin-tab users">
                <UserPanel />
            </Tabs.Panel>
            <Tabs.Panel value="invites" p="sm" className="admin-tab invites">
                Invites
            </Tabs.Panel>
            <Tabs.Panel value="services" p="sm" className="admin-tab services">
                Services
            </Tabs.Panel>
            <Tabs.Panel value="plugins" p="sm" className="admin-tab plugins">
                <PluginPanel />
            </Tabs.Panel>
        </Tabs>
    );
}
