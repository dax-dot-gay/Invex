import { useCallback, useEffect, useMemo, useState } from "react";
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
    Accordion,
    ActionIcon,
    Badge,
    Center,
    Checkbox,
    CloseButton,
    Combobox,
    Group,
    Input,
    Paper,
    PillGroup,
    PillsInput,
    ScrollAreaAutosize,
    Stack,
    Text,
    TextInput,
    ThemeIcon,
    useCombobox,
} from "@mantine/core";
import { useInputState, useListState } from "@mantine/hooks";
import {
    IconArticleFilled,
    IconCube,
    IconFile,
    IconFilter,
    IconLink,
    IconLinkPlus,
    IconMailX,
    IconScript,
    IconServer,
    IconUser,
} from "@tabler/icons-react";
import { isBase64, isURL } from "validator";
import { randomBytes } from "../../../util/funcs";
import { isEqual } from "lodash";
import { DynamicAvatar } from "../../../components/icon";
import { HydratedInvite } from "./types";
import { InviteItem } from "./InviteItems";

type FilterType = (
    | {
          type: "invite";
          code: string;
          alias: string | null;
      }
    | {
          type: "service";
          id: string;
          name: string;
          icon: string | null;
      }
    | {
          type: "grant";
          subtype: "attachment" | "message" | "plugin";
      }
    | {
          type: "resource";
          subtype: "account" | "file" | "url" | "generic" | "action";
      }
) & { key: string };

