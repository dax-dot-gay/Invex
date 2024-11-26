import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { theme } from "./util/theme";
import { LocalizationProvider } from "./util/localization";

export function App() {
    return (
        <LocalizationProvider>
            <MantineProvider theme={theme} defaultColorScheme="auto">
                <ModalsProvider>
                    <Notifications />
                </ModalsProvider>
            </MantineProvider>
        </LocalizationProvider>
    );
}
