import {
    ActionIcon,
    Badge,
    Button,
    Divider,
    Group,
    Paper,
    Stack,
    Text,
    ThemeIcon,
    Title,
    Tooltip,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import {
    IconCalendar,
    IconCircleCheckFilled,
    IconCircleXFilled,
    IconClipboardCheck,
    IconClipboardCopy,
    IconLink,
    IconLinkPlus,
    IconMinus,
    IconServer,
    IconTrashFilled,
    IconUsers,
    IconX,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { ModalTitle } from "../../modals";
import { InviteMixin, useApi } from "../../context/net";
import { DataTable } from "mantine-datatable";
import { useEffect, useState } from "react";
import { Invite } from "../../types/invite";
import { DynamicAvatar } from "../../components/icon";
import { useClipboard } from "@mantine/hooks";
import { useRefreshCallback } from "../../context/refresh";

export function InvitePanel() {
    const { t } = useTranslation();
    const api = useApi(InviteMixin);
    const [pageSize, _] = useState(25);
    const [pageNumber, setPageNumber] = useState(0);
    const [total, setTotal] = useState(0);
    const [invites, setInvites] = useState<Invite[]>([]);

    const refresh = useRefreshCallback(() => {
        api.paginate_invites(pageNumber, pageSize).then((invs) => {
            setInvites(invs.results);
            setTotal(invs.total);
        });
    }, [setInvites, setTotal, pageSize, pageNumber, api.paginate_invites]);

    useEffect(() => {
        refresh();
    }, [refresh]);
    const clipboard = useClipboard();

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
                            accessor: "disabled",
                            title: t("views.admin.invites.table.enabled"),
                            textAlign: "center",
                            render(record) {
                                return record.disabled ? (
                                    <ThemeIcon
                                        color="red"
                                        radius="xl"
                                        size="lg"
                                    >
                                        <IconCircleXFilled />
                                    </ThemeIcon>
                                ) : (
                                    <ThemeIcon
                                        color="green"
                                        radius="xl"
                                        size="lg"
                                    >
                                        <IconCircleCheckFilled />
                                    </ThemeIcon>
                                );
                            },
                        },
                        {
                            accessor: "invite.code",
                            title: t("views.admin.invites.table.code"),
                            render(record) {
                                return (
                                    <Group
                                        wrap="nowrap"
                                        gap="sm"
                                        justify="space-between"
                                        style={{ cursor: "pointer" }}
                                        onClick={() =>
                                            clipboard.copy(
                                                `${window.location.origin}/inv/${record.invite.code}`
                                            )
                                        }
                                    >
                                        <ActionIcon variant="transparent">
                                            {clipboard.copied ? (
                                                <IconClipboardCheck size={20} />
                                            ) : (
                                                <IconClipboardCopy size={20} />
                                            )}
                                        </ActionIcon>
                                        <Group gap={0} wrap="nowrap">
                                            <Text
                                                c="dimmed"
                                                ff="monospace"
                                                fw={600}
                                                style={{ whiteSpace: "nowrap" }}
                                            >
                                                {window.location.origin}/inv/
                                            </Text>
                                            <Text
                                                ff="monospace"
                                                fw={600}
                                                style={{ whiteSpace: "nowrap" }}
                                            >
                                                {record.invite.code}
                                            </Text>
                                        </Group>
                                    </Group>
                                );
                            },
                        },
                        {
                            accessor: "invite.alias",
                            title: t("views.admin.invites.table.alias"),
                        },
                        {
                            accessor: "usages.length",
                            title: t("views.admin.invites.table.usages"),
                        },
                        {
                            accessor: "expires",
                            title: t("views.admin.invites.table.expires"),
                            render(record) {
                                switch (record.expires.type) {
                                    case "never":
                                        return (
                                            <Group gap="xs">
                                                <IconX size="20" />
                                                <Text>
                                                    {t(
                                                        "views.admin.invites.table.expirationTypes.never"
                                                    )}
                                                </Text>
                                            </Group>
                                        );
                                    case "uses":
                                        return (
                                            <Group gap="xs">
                                                <IconUsers size="20" />
                                                <Text>
                                                    {t(
                                                        "views.admin.invites.table.expirationTypes.uses",
                                                        {
                                                            max: record.expires
                                                                .value,
                                                            remaining: Math.max(
                                                                0,
                                                                record.expires
                                                                    .value -
                                                                    record
                                                                        .usages
                                                                        .length
                                                            ),
                                                        }
                                                    )}
                                                </Text>
                                            </Group>
                                        );
                                    case "datetime":
                                        return (
                                            <Group gap="xs">
                                                <IconCalendar size="20" />
                                                <Text>
                                                    {t(
                                                        "views.admin.invites.table.expirationTypes.datetime",
                                                        {
                                                            datetime: new Date(
                                                                record.expires.value
                                                            ).toLocaleString(),
                                                        }
                                                    )}
                                                </Text>
                                            </Group>
                                        );
                                }
                            },
                        },
                        {
                            accessor: "services",
                            title: t("views.admin.invites.table.services"),
                            width: "50%",
                            render(record) {
                                return (
                                    <Group gap="xs">
                                        {record.services.map((service) => (
                                            <Badge
                                                variant="light"
                                                key={service._id}
                                                pl="4px"
                                                size="lg"
                                                tt={"none"}
                                                leftSection={
                                                    <DynamicAvatar
                                                        variant="transparent"
                                                        source={
                                                            (service.icon as any) ??
                                                            "icon:IconServer"
                                                        }
                                                        fallback={IconServer}
                                                        size={18}
                                                    />
                                                }
                                            >
                                                {service.name}
                                            </Badge>
                                        ))}
                                    </Group>
                                );
                            },
                        },
                        {
                            accessor: "actions",
                            title: t("views.admin.users.users.table.actions"),
                            textAlign: "center",
                            render(record) {
                                return (
                                    <Group gap="sm" justify="center">
                                        {!record.disabled && (
                                            <Tooltip
                                                label={t(
                                                    "views.admin.invites.table.disable"
                                                )}
                                                color="dark"
                                            >
                                                <ActionIcon
                                                    radius="xl"
                                                    size="md"
                                                    variant="light"
                                                    color="gray"
                                                    onClick={() => {
                                                        api.disable_invite(
                                                            record.id
                                                        ).then(refresh);
                                                    }}
                                                >
                                                    <IconMinus size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                        )}
                                        <Tooltip
                                            label={t(
                                                "views.admin.invites.table.delete"
                                            )}
                                            color="dark"
                                        >
                                            <ActionIcon
                                                radius="xl"
                                                size="md"
                                                variant="light"
                                                color="red"
                                                onClick={() => {
                                                    api.delete_invite(
                                                        record.id
                                                    ).then(refresh);
                                                }}
                                            >
                                                <IconTrashFilled size={16} />
                                            </ActionIcon>
                                        </Tooltip>
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
