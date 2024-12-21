import {
    ActionIcon,
    Button,
    Divider,
    Group,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
    ThemeIcon,
    Title,
} from "@mantine/core";
import { useApi, UsersMixin, useUser } from "../../context/net";
import { useEffect, useState } from "react";
import { User } from "../../types/auth";
import { useDebouncedValue } from "@mantine/hooks";
import {
    IconSearch,
    IconShieldHalfFilled,
    IconShieldPlus,
    IconTrashFilled,
    IconUser,
    IconUserPlus,
    IconUserShield,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { DataTable } from "mantine-datatable";
import { modals } from "@mantine/modals";
import { ModalTitle } from "../../modals";
import { useRefreshCallback } from "../../context/refresh";

function AdminItem({ user, refresh }: { user: User; refresh: () => void }) {
    const { t } = useTranslation();
    const currentUser = useUser();
    const api = useApi(UsersMixin);
    return (
        <Paper
            className="paper-light admin-item"
            p="sm"
            radius="sm"
            shadow="sm"
        >
            <Group gap="sm" justify="space-between">
                <Group gap="sm">
                    <ThemeIcon variant="filled" size="xl" radius="xl">
                        <IconShieldHalfFilled />
                    </ThemeIcon>
                    <Stack gap={0}>
                        <Text size="lg">{user.username}</Text>
                        <Text size="sm" c="dimmed" fs="italic">
                            {user.email ?? t("views.admin.users.noEmail")}
                        </Text>
                    </Stack>
                </Group>
                {currentUser?.id !== user.id && (
                    <ActionIcon
                        variant="transparent"
                        color="red"
                        radius="xl"
                        size="xl"
                        onClick={() => api.deleteUser(user.id).then(refresh)}
                    >
                        <IconTrashFilled />
                    </ActionIcon>
                )}
            </Group>
        </Paper>
    );
}

export function UserPanel() {
    const api = useApi(UsersMixin);
    const [admins, setAdmins] = useState<User[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [pageSize, setPageSize] = useState(25);
    const [pageNumber, setPageNumber] = useState(0);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const [debouncedSearch] = useDebouncedValue(search, 250);
    const { t } = useTranslation();

    const refresh = useRefreshCallback(() => {
        api.getUsers({ kind: "admin" }).then((v) => setAdmins(v.results));
        api.getUsers({
            kind: "user",
            search: debouncedSearch.length > 0 ? debouncedSearch : undefined,
            page: pageNumber,
            size: pageSize,
        }).then((v) => {
            setTotal(v.total);
            setUsers(v.results);
        });
    }, [
        setAdmins,
        setUsers,
        setTotal,
        api.getUsers,
        pageSize,
        pageNumber,
        debouncedSearch,
    ]);

    useEffect(() => refresh(), [refresh]);

    return (
        <Stack gap="md" className="admin-panel users">
            <Paper radius="sm" withBorder className="admin-list">
                <Stack gap={0}>
                    <Group gap="sm" justify="space-between" p="sm">
                        <Group gap="sm">
                            <IconUserShield size={28} />
                            <Title order={3} fw={400}>
                                {t("views.admin.users.admins.title")}
                            </Title>
                        </Group>
                        <Button
                            variant="filled"
                            leftSection={<IconShieldPlus size={20} />}
                            size="md"
                            onClick={() =>
                                modals.openContextModal({
                                    modal: "createUser",
                                    title: (
                                        <ModalTitle
                                            icon={IconShieldPlus}
                                            name={t(
                                                "modals.createUser.adminTitle"
                                            )}
                                        />
                                    ),
                                    innerProps: { type: "admin", refresh },
                                })
                            }
                        >
                            {t("views.admin.users.admins.add")}
                        </Button>
                    </Group>
                    <Divider />
                    <SimpleGrid
                        p="sm"
                        className="admin-list-items"
                        spacing="sm"
                        verticalSpacing="sm"
                        cols={{ base: 1, sm: 2, lg: 5 }}
                    >
                        {admins.map((v) => (
                            <AdminItem user={v} key={v.id} refresh={refresh} />
                        ))}
                    </SimpleGrid>
                </Stack>
            </Paper>
            <Paper
                radius="sm"
                withBorder
                className="user-list"
                style={{ flexGrow: 1 }}
            >
                <Stack gap={0} h="100%">
                    <Group gap="sm" p="sm">
                        <IconUser size={28} />
                        <Title order={3} fw={400}>
                            {t("views.admin.users.users.title")}
                        </Title>
                        <Divider orientation="vertical" />
                        <TextInput
                            size="md"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            leftSection={<IconSearch />}
                            style={{ flexGrow: 1 }}
                        />
                        <Button
                            variant="filled"
                            leftSection={<IconUserPlus size={20} />}
                            size="md"
                            onClick={() =>
                                modals.openContextModal({
                                    modal: "createUser",
                                    title: (
                                        <ModalTitle
                                            icon={IconUserPlus}
                                            name={t(
                                                "modals.createUser.userTitle"
                                            )}
                                        />
                                    ),
                                    innerProps: { type: "user", refresh },
                                })
                            }
                        >
                            {t("views.admin.users.users.add")}
                        </Button>
                    </Group>
                    <Divider />
                    <DataTable
                        withColumnBorders
                        records={users}
                        style={{ flexGrow: 1 }}
                        columns={[
                            {
                                accessor: "username",
                                title: t(
                                    "views.admin.users.users.table.username"
                                ),
                                width: "45%",
                            },
                            {
                                accessor: "email",
                                title: t("views.admin.users.users.table.email"),
                                width: "45%",
                            },
                            {
                                accessor: "actions",
                                title: t(
                                    "views.admin.users.users.table.actions"
                                ),
                                textAlign: "center",
                                render(record) {
                                    return (
                                        <Group gap="sm" justify="center">
                                            <ActionIcon
                                                radius="xl"
                                                size="md"
                                                variant="light"
                                                color="red"
                                                onClick={() =>
                                                    api
                                                        .deleteUser(record.id)
                                                        .then(refresh)
                                                }
                                            >
                                                <IconTrashFilled size={16} />
                                            </ActionIcon>
                                        </Group>
                                    );
                                },
                            },
                        ]}
                        totalRecords={total}
                        recordsPerPage={pageSize}
                        page={pageNumber + 1}
                        onPageChange={(p) => setPageNumber(p - 1)}
                    />
                </Stack>
            </Paper>
        </Stack>
    );
}
