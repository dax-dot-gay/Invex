import { createTheme, Input, Notification, Tooltip } from "@mantine/core";

export const theme = createTheme({
    colors: {
        primary: [
            "#faedff",
            "#edd9f7",
            "#d8b1ea",
            "#c186dd",
            "#ae62d2",
            "#a34bcb",
            "#9d3fc9",
            "#8931b2",
            "#7a2aa0",
            "#6b218d",
        ],
    },
    primaryColor: "primary",
    components: {
        Input: Input.extend({
            defaultProps: {
                variant: "filled",
            },
        }),
        Tooltip: Tooltip.extend({
            defaultProps: {
                zIndex: 600,
            },
        }),
        Notification: Notification.extend({
            defaultProps: {
                bg: "var(--mantine-color-default)",
            },
        }),
    },
});
