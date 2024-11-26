import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { theme } from "./util/theme";

export function App() {
    return (
        <MantineProvider theme={theme} defaultColorScheme="auto">
            <ModalsProvider></ModalsProvider>
        </MantineProvider>
    );
}
