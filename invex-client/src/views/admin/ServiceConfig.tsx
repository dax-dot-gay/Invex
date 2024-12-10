import { useTranslation } from "react-i18next";
import { ServiceMixin, useApi } from "../../context/net";
import { useCallback, useEffect, useState } from "react";
import { Service, ServiceGrant } from "../../types/service";
import {
    ActionIcon,
    Box,
    Button,
    ButtonGroup,
    Divider,
    Group,
    Loader,
    Paper,
    ScrollAreaAutosize,
    Stack,
    Text,
} from "@mantine/core";
import { DynamicAvatar } from "../../components/icon";
import {
    IconFilePlus,
    IconPencil,
    IconScriptPlus,
    IconServer,
    IconTextPlus,
    IconTrashFilled,
    IconX,
} from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import { ModalTitle } from "../../modals";
import { GrantEditor } from "./grants/GrantEditor";

function GrantItem({
    grant,
    selected,
    onSelect,
}: {
    grant: ServiceGrant;
    selected: boolean;
    onSelect: () => void;
}) {
    const { t } = useTranslation();
    switch (grant.type) {
        case "grant":
            return (
                <Paper
                    className={"grant-item" + (selected ? " selected" : "")}
                    onClick={onSelect}
                    p="sm"
                    radius={0}
                    shadow="none"
                >
                    <Group gap="sm">
                        <IconScriptPlus size={28} />
                        <Stack gap={0}>
                            <Text>
                                {t(
                                    "views.admin.services.config.grants.grant.title"
                                )}
                            </Text>
                        </Stack>
                    </Group>
                </Paper>
            );
        case "message":
            return (
                <Paper
                    className={"grant-item" + (selected ? " selected" : "")}
                    onClick={onSelect}
                    p="sm"
                    radius={0}
                    shadow="none"
                >
                    <Group gap="sm">
                        <IconTextPlus size={28} />
                        <Stack gap={0}>
                            <Text>{grant.title}</Text>
                            <Text c="dimmed" size="sm">
                                {t(
                                    "views.admin.services.config.grants.message.title"
                                )}
                            </Text>
                        </Stack>
                    </Group>
                </Paper>
            );
        case "attachment":
            return (
                <Paper
                    className={"grant-item" + (selected ? " selected" : "")}
                    onClick={onSelect}
                    p="sm"
                    radius={0}
                    shadow="none"
                >
                    <Group gap="sm">
                        <IconFilePlus size={28} />
                        <Stack gap={0}>
                            <Text>{grant.display_name}</Text>
                            <Text c="dimmed" size="sm">
                                {t(
                                    "views.admin.services.config.grants.attachment.title"
                                )}
                            </Text>
                        </Stack>
                    </Group>
                </Paper>
            );
        case "inline_image":
            return <></>;
    }
}

