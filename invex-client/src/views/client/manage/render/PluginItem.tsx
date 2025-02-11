import { Box, Divider, Group, Paper, Stack, Text } from "@mantine/core";
import { ClientResourcePluginGrant } from "../../../../types/client";
import { PluginGIProps } from "../types";
import { ReactNode } from "react";
import {
    GrantResource_Account,
    GrantResource_Action,
    GrantResource_File,
    GrantResource_Generic,
    GrantResource_Url,
} from "../../../../types/plugin";
import { useTranslation } from "react-i18next";
import { IconCube, IconFile, IconScript, IconUser } from "@tabler/icons-react";

function Resource({
    icon,
    label,
    children,
}: {
    icon: JSX.Element;
    label: string;
    children?: ReactNode | ReactNode[];
}) {
    return (
        <Paper bg="var(--mantine-color-default)">
            <Stack gap={0}>
                <Group gap="sm" p="sm">
                    {icon}
                    <Text size="lg" fw="600">
                        {label}
                    </Text>
                </Group>
                <Divider />
                <Box p="sm">{children}</Box>
            </Stack>
        </Paper>
    );
}

function AccountResource({
    resource,
    ...props
}: { resource: GrantResource_Account } & PluginGIProps) {
    const { t } = useTranslation();
    return (
        <Resource
            icon={<IconUser />}
            label={t("views.invites.item.grant.plugin.account.label")}
        ></Resource>
    );
}

function FileResource({
    resource,
    ...props
}: { resource: GrantResource_File } & PluginGIProps) {
    const { t } = useTranslation();
    return (
        <Resource
            icon={<IconFile />}
            label={t("views.invites.item.grant.plugin.file.label")}
        ></Resource>
    );
}

function URLResource({
    resource,
    ...props
}: { resource: GrantResource_Url } & PluginGIProps) {
    const { t } = useTranslation();
    return (
        <Resource
            icon={<IconUser />}
            label={t("views.invites.item.grant.plugin.url.label")}
        ></Resource>
    );
}

function GenericResource({
    resource,
    ...props
}: { resource: GrantResource_Generic } & PluginGIProps) {
    const { t } = useTranslation();
    return (
        <Resource
            icon={<IconCube />}
            label={t("views.invites.item.grant.plugin.generic.label")}
        ></Resource>
    );
}

function ActionResource({
    resource,
    ...props
}: { resource: GrantResource_Action } & PluginGIProps) {
    const { t } = useTranslation();
    return (
        <Resource
            icon={<IconScript />}
            label={t("views.invites.item.grant.plugin.action.label")}
        ></Resource>
    );
}

export function PluginItem(props: PluginGIProps) {
    const result = props.grant.result as Extract<
        ClientResourcePluginGrant,
        { type: "success" }
    >;

    return (
        <Stack gap="sm" p="sm">
            {result.resources.map((resource) => {
                switch (resource.type) {
                    case "account":
                        return (
                            <AccountResource
                                resource={resource}
                                {...props}
                                key={resource.id}
                            />
                        );
                    case "action":
                        return (
                            <ActionResource
                                resource={resource}
                                {...props}
                                key={resource.id}
                            />
                        );
                    case "file":
                        return (
                            <FileResource
                                resource={resource}
                                {...props}
                                key={resource.id}
                            />
                        );
                    case "generic":
                        return (
                            <GenericResource
                                resource={resource}
                                {...props}
                                key={resource.id}
                            />
                        );
                    case "url":
                        return (
                            <URLResource
                                resource={resource}
                                {...props}
                                key={resource.id}
                            />
                        );
                }
            })}
        </Stack>
    );
}
