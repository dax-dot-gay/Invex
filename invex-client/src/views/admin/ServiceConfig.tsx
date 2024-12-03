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
    Stack,
    Text,
} from "@mantine/core";
import { DynamicAvatar } from "../../components/icon";
import {
    IconFilePlus,
    IconPencil,
    IconServer,
    IconTextPlus,
    IconTrashFilled,
    IconUserPlus,
    IconX,
} from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import { ModalTitle } from "../../modals";

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

    const addGrant = useCallback(
        (type: ServiceGrant["type"]) => {
            if (service && service !== "loading") {
                modals.openContextModal({
                    modal: "addGrant",
                    title: (
                        <ModalTitle
                            icon={
                                type === "account"
                                    ? IconUserPlus
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
            <Box className="grant-container" p="sm">
                {Object.keys(service.grants).length > 0 ? (
                    <></>
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
                                leftSection={<IconUserPlus />}
                                variant="light"
                                size="lg"
                                onClick={() => addGrant("account")}
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