export function ServiceConfig({
    id,
    refresh,
    close,
}: {
    id: string;
    refresh: () => void;
    close: () => void;
}) {
    const api = useApi(ServiceMixin);
    const { t } = useTranslation();
    const [service, setService] = useState<Service | "loading" | null>(
        "loading"
    );
    const refreshSelf = useCallback(() => {
        api.getService(id).then(setService);
    }, [api.getService, setService, id]);

    useEffect(() => {
        refreshSelf();
    }, [refreshSelf]);

    useEffect(() => {
        if (service === null) {
            refresh();
            close();
        }
    }, [service]);
    const jsonService = JSON.stringify(service);
    const [viewingGrant, setViewingGrant] = useState<string | null>(null);

    const addGrant = useCallback(
        (type: ServiceGrant["type"]) => {
            if (service && service !== "loading") {
                modals.openContextModal({
                    modal: "addGrant",
                    title: (
                        <ModalTitle
                            icon={
                                type === "grant"
                                    ? IconScriptPlus
                                    : type === "attachment"
                                    ? IconFilePlus
                                    : IconTextPlus
                            }
                            name={t(`modals.addGrant.${type}.title`)}
                        />
                    ),
                    innerProps: {
                        type,
                        refresh: refreshSelf,
                        service,
                    },
                    size: "xl",
                });
            }
        },
        [jsonService, refreshSelf]
    );

    return service === "loading" ? (
        <Loader className="no-service" />
    ) : service ? (
        <Stack gap={0} className="service-config-stack">
            <Group gap="sm" justify="space-between" p="sm">
                <Group gap="sm">
                    <DynamicAvatar
                        source={service.icon as any}
                        fallback={IconServer}
                        size={48}
                        variant="transparent"
                    />
                    <Stack gap={0}>
                        <Text size="lg">{service.name}</Text>
                        {service.description && (
                            <Text size="sm" lineClamp={2} c="dimmed">
                                {service.description}
                            </Text>
                        )}
                    </Stack>
                </Group>
                <ActionIcon.Group>
                    <ActionIcon
                        size="xl"
                        variant="light"
                        onClick={() =>
                            modals.openContextModal({
                                modal: "updateService",
                                title: (
                                    <ModalTitle
                                        icon={IconPencil}
                                        name={t("modals.updateService.title")}
                                    />
                                ),
                                innerProps: {
                                    refresh: function (): void {
                                        refresh();
                                        refreshSelf();
                                    },
                                    service,
                                },
                            })
                        }
                    >
                        <IconPencil />
                    </ActionIcon>
                    <ActionIcon
                        size="xl"
                        variant="light"
                        color="red"
                        onClick={() =>
                            api.deleteService(service._id).then(() => {
                                refresh();
                                close();
                            })
                        }
                    >
                        <IconTrashFilled />
                    </ActionIcon>
                </ActionIcon.Group>
            </Group>
            <Divider />
            <Box className="grant-container" p={0}>
                {Object.keys(service.grants).length > 0 ? (
                    <Group gap={0} p={0} h="100%" w="100%" wrap="nowrap">
                        <Box
                            className="grant-scroll"
                            w="256px"
                            maw="50%"
                            h="100%"
                        >
                            <Stack gap={0} h="100%">
                                <ScrollAreaAutosize
                                    mah="calc(100% - 42px)"
                                    h="calc(100% - 42px)"
                                >
                                    <Stack gap={0}>
                                        {Object.entries(service.grants)
                                            .filter(
                                                ([_, { type }]) =>
                                                    type !== "inline_image"
                                            )
                                            .sort((a, b) =>
                                                a[0].localeCompare(b[0])
                                            )
                                            .map(([id, grant]) => (
                                                <GrantItem
                                                    key={id}
                                                    grant={grant}
                                                    selected={
                                                        viewingGrant === id
                                                    }
                                                    onSelect={() =>
                                                        setViewingGrant((cur) =>
                                                            cur === id
                                                                ? null
                                                                : id
                                                        )
                                                    }
                                                />
                                            ))}
                                    </Stack>
                                </ScrollAreaAutosize>
                                <Divider />
                                <ActionIcon.Group w="100%">
                                    <ActionIcon
                                        style={{ flexGrow: 1 }}
                                        radius={0}
                                        size="xl"
                                        variant="light"
                                        onClick={() => addGrant("grant")}
                                    >
                                        <IconScriptPlus />
                                    </ActionIcon>
                                    <ActionIcon
                                        style={{ flexGrow: 1 }}
                                        size="xl"
                                        variant="light"
                                        onClick={() => addGrant("attachment")}
                                    >
                                        <IconFilePlus />
                                    </ActionIcon>
                                    <ActionIcon
                                        style={{ flexGrow: 1 }}
                                        size="xl"
                                        radius={0}
                                        variant="light"
                                        onClick={() => addGrant("message")}
                                    >
                                        <IconTextPlus />
                                    </ActionIcon>
                                </ActionIcon.Group>
                            </Stack>
                        </Box>
                        <Divider orientation="vertical" h="100%" />
                        <Box
                            className="grant-viewer"
                            h="100%"
                            style={{ flexGrow: 1 }}
                        >
                            {viewingGrant &&
                            Object.keys(service.grants).includes(
                                viewingGrant
                            ) ? (
                                <GrantEditor
                                    id={viewingGrant}
                                    service={service}
                                    grant={service.grants[viewingGrant]}
                                    refresh={() => {
                                        refreshSelf();
                                        refresh();
                                    }}
                                />
                            ) : (
                                <></>
                            )}
                        </Box>
                    </Group>
                ) : (
                    <Stack
                        gap="md"
                        className="create-grant empty"
                        align="center"
                    >
                        <Group gap="sm">
                            <IconX
                                opacity={0.65}
                                size={28}
                                style={{ transform: "translate(0, 1px)" }}
                            />
                            <Text size="xl" c="dimmed">
                                {t("views.admin.services.config.noGrants")}
                            </Text>
                        </Group>
                        <ButtonGroup>
                            <Button
                                leftSection={<IconScriptPlus />}
                                variant="light"
                                size="lg"
                                onClick={() => addGrant("grant")}
                            >
                                {t("views.admin.services.config.addAccount")}
                            </Button>
                            <Button
                                leftSection={<IconFilePlus />}
                                variant="light"
                                size="lg"
                                onClick={() => addGrant("attachment")}
                            >
                                {t("views.admin.services.config.addAttachment")}
                            </Button>
                            <Button
                                leftSection={<IconTextPlus />}
                                variant="light"
                                size="lg"
                                onClick={() => addGrant("message")}
                            >
                                {t("views.admin.services.config.addMessage")}
                            </Button>
                        </ButtonGroup>
                    </Stack>
                )}
            </Box>
        </Stack>
    ) : (
        <></>
    );
}