function ResourceFilter({
    resources,
    onFilter,
}: {
    resources: ClientResource[];
    onFilter: (filtered: ClientResource[]) => void;
}) {
    const [filters, { append: appendFilter, remove: removeFilter }] =
        useListState<FilterType>([]);
    const [staticResources, setStaticResources] =
        useState<ClientResource[]>(resources);
    const [providedFilters, setProvidedFilters] = useState<FilterType[]>([]);
    const combobox = useCombobox();
    const { t } = useTranslation();

    useEffect(() => {
        if (filters.length > 0) {
            let result = resources;

            for (const filter of filters) {
                switch (filter.type) {
                    case "invite":
                        result = result.filter((res) =>
                            filters
                                .map((v) =>
                                    v.type === "invite" ? v.code : null
                                )
                                .filter((v) => v !== null)
                                .includes(res.invite.code)
                        );
                        break;
                    case "service":
                        result = result.filter((res) =>
                            filters
                                .map((v) =>
                                    v.type === "service" ? v.id : null
                                )
                                .filter((v) => v !== null)
                                .includes(res.service.id)
                        );
                        break;
                    case "grant":
                        result = result.filter((res) =>
                            filters
                                .map((v) =>
                                    v.type === "grant" ? v.subtype : null
                                )
                                .filter((v) => v !== null)
                                .includes(res.grant.type as any)
                        );
                        break;
                    case "resource":
                        result = result.filter(
                            (res) =>
                                res.grant.type === "plugin" &&
                                res.grant.result.type === "success" &&
                                res.grant.result.resources.find(
                                    (v) => v.type === filter.subtype
                                ) !== undefined
                        );
                        break;
                }
            }
            onFilter(result);
        } else {
            onFilter(resources);
        }
    }, [filters, onFilter, resources]);

    useEffect(() => {
        if (!isEqual(resources, staticResources)) {
            setStaticResources(resources);
            setProvidedFilters([
                ...Object.values(
                    resources.reduce(
                        (prev, current) =>
                            Object.keys(prev).includes(current.invite.code)
                                ? prev
                                : {
                                      ...prev,
                                      [current.invite.code]: {
                                          type: "invite",
                                          code: current.invite.code,
                                          alias: current.invite.alias,
                                          key: `invite.${current.invite.code}`,
                                      },
                                  },
                        {}
                    )
                ),
                ...Object.values(
                    resources.reduce(
                        (prev, current) =>
                            Object.keys(prev).includes(current.service.id)
                                ? prev
                                : {
                                      ...prev,
                                      [current.service.id]: {
                                          type: "service",
                                          id: current.service.id,
                                          name: current.service.name,
                                          icon: current.service.icon,
                                          key: `service.${current.service.id}`,
                                      },
                                  },
                        {}
                    )
                ),
                ...(["attachment", "message", "plugin"].map((v) => ({
                    type: "grant",
                    subtype: v,
                    key: `grant.${v}`,
                })) as any),
                ...(["account", "file", "url", "generic", "action"].map(
                    (v) => ({
                        type: "resource",
                        subtype: v,
                        key: `resource.${v}`,
                    })
                ) as any),
            ]);
        }
    }, [setProvidedFilters, resources, staticResources]);

    const options: [FilterType["type"], JSX.Element][] = providedFilters.map(
        (item) => {
            const active = filters.map((v) => v.key).includes(item.key);
            return [
                item.type,
                <Combobox.Option
                    value={item.key}
                    key={item.key}
                    active={active}
                >
                    <Group gap="sm">
                        <Checkbox readOnly checked={active} />
                        {item.type === "invite" && (
                            <Group gap="xs">
                                <IconLink size={20} />
                                <span>{item.alias ?? item.code}</span>
                            </Group>
                        )}
                        {item.type === "service" && (
                            <Group gap="xs">
                                <DynamicAvatar
                                    source={item.icon as any}
                                    fallback={IconServer}
                                    size={24}
                                    p={0}
                                    variant="transparent"
                                />
                                <span style={{ transform: "translate(-4px)" }}>
                                    {item.name}
                                </span>
                            </Group>
                        )}
                        {item.type === "grant" && (
                            <Group gap="xs">
                                {item.subtype === "attachment" && (
                                    <IconFile size={20} />
                                )}
                                {item.subtype === "message" && (
                                    <IconArticleFilled size={20} />
                                )}
                                {item.subtype === "plugin" && (
                                    <IconScript size={20} />
                                )}
                                <span>
                                    {t(
                                        `views.invites.filter.grant.${item.subtype}`
                                    )}
                                </span>
                            </Group>
                        )}
                        {item.type === "resource" && (
                            <Group gap="xs">
                                {item.subtype === "account" && (
                                    <IconUser size={20} />
                                )}
                                {item.subtype === "file" && (
                                    <IconFile size={20} />
                                )}
                                {item.subtype === "url" && (
                                    <IconLink size={20} />
                                )}
                                {item.subtype === "generic" && (
                                    <IconCube size={20} />
                                )}
                                {item.subtype === "action" && (
                                    <IconScript size={20} />
                                )}
                                <span>
                                    {t(
                                        `views.invites.filter.resource.${item.subtype}`
                                    )}
                                </span>
                            </Group>
                        )}
                    </Group>
                </Combobox.Option>,
            ];
        }
    );

    const values = filters.map((item, index) => {
        return (
            <Badge size="lg" variant="light" key={item.key}>
                <Group gap="sm">
                    {item.type === "invite" && (
                        <Group gap="xs">
                            <IconLink size={16} />
                            <span>{item.alias ?? item.code}</span>
                        </Group>
                    )}
                    {item.type === "service" && (
                        <Group gap="xs">
                            <DynamicAvatar
                                source={item.icon as any}
                                fallback={IconServer}
                                size={24}
                                variant="transparent"
                                color="primary"
                            />
                            <span style={{ transform: "translate(-4px)" }}>
                                {item.name}
                            </span>
                        </Group>
                    )}
                    {item.type === "grant" && (
                        <Group gap="xs">
                            {item.subtype === "attachment" && (
                                <IconFile size={16} />
                            )}
                            {item.subtype === "message" && (
                                <IconArticleFilled size={16} />
                            )}
                            {item.subtype === "plugin" && (
                                <IconScript size={16} />
                            )}
                            <span>
                                {t(
                                    `views.invites.filter.grant.${item.subtype}`
                                )}
                            </span>
                        </Group>
                    )}
                    {item.type === "resource" && (
                        <Group gap="xs">
                            {item.subtype === "account" && (
                                <IconUser size={16} />
                            )}
                            {item.subtype === "file" && <IconFile size={16} />}
                            {item.subtype === "url" && <IconLink size={16} />}
                            {item.subtype === "generic" && (
                                <IconCube size={16} />
                            )}
                            {item.subtype === "action" && (
                                <IconScript size={16} />
                            )}
                            <span>
                                {t(
                                    `views.invites.filter.resource.${item.subtype}`
                                )}
                            </span>
                        </Group>
                    )}
                    <CloseButton
                        onClick={() => {
                            removeFilter(index);
                        }}
                        variant="transparent"
                        size={20}
                    />
                </Group>
            </Badge>
        );
    });

    return (
        <Combobox
            store={combobox}
            onOptionSubmit={(value) => {
                const result = providedFilters.find((v) => v.key === value);
                if (result) {
                    const index = filters.findIndex((v) => v.key === value);
                    if (index >= 0) {
                        removeFilter(index);
                    } else {
                        appendFilter(result);
                    }
                }
            }}
            withinPortal={false}
        >
            <Combobox.DropdownTarget>
                <PillsInput
                    pointer
                    onClick={() => combobox.toggleDropdown()}
                    leftSection={<IconFilter />}
                    size="md"
                >
                    <PillGroup>
                        {values.length > 0 ? (
                            values
                        ) : (
                            <Input.Placeholder>
                                {t("views.invites.filter.placeholder")}
                            </Input.Placeholder>
                        )}
                        <Combobox.EventsTarget>
                            <PillsInput.Field
                                type="hidden"
                                onBlur={() => combobox.closeDropdown()}
                                onKeyDown={(evt) => {
                                    if (evt.key === "Backspace") {
                                        evt.preventDefault();
                                        removeFilter(filters.length - 1);
                                    }
                                }}
                            />
                        </Combobox.EventsTarget>
                    </PillGroup>
                </PillsInput>
            </Combobox.DropdownTarget>
            <Combobox.Dropdown classNames={{ dropdown: "filter-dropdown" }}>
                <Combobox.Options>
                    <Combobox.Group
                        label={t("views.invites.filter.group.invites")}
                    >
                        {options
                            .filter((v) => v[0] === "invite")
                            .map((v) => v[1])}
                    </Combobox.Group>
                    <Combobox.Group
                        label={t("views.invites.filter.group.services")}
                    >
                        {options
                            .filter((v) => v[0] === "service")
                            .map((v) => v[1])}
                    </Combobox.Group>
                    <Combobox.Group
                        label={t("views.invites.filter.group.grants")}
                    >
                        {options
                            .filter((v) => v[0] === "grant")
                            .map((v) => v[1])}
                    </Combobox.Group>
                    <Combobox.Group
                        label={t("views.invites.filter.group.resources")}
                    >
                        {options
                            .filter((v) => v[0] === "resource")
                            .map((v) => v[1])}
                    </Combobox.Group>
                </Combobox.Options>
            </Combobox.Dropdown>
        </Combobox>
    );
}

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
    const [filteredResources, setFilteredResources] = useState<
        ClientResource[]
    >([]);
    const hydrated = useMemo(() => {
        let result: { [key: string]: HydratedInvite } = {};
        for (const res of filteredResources) {
            if (!Object.keys(result).includes(res.invite.code)) {
                result[res.invite.code] = {
                    ...res.invite,
                    services: {},
                };
            }

            if (
                !Object.keys(result[res.invite.code].services).includes(
                    res.service.id
                )
            ) {
                result[res.invite.code].services[res.service.id] = {
                    ...res.service,
                    grants: {},
                };
            }

            result[res.invite.code].services[res.service.id].grants[
                res.grant.id
            ] = res.grant;
        }
        return result;
    }, [filteredResources]);

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
                <Stack gap="sm" h="100%" style={{ overflowY: "hidden" }}>
                    <ResourceFilter
                        resources={resources}
                        onFilter={setFilteredResources}
                    />
                    {Object.values(hydrated).length > 0 ? (
                        <ScrollAreaAutosize mah="calc(100% - 48px)">
                            <Accordion
                                className="invite-item-list"
                                variant="filled"
                            >
                                <Stack gap="sm">
                                    {Object.values(hydrated).map((inv) => (
                                        <InviteItem
                                            key={inv.code}
                                            invite={inv}
                                        />
                                    ))}
                                </Stack>
                            </Accordion>
                        </ScrollAreaAutosize>
                    ) : (
                        <Center
                            style={{
                                flexGrow: 1,
                            }}
                        >
                            <Badge
                                size="xl"
                                color="gray"
                                variant="light"
                                pl={1}
                            >
                                <Group gap="sm">
                                    <ThemeIcon
                                        color="gray"
                                        variant="light"
                                        radius="xl"
                                    >
                                        <IconMailX size={20} />
                                    </ThemeIcon>
                                    <Text tt="capitalize" ff="monospace">
                                        {t("views.invites.noResults")}
                                    </Text>
                                </Group>
                            </Badge>
                        </Center>
                    )}
                </Stack>
            </Paper>
        </Stack>
    );
}
