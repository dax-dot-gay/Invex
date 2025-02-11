import { useTranslation } from "react-i18next";
import { ClientResourceGrant } from "../../../types/client";
import { HydratedInvite, HydratedService } from "./types";
import { useMemo } from "react";
import {
    IconFilePlus,
    IconScript,
    IconScriptX,
    IconServerOff,
    IconTextPlus,
} from "@tabler/icons-react";
import { DynamicAvatar } from "../../../components/icon";
import {
    darken,
    Divider,
    Group,
    Paper,
    Stack,
    Text,
    useMantineTheme,
} from "@mantine/core";
import { AttachmentItem } from "./render/AttachmentItem";

const ICON_SIZE = 20;

export function GrantView({
    invite,
    service,
    id,
    grant,
}: {
    invite: HydratedInvite;
    service: HydratedService;
    id: string;
    grant: ClientResourceGrant;
}) {
    const { t } = useTranslation();
    const theme = useMantineTheme();

    const [grantIcon, grantTitle, grantSubtitle, doRender]: [
        JSX.Element,
        string,
        string | null,
        boolean
    ] = useMemo(() => {
        switch (grant.type) {
            case "message":
                return [
                    <IconTextPlus size={ICON_SIZE} />,
                    grant.title,
                    grant.subtitle,
                    true,
                ];
            case "attachment":
                return [
                    <IconFilePlus size={ICON_SIZE} />,
                    grant.display_name ??
                        t("views.invites.item.grant.unnamedAttachment"),
                    grant.help,
                    true,
                ];
            case "plugin":
                switch (grant.result.type) {
                    case "service_failure":
                        return [
                            <IconServerOff size={ICON_SIZE} />,
                            t("views.invites.item.grant.error.service", {
                                code: grant.result.code,
                            }),
                            grant.result.reason,
                            false,
                        ];
                    case "grant_failure":
                        return [
                            <IconScriptX size={ICON_SIZE} />,
                            t("views.invites.item.grant.error.grant", {
                                code: grant.result.code,
                            }),
                            grant.result.reason,
                            false,
                        ];
                    case "success":
                        return [
                            <DynamicAvatar
                                source={grant.result.grant_icon as any}
                                fallback={IconScript}
                                size={ICON_SIZE + 8}
                                variant="transparent"
                            />,
                            grant.result.grant_name,
                            grant.result.plugin_name,
                            true,
                        ];
                }
            default:
                return [<></>, "", null, false];
        }
    }, [grant, id]);

    return (
        <Paper
            className="invite-item grant"
            radius="sm"
            style={
                doRender
                    ? undefined
                    : {
                          background: `linear-gradient(45deg, var(--mantine-color-body) 0%, var(--mantine-color-body) 40%, ${darken(
                              theme.colors.red[9],
                              0.5
                          )} 100%)`,
                      }
            }
        >
            <Stack gap={0}>
                <Group p="sm" gap="sm">
                    {grantIcon}
                    <Stack gap={0}>
                        <Text>{grantTitle}</Text>
                        {grantSubtitle && (
                            <Text c="dimmed" size="xs">
                                {grantSubtitle}
                            </Text>
                        )}
                    </Stack>
                </Group>
                {doRender && (
                    <>
                        <Divider />
                        {grant.type === "attachment" && (
                            <AttachmentItem
                                invite={invite}
                                service={service}
                                id={id}
                                grant={grant}
                            />
                        )}
                    </>
                )}
            </Stack>
        </Paper>
    );
}
