import {
    ActionIcon,
    ActionIconProps,
    AspectRatio,
    Divider,
    Group,
    Modal,
    Pagination,
    Paper,
    ScrollAreaAutosize,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
    Tooltip,
    useMantineTheme,
} from "@mantine/core";
import { AvatarSource, DynamicAvatar, DynamicIcon } from "./icon";
import { useTranslation } from "react-i18next";
import { useDisclosure, useInputState, useUncontrolled } from "@mantine/hooks";
import {
    IconProps,
    Icon,
    IconPhotoCircle,
    IconSearch,
    IconQuestionMark,
    IconPhotoSearch,
    IconCheck,
} from "@tabler/icons-react";

import iconsList from "@tabler/icons-list";
import {
    ForwardRefExoticComponent,
    RefAttributes,
    useMemo,
    useState,
} from "react";
import { ModalTitle } from "../modals";
import { useBreakpoint } from "../util/hooks";
import { pascalCase } from "change-case";
import { isURL } from "validator";

const COLUMNS = { xs: 8, sm: 10, md: 12, lg: 12, xl: 12 };

export function IconPicker({
    value,
    defaultValue,
    onChange,
    nullIcon,
    iconSize,
    ...props
}: {
    value?: AvatarSource | null;
    defaultValue?: AvatarSource | null;
    onChange?: (value: AvatarSource | null) => void;
    nullIcon?: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    iconSize?: number;
} & Partial<ActionIconProps>) {
    const { t } = useTranslation();
    const [open, { toggle, close }] = useDisclosure(false);
    const [search, setSearch] = useInputState("");
    const [searchPage, setSearchPage] = useState(0);
    const [url, setUrl] = useInputState("");
    const [_value, _onChange] = useUncontrolled({
        value,
        defaultValue,
        onChange,
        finalValue: null,
    });
    const breakpoint = useBreakpoint();
    const perPage = COLUMNS[breakpoint] * 8;
    const icons = useMemo(
        () =>
            Object.entries(iconsList)
                .reduce((prev, current) => {
                    if (
                        Object.keys(current[1].styles ?? {}).includes("filled")
                    ) {
                        return [
                            ...prev,
                            current,
                            [`${current[0]}-filled`, current[1]],
                        ];
                    } else {
                        return [...prev, current];
                    }
                }, [] as any[])
                .sort((a, b) => a[0].localeCompare(b[0])),
        []
    );

    const viewingIcons = useMemo(() => {
        const searchResults = search
            ? icons.filter(
                  (v) =>
                      v[0].toLowerCase().includes(search.toLowerCase()) ||
                      search.toLowerCase().includes(v[0].toLowerCase())
              )
            : icons;
        return searchResults.slice(
            searchPage * perPage,
            (searchPage + 1) * perPage
        );
    }, [search, perPage, searchPage, icons.length]);

    const FallbackIcon = nullIcon ?? IconPhotoCircle;
    const theme = useMantineTheme();
    return (
        <>
            <Tooltip
                position="top"
                withArrow
                color="var(--mantine-color-body)"
                label={t("components.iconPicker.tooltip")}
            >
                <ActionIcon
                    onClick={toggle}
                    {...props}
                    className="icon-picker-button"
                >
                    <DynamicAvatar
                        variant="transparent"
                        source={_value ?? null}
                        fallback={FallbackIcon}
                        size={iconSize}
                    />
                </ActionIcon>
            </Tooltip>
            <Modal
                overlayProps={{
                    zIndex: 400,
                }}
                opened={open}
                onClose={close}
                size="xl"
                className="icon-picker-modal"
                title={
                    <ModalTitle
                        icon={IconPhotoCircle}
                        name={t("components.iconPicker.modal.title")}
                    />
                }
            >
                <Stack gap="sm">
                    <Paper withBorder p={0}>
                        <Stack gap={0}>
                            <TextInput
                                leftSection={<IconSearch />}
                                size="md"
                                value={search}
                                onChange={setSearch}
                                m="sm"
                            />
                            <Divider />
                            <ScrollAreaAutosize mah="256px" p="sm">
                                <SimpleGrid
                                    spacing="xs"
                                    verticalSpacing="xs"
                                    cols={{ base: 4, ...COLUMNS }}
                                    className="icon-list"
                                >
                                    {viewingIcons.map((icon) => (
                                        <Tooltip
                                            label={icon[0]}
                                            withArrow
                                            color="var(--mantine-color-default-hover)"
                                            key={icon[0]}
                                        >
                                            <Paper
                                                p="xs"
                                                bg="var(--mantine-color-default)"
                                                style={
                                                    _value ===
                                                    `icon:Icon${pascalCase(
                                                        icon[0]
                                                    )}`
                                                        ? {
                                                              borderColor:
                                                                  theme.colors
                                                                      .primary[6],
                                                          }
                                                        : undefined
                                                }
                                                className="icon-picker-item"
                                                onClick={() =>
                                                    _value ===
                                                    `icon:Icon${pascalCase(
                                                        icon[0]
                                                    )}`
                                                        ? _onChange(null)
                                                        : _onChange(
                                                              `icon:Icon${pascalCase(
                                                                  icon[0]
                                                              )}`
                                                          )
                                                }
                                            >
                                                <AspectRatio ratio={1}>
                                                    <Stack
                                                        align="center"
                                                        justify="center"
                                                    >
                                                        <DynamicIcon
                                                            icon={pascalCase(
                                                                "icon_" +
                                                                    icon[0]
                                                            )}
                                                            fallback={
                                                                IconQuestionMark
                                                            }
                                                        />
                                                    </Stack>
                                                </AspectRatio>
                                            </Paper>
                                        </Tooltip>
                                    ))}
                                </SimpleGrid>
                            </ScrollAreaAutosize>
                            <Divider />
                            <Group justify="end" p="sm">
                                <Pagination
                                    value={searchPage + 1}
                                    onChange={(v) => setSearchPage(v - 1)}
                                    total={Math.ceil(icons.length / perPage)}
                                />
                            </Group>
                        </Stack>
                    </Paper>
                    <Divider label={t("common.words.or").toUpperCase()} />
                    <Group gap="sm" wrap="nowrap">
                        <TextInput
                            size="md"
                            leftSection={<IconPhotoSearch size={20} />}
                            placeholder={t("components.iconPicker.modal.url")}
                            value={url}
                            onChange={setUrl}
                            style={{ flexGrow: 1 }}
                        />
                        <ActionIcon
                            disabled={!isURL(url)}
                            onClick={() => _onChange(`img:${url}`)}
                            size={42}
                        >
                            <IconCheck />
                        </ActionIcon>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}
