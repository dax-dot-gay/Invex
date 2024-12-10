import { useTranslation } from "react-i18next";
import { Service, ServiceGrant } from "../../../types/service";
import { AttachmentGrantEditor } from "./AttachmentGrantEditor";
import {
    ActionIcon,
    Group,
    Loader,
    Paper,
    ScrollAreaAutosize,
    Stack,
    Text,
} from "@mantine/core";
import { useCallback, useMemo, useState } from "react";
import {
    IconFilePlus,
    IconScriptPlus,
    IconTextPlus,
    IconTrashFilled,
} from "@tabler/icons-react";
import { ServiceMixin, useApi } from "../../../context/net";
import { isEqual } from "lodash";
import { MessageGrantEditor } from "./MessageGrantEditor";

function GrantEditorInner(props: {
    id: string;
    service: Service;
    grant: ServiceGrant;
    save: (grant: ServiceGrant) => Promise<void>;
}) {
    switch (props.grant.type) {
        case "attachment":
            return <AttachmentGrantEditor {...(props as any)} />;
        case "grant":
            return <></>;
        case "message":
            return <MessageGrantEditor {...(props as any)} />;
    }
}

export function GrantEditor(props: {
    id: string;
    service: Service;
    grant: ServiceGrant;
    refresh: () => void;
}) {
    const { t } = useTranslation();
    const api = useApi(ServiceMixin);
    const [GrantIcon, title] = useMemo(() => {
        switch (props.grant.type) {
            case "attachment":
                return [IconFilePlus, props.grant.display_name];
            case "grant":
                return [
                    IconScriptPlus,
                    `${props.grant.plugin_id}.${props.grant.key}`,
                ];
            case "message":
                return [IconTextPlus, props.grant.title];
            case "inline_image":
                return [IconFilePlus, ""];
        }
    }, [props.grant.type, props.id]);
    const [loading, setLoading] = useState(false);

    const save = useCallback(
        async (grant: ServiceGrant) => {
            if (!isEqual(grant, props.service.grants[props.id])) {
                setLoading(true);
                await api.updateServiceGrant(
                    props.service._id,
                    props.id,
                    grant
                );
                props.refresh();
                setLoading(false);
            }
        },
        [props.id, props.service._id, api.updateServiceGrant, setLoading]
    );

    return (
        <Stack gap="sm" p="sm" h="100%" mah="100%">
            <Paper p="sm" className="paper-light">
                <Group gap="sm" justify="space-between">
                    <Group gap="sm">
                        <GrantIcon size={28} />
                        <Stack gap={0}>
                            <Text>{title}</Text>
                            <Text size="sm" c="dimmed">
                                {t(
                                    `views.admin.services.config.grants.${props.grant.type}.title`
                                )}
                            </Text>
                        </Stack>
                    </Group>
                    <Group gap="md">
                        {loading && (
                            <Group gap="xs">
                                <Loader size="sm" />
                                <Text>{t("common.words.saving")}</Text>
                            </Group>
                        )}
                        <ActionIcon
                            variant="light"
                            size="xl"
                            color="red"
                            onClick={() =>
                                api
                                    .deleteServiceGrant(
                                        props.service._id,
                                        props.id
                                    )
                                    .then(props.refresh)
                            }
                        >
                            <IconTrashFilled />
                        </ActionIcon>
                    </Group>
                </Group>
            </Paper>
            <Paper
                p="sm"
                style={{ flexGrow: 1, overflow: "hidden" }}
                className="grant-editor-inner"
                bg={"var(--mantine-color-default)"}
            >
                <ScrollAreaAutosize mah="100%">
                    <GrantEditorInner
                        id={props.id}
                        service={props.service}
                        grant={props.grant}
                        save={save}
                    />
                </ScrollAreaAutosize>
            </Paper>
        </Stack>
    );
}
