import {
    ActionIcon,
    Button,
    Divider,
    Group,
    Paper,
    Stack,
    Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconLink, IconLinkPlus, IconTrashFilled } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { ModalTitle } from "../../modals";
import { InviteMixin, useApi } from "../../context/net";
import { DataTable } from "mantine-datatable";
import { useCallback, useEffect, useState } from "react";
import { Invite } from "../../types/invite";

export function InvitePanel() {
    const { t } = useTranslation();
    const api = useApi(InviteMixin);
    const [pageSize, setPageSize] = useState(25);
    const [pageNumber, setPageNumber] = useState(0);
    const [total, setTotal] = useState(0);
    const [invites, setInvites] = useState<Invite[]>([]);

    const refresh = useCallback(() => {
        api.paginate_invites(pageNumber, pageSize).then((invs) => {
            setInvites(invs.results);
            setTotal(invs.total);
        });
    }, [setInvites, setTotal, pageSize, pageNumber, api.paginate_invites]);

    useEffect(() => {
        refresh();
    }, [refresh]);

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
                    <Button
                        size="md"
                        leftSection={<IconLinkPlus size={20} />}
                        onClick={() =>
                            modals.openContextModal({
                                modal: "createInvite",
                                title: (
                                    <ModalTitle
                                        name={t("modals.createInvite.title")}
                                        icon={IconLinkPlus}
                                    />
                                ),
                                innerProps: {
                                    refresh,
                                },
                                size: "lg",
                            })
                        }
                    >
                        {t("views.admin.invites.create")}
                    </Button>
                </Group>
                <Divider />
                <DataTable
                    withColumnBorders
                    records={invites}
                    style={{ flexGrow: 1 }}
                    columns={[
                        {
                            accessor: "invite.code",
                            title: t("views.admin.invites.table.code"),
                        },
                        {
                            accessor: "usages.length",
                            title: t("views.admin.invites.table.usages"),
                        },
                        {
                            accessor: "actions",
                            title: t("views.admin.users.users.table.actions"),
                            textAlign: "center",
                            render(record) {
                                return (
                                    <Group gap="sm" justify="center">
                                        <ActionIcon
                                            radius="xl"
                                            size="md"
                                            variant="light"
                                            color="red"
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
    );
}
