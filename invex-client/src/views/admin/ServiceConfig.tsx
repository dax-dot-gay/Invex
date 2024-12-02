import { useTranslation } from "react-i18next";
import { ServiceMixin, useApi } from "../../context/net";
import { useCallback, useEffect, useState } from "react";
import { Service } from "../../types/service";
import { ActionIcon, Divider, Group, Loader, Stack, Text } from "@mantine/core";
import { DynamicAvatar } from "../../components/icon";
import { IconPencil, IconServer, IconTrashFilled } from "@tabler/icons-react";

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
                    <ActionIcon size="xl" variant="light">
                        <IconPencil />
                    </ActionIcon>
                    <ActionIcon size="xl" variant="light" color="red">
                        <IconTrashFilled />
                    </ActionIcon>
                </ActionIcon.Group>
            </Group>
            <Divider />
        </Stack>
    ) : (
        <></>
    );
}
