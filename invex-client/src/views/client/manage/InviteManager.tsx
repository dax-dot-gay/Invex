import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
    useUser,
    useNetAccessible,
    useApi,
    ClientMixin,
} from "../../../context/net";
import { ClientResource } from "../../../types/client";

export function InviteManager() {
    const nav = useNavigate();
    const user = useUser();
    const accessible = useNetAccessible();
    const { t } = useTranslation();
    const api = useApi(ClientMixin);

    useEffect(() => {
        if (user?.kind !== "user" && accessible) {
            nav("/");
        }
    }, [user?.id, user?.kind, accessible]);

    const [resources, setResources] = useState<ClientResource[]>([]);
    const refreshResources = useCallback(async () => {
        setResources(await api.list_resources());
    }, [setResources, api.id]);

    useEffect(() => {
        refreshResources();
    }, [refreshResources]);

    return <></>;
}
