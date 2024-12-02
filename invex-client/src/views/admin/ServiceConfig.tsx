import { useTranslation } from "react-i18next";
import { ServiceMixin, useApi } from "../../context/net";
import { useCallback, useEffect, useState } from "react";
import { Service } from "../../types/service";
import { Loader, Stack } from "@mantine/core";

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
        <Stack gap={0} className="service-config-stack"></Stack>
    ) : (
        <></>
    );
}
