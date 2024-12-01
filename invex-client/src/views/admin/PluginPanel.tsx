import { Dropzone } from "@mantine/dropzone";
import { PluginsMixin, useApi } from "../../context/net";

export function PluginPanel() {
    const api = useApi(PluginsMixin);
    return (
        <Dropzone
            onDrop={(files) => api.upload_plugin(files[0]).then(console.log)}
        />
    );
}
