import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { theme } from "./util/theme";
import { LocalizationProvider } from "./util/localization";
import { RouterProvider } from "react-router-dom";
import { router } from "./util/routes";
import { NetProvider } from "./context/net";
import { modals } from "./modals";

export function App() {
    return (
        <LocalizationProvider>
            <MantineProvider theme={theme} defaultColorScheme="auto">
                <NetProvider>
                    <ModalsProvider
                        modalProps={{
                            overlayProps: {
                                backgroundOpacity: 0.55,
                                blur: 3,
                            },
                        }}
                        modals={modals}
                    >
                        <Notifications />
                        <RouterProvider router={router} />
                    </ModalsProvider>
                </NetProvider>
            </MantineProvider>
        </LocalizationProvider>
    );
}
