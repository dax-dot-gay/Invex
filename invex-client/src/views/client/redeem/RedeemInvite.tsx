import { useNavigate, useParams } from "react-router-dom";
import { ClientMixin, useApi } from "../../../context/net";
import { RedeemingInvite } from "../../../types/client";
import { useEffect, useState } from "react";
import {
    Accordion,
    AccordionControl,
    AccordionItem,
    AccordionPanel,
    Divider,
    Group,
    Indicator,
    Loader,
    Paper,
    ScrollAreaAutosize,
    SimpleGrid,
    Skeleton,
    Stack,
    Text,
    TextInput,
    ThemeIcon,
} from "@mantine/core";
import { useNotifications } from "../../../util/notifications";
import { useTranslation } from "react-i18next";
import { useMobile } from "../../../util/hooks";
import {
    IconAt,
    IconLink,
    IconLock,
    IconUser,
    IconUserPlus,
} from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { PasswordField } from "../../../components/fields";

export function RedeemInviteView() {
    const params = useParams();
    const nav = useNavigate();
    const code = params.code ?? null;
    const api = useApi(ClientMixin);
    const [redeeming, setRedeeming] = useState<RedeemingInvite | null>(null);
    const { error } = useNotifications();
    const { t } = useTranslation();

    const mobile = useMobile();
    const form = useForm<{
        user_creation:
            | {
                  mode: "create";
                  username: string;
                  email: string;
                  password: string;
                  confirm_password: string;
              }
            | {
                  mode: "login";
                  username_or_email: string;
                  password: string;
              }
            | {
                  mode: "inactive";
              };
        services: {
            [service: string]: { [action: string]: { [field: string]: any } };
        };
    }>({
        initialValues: {
            user_creation: {
                mode: "inactive",
            },
            services: {},
        },
    });

    useEffect(() => {
        if (api.ready) {
            api.get_invite_info(code ?? "").then((response) =>
                response.and_then(setRedeeming).or_else((_, reason) => {
                    error(t("errors.network.response", { reason }));
                    nav("/");
                })
            );
        }
    }, [code, api.get_invite_info, nav]);

    useEffect(() => {
        if (
            !api.authenticated &&
            api.ready &&
            form.values.user_creation.mode === "inactive"
        ) {
            form.setFieldValue("user_creation", {
                mode: "create",
                username: "",
                email: "",
                password: "",
                confirm_password: "",
            });
        }
    }, [
        form.setFieldValue,
        api.authenticated,
        api.ready,
        form.values.user_creation.mode,
    ]);

    return redeeming === null ? (
        <Stack align="center" justify="center" h="100%">
            <Loader size="lg" />
        </Stack>
    ) : (
        <Stack className="invite-redeem-stack" p="sm" h="100%">
            <Paper className="paper-light" p="sm">
                <Group gap="sm" wrap="nowrap">
                    <ThemeIcon variant="transparent" color="gray" size="lg">
                        <IconLink />
                    </ThemeIcon>
                    <Divider orientation="vertical" />
                    <Group
                        gap={0}
                        justify="end"
                        style={{ flexGrow: 1 }}
                        pr="sm"
                    >
                        {!mobile && (
                            <Text size="lg" ff="monospace" c="dimmed" fw="bold">
                                {window.location.origin}/inv/
                            </Text>
                        )}
                        <Text size="lg" ff="monospace" fw="bold">
                            {code}
                        </Text>
                    </Group>
                </Group>
            </Paper>
            <Paper
                withBorder
                p="sm"
                className="redemption-form"
                h="100%"
                mah="calc(100% - 75px)"
                style={{ overflow: "hidden" }}
            >
                <ScrollAreaAutosize mah="100%">
                    <Accordion variant="separated" multiple>
                        {form.values.user_creation.mode === "create" && (
                            <AccordionItem value="user.create">
                                <AccordionControl>
                                    <Group gap="md">
                                        <Indicator
                                            disabled={
                                                form.values.user_creation
                                                    .username.length > 0 &&
                                                form.values.user_creation
                                                    .password.length > 0 &&
                                                form.values.user_creation
                                                    .password ===
                                                    form.values.user_creation
                                                        .confirm_password
                                            }
                                            color="red"
                                        >
                                            <ThemeIcon
                                                size="xl"
                                                variant="light"
                                                color="gray"
                                            >
                                                <IconUserPlus />
                                            </ThemeIcon>
                                        </Indicator>
                                        <Text size="xl" fw="600">
                                            {t(
                                                "views.redeem.create_user.title"
                                            )}
                                        </Text>
                                    </Group>
                                </AccordionControl>
                                <AccordionPanel>
                                    <Stack gap="sm">
                                        <SimpleGrid
                                            spacing="sm"
                                            verticalSpacing="sm"
                                            cols={{ base: 1, lg: 2 }}
                                        >
                                            <TextInput
                                                className="dark-input"
                                                withAsterisk
                                                label={t(
                                                    "views.redeem.create_user.username"
                                                )}
                                                leftSection={
                                                    <IconUser size={20} />
                                                }
                                                {...form.getInputProps(
                                                    "user_creation.username"
                                                )}
                                                size="md"
                                            />
                                            <TextInput
                                                className="dark-input"
                                                label={t(
                                                    "views.redeem.create_user.email"
                                                )}
                                                leftSection={
                                                    <IconAt size={20} />
                                                }
                                                {...form.getInputProps(
                                                    "user_creation.email"
                                                )}
                                                size="md"
                                            />
                                        </SimpleGrid>
                                        <PasswordField
                                            className="dark-input"
                                            label={t(
                                                "views.redeem.create_user.password"
                                            )}
                                            withAsterisk
                                            size="md"
                                            leftSection={<IconLock size={20} />}
                                            {...form.getInputProps(
                                                "user_creation.password"
                                            )}
                                        />
                                        <PasswordField
                                            className="dark-input"
                                            label={t(
                                                "views.redeem.create_user.confirm_password"
                                            )}
                                            withAsterisk
                                            size="md"
                                            leftSection={<IconLock size={20} />}
                                            {...form.getInputProps(
                                                "user_creation.confirm_password"
                                            )}
                                        />
                                    </Stack>
                                </AccordionPanel>
                            </AccordionItem>
                        )}
                    </Accordion>
                </ScrollAreaAutosize>
            </Paper>
        </Stack>
    );
}
