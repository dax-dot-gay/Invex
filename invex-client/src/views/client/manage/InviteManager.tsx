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
import {
    ActionIcon,
    Box,
    Group,
    Paper,
    ScrollArea,
    Stack,
    TextInput,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { IconLink, IconLinkPlus } from "@tabler/icons-react";
import { isBase64, isURL } from "validator";
import { randomBytes } from "../../../util/funcs";

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

    const [inviteLink, setInviteLink] = useInputState("");

    return (
        <Stack p="sm" gap="sm" h="100%" className="invite-manager">
            <Group gap="sm" w="100%" className="new-invite" wrap="nowrap">
                <TextInput
                    className="link-input"
                    classNames={{
                        input: "component-input",
                    }}
                    value={inviteLink}
                    onChange={setInviteLink}
                    leftSection={<IconLink size={24} />}
                    size="lg"
                    ff="monospace"
                    placeholder={`${location.origin}/inv/${randomBytes(8)}`}
                />
                <ActionIcon
                    disabled={
                        !(
                            (isBase64(inviteLink, { urlSafe: true }) &&
                                inviteLink.length >= 6) ||
                            isURL(inviteLink)
                        )
                    }
                    size={50}
                >
                    <IconLinkPlus />
                </ActionIcon>
            </Group>
            <Paper className="resource-panel paper-light" p="sm">
                <Stack gap="sm"></Stack>
            </Paper>
        </Stack>
    );
}
