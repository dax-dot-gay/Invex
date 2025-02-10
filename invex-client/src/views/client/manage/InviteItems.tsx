import { useTranslation } from "react-i18next";
import { HydratedInvite, HydratedService } from "./types";
import {
    AccordionControl,
    AccordionItem,
    AccordionPanel,
    Badge,
    Divider,
    Group,
    Paper,
    Stack,
    Text,
} from "@mantine/core";
import { IconLink, IconServer } from "@tabler/icons-react";
import { DynamicAvatar } from "../../../components/icon";
import { GrantView } from "./GrantItems";

function ServiceItem({
    invite,
    service,
}: {
    invite: HydratedInvite;
    service: HydratedService;
}) {
    return (
        <Paper
            className="paper-light invite-item service"
            radius="sm"
            withBorder
        >
            <Stack gap="sm">
                <Group gap="sm" p="sm" pb={0}>
                    <DynamicAvatar
                        source={service.icon as any}
                        fallback={IconServer}
                        variant="transparent"
                    />
                    <Stack gap={0}>
                        <Text size="lg" fw="600">
                            {service.name}
                        </Text>
                        {service.description && (
                            <Text c="dimmed" size="sm">
                                {service.description}
                            </Text>
                        )}
                    </Stack>
                </Group>
                <Divider />
                <Stack gap="sm" p="sm" pt={0}>
                    {Object.entries(service.grants)
                        .sort((a, b) => a[0].localeCompare(b[0]))
                        .filter(
                            (v) =>
                                v[1].type === "attachment" ||
                                v[1].type === "message" ||
                                v[1].type === "plugin"
                        )
                        .map(([key, grant]) => (
                            <GrantView
                                invite={invite}
                                service={service}
                                id={key}
                                key={key}
                                grant={grant}
                            />
                        ))}
                </Stack>
            </Stack>
        </Paper>
    );
}

export function InviteItem({ invite }: { invite: HydratedInvite }) {
    const { t } = useTranslation();

    return (
        <AccordionItem value={invite.code} className="invite-item invite">
            <AccordionControl icon={<IconLink />}>
                <Group gap="sm" justify="space-between" pr="lg">
                    <Stack gap={0}>
                        <Text fw="bold" size="lg">
                            {invite.alias && invite.alias.length > 0
                                ? invite.alias
                                : t("views.invites.item.unnamedInvite")}
                        </Text>
                        <Text c="dimmed" size="xs">
                            inv/{invite.code}
                        </Text>
                    </Stack>
                    <Badge
                        size="xl"
                        radius="sm"
                        color="gray"
                        variant="light"
                        pl={6}
                        pr="xs"
                    >
                        <Group gap="sm">
                            <IconServer size={20} />
                            <Text fw="bold">
                                {t("views.invites.item.serviceCount", {
                                    count: Object.keys(invite.services).length,
                                })}
                            </Text>
                        </Group>
                    </Badge>
                </Group>
            </AccordionControl>
            <AccordionPanel>
                <Stack gap="sm">
                    {Object.values(invite.services)
                        .sort((a, b) => a.index - b.index)
                        .map((svc) => (
                            <ServiceItem
                                key={svc.id}
                                invite={invite}
                                service={svc}
                            />
                        ))}
                </Stack>
            </AccordionPanel>
        </AccordionItem>
    );
}
