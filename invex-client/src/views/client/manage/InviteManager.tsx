import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
    useUser,
    useNetAccessible,
    useApi,
    ClientMixin,
} from "../../../context/net";
import { InviteUsage } from "../../../types/invite";

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

    const [usages, setUsages] = useState<InviteUsage[]>([]);
    const refreshUsages = useCallback(async () => {
        setUsages(await api.list_invite_usages());
    }, [setUsages, api.id]);

    useEffect(() => {
        refreshUsages();
    }, []);

    return <></>;
}
