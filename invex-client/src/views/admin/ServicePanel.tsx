import {
    Box,
    Button,
    Divider,
    Group,
    Paper,
    ScrollArea,
    Stack,
    Text,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconPlus, IconServer } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { ModalTitle } from "../../modals";

export function ServicePanel() {
    const { t } = useTranslation();
    const nums = new Array(100).fill(0);

    return (
        <Group gap="sm" className="admin-panel services" wrap="nowrap">
            <Paper className="service-selector paper-light" p={0}>
                <Stack gap={0} className="service-nav-stack">
                    <Group gap="sm" justify="space-between" p="sm">
                        <IconServer />
                        <Text fw={600}>{t("views.admin.services.header")}</Text>
                    </Group>
                    <Divider />
                    <Box className="service-list">
                        <ScrollArea.Autosize
                            p="sm"
                            className="service-list-scroll"
                        >
                            <Stack gap="xs">
                                {nums.map((_, i) => (
                                    <Paper
                                        shadow="sm"
                                        bg="var(--mantine-color-default)"
                                        p="sm"
                                        key={i}
                                    ></Paper>
                                ))}
                            </Stack>
                        </ScrollArea.Autosize>
                    </Box>
                    <Divider />
                    <Box p="sm">
                        <Button
                            fullWidth
                            justify="space-between"
                            leftSection={<IconPlus />}
                            size="md"
                            onClick={() =>
                                modals.openContextModal({
                                    modal: "addService",
                                    title: (
                                        <ModalTitle
                                            name={t("modals.addService.title")}
                                            icon={IconPlus}
                                        />
                                    ),
                                    innerProps: {},
                                    centered: true,
                                })
                            }
                        >
                            {t("views.admin.services.add")}
                        </Button>
                    </Box>
                </Stack>
            </Paper>
            <Paper className="service-configurator" withBorder p="sm"></Paper>
        </Group>
    );
}
