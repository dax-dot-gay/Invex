import { notifications } from "@mantine/notifications";
import { IconCircleCheckFilled, IconCircleXFilled } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

export function useNotifications() {
    const { t } = useTranslation();

    return {
        success: (message: string) =>
            notifications.show({
                icon: <IconCircleCheckFilled />,
                color: "lime",
                title: t("common.notif.success"),
                message: message,
            }),
        error: (message: string) =>
            notifications.show({
                icon: <IconCircleXFilled />,
                color: "red",
                title: t("common.notif.error"),
                message: message,
            }),
    };
}
