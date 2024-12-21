import {
    Box,
    Button,
    Divider,
    Group,
    Paper,
    ScrollArea,
    Stack,
    Text,
    useMantineTheme,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconPlus, IconServer, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { ModalTitle } from "../../modals";
import { useEffect, useState } from "react";
import { Service } from "../../types/service";
import { ServiceMixin, useApi } from "../../context/net";
import { DynamicAvatar } from "../../components/icon";
import { ServiceConfig } from "./ServiceConfig";
import { useRefreshCallback } from "../../context/refresh";

export function ServicePanel() {
    const { t } = useTranslation();
    const api = useApi(ServiceMixin);
    const [services, setServices] = useState<Service[]>([]);
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const refresh = useRefreshCallback(() => {
        api.getServices().then((v) =>
            setServices(v.sort((a, b) => a.name.localeCompare(b.name)))
        );
    }, [setServices, api.getServices]);
    const theme = useMantineTheme();

    useEffect(() => {
        refresh();
    }, [refresh]);

    return (
        <Group gap="sm" className="admin-panel services" wrap="nowrap">
            <Paper className="service-selector paper-light" p={0}>
                <Stack gap={0} className="service-nav-stack">
                    <Group gap="sm" justify="space-between" p="sm">
                        <IconServer />
                        <Text fw={600}>{t("views.admin.services.header")}</Text>
                    </Group>
                    <Divider />
                    <Box className="service-list">
                        <ScrollArea.Autosize
                            p="sm"
                            className="service-list-scroll"
                        >
                            <Stack gap="xs">
                                {services.map((service) => (
                                    <Paper
                                        key={service._id}
                                        p="sm"
                                        bg="var(--mantine-color-body)"
                                        className="service-item"
                                        style={
                                            selectedService === service._id
                                                ? {
                                                      borderColor:
                                                          theme.colors
                                                              .primary[6],
                                                  }
                                                : undefined
                                        }
                                        onClick={() =>
                                            selectedService === service._id
                                                ? setSelectedService(null)
                                                : setSelectedService(
                                                      service._id
                                                  )
                                        }
                                    >
                                        <Group gap="sm" wrap="nowrap">
                                            <DynamicAvatar
                                                variant="transparent"
                                                source={service.icon as any}
                                                fallback={IconServer}
                                            />
                                            <Stack gap={0}>
                                                <Text size="md">
                                                    {service.name}
                                                </Text>
                                                {service.description && (
                                                    <Text
                                                        lineClamp={1}
                                                        size="xs"
                                                        c="dimmed"
                                                    >
                                                        {service.description}
                                                    </Text>
                                                )}
                                            </Stack>
                                        </Group>
                                    </Paper>
                                ))}
                            </Stack>
                        </ScrollArea.Autosize>
                    </Box>
                    <Divider />
                    <Box p="sm">
                        <Button
                            fullWidth
                            justify="space-between"
                            leftSection={<IconPlus />}
                            size="md"
                            onClick={() =>
                                modals.openContextModal({
                                    modal: "addService",
                                    title: (
                                        <ModalTitle
                                            name={t("modals.addService.title")}
                                            icon={IconPlus}
                                        />
                                    ),
                                    innerProps: {
                                        refresh,
                                    },
                                    centered: true,
                                })
                            }
                        >
                            {t("views.admin.services.add")}
                        </Button>
                    </Box>
                </Stack>
            </Paper>
            <Paper className="service-configurator" withBorder p={0}>
                {selectedService ? (
                    <ServiceConfig
                        id={selectedService}
                        refresh={refresh}
                        close={() => setSelectedService(null)}
                    />
                ) : (
                    <Stack gap="md" className="no-service" w="256">
                        <Group gap="sm" justify="space-between">
                            <IconX opacity={0.6} size={28} />
                            <Text size="xl" opacity={0.6}>
                                {t("views.admin.services.noService")}
                            </Text>
                        </Group>
                        <Button
                            fullWidth
                            variant="light"
                            leftSection={<IconPlus />}
                            size="lg"
                            justify="space-between"
                            onClick={() =>
                                modals.openContextModal({
                                    modal: "addService",
                                    title: (
                                        <ModalTitle
                                            name={t("modals.addService.title")}
                                            icon={IconPlus}
                                        />
                                    ),
                                    innerProps: {
                                        refresh,
                                    },
                                    centered: true,
                                })
                            }
                        >
                            {t("views.admin.services.add")}
                        </Button>
                    </Stack>
                )}
            </Paper>
        </Group>
    );
}
