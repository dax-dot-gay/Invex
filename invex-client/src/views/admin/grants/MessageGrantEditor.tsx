import { useTranslation } from "react-i18next";
import { Service, ServiceGrant } from "../../../types/service";
import { useForm } from "@mantine/form";
import { Divider, Group, Paper, Stack, TextInput } from "@mantine/core";
import { IconHeading } from "@tabler/icons-react";
import {
    MDXEditor,
    headingsPlugin,
    toolbarPlugin,
    linkPlugin,
    imagePlugin,
    tablePlugin,
    directivesPlugin,
    AdmonitionDirectiveDescriptor,
    quotePlugin,
    markdownShortcutPlugin,
    listsPlugin,
    UndoRedo,
    BoldItalicUnderlineToggles,
    CodeToggle,
    BlockTypeSelect,
    StrikeThroughSupSubToggles,
    ListsToggle,
    InsertImage,
    InsertTable,
    InsertThematicBreak,
    thematicBreakPlugin,
    InsertAdmonition,
    MDXEditorMethods,
    linkDialogPlugin,
} from "@mdxeditor/editor";
import { useEffect, useRef } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import { isEqual } from "lodash";
import { FilesMixin, ServiceMixin, useApi } from "../../../context/net";
import { useNotifications } from "../../../util/notifications";

export function MessageGrantEditor({
    service,
    grant,
    save,
}: {
    id: string;
    service: Service;
    grant: Extract<ServiceGrant, { type: "message" }>;
    save: (grant: ServiceGrant) => Promise<void>;
}) {
    const { t } = useTranslation();
    const form = useForm({
        initialValues: {
            title: grant.title,
            subtitle: grant.subtitle ?? "",
            content: grant.content,
        },
    });
    const editor = useRef<MDXEditorMethods>(null);
    const [debouncedForm] = useDebouncedValue(form.values, 500);
    const api = useApi(ServiceMixin, FilesMixin);
    const { error } = useNotifications();

    useEffect(() => {
        const vals = {
            title: debouncedForm.title,
            subtitle:
                debouncedForm.subtitle.length > 0
                    ? debouncedForm.subtitle
                    : null,
            content: debouncedForm.content,
        };
        if (vals.title.length > 0 && !isEqual(grant, vals)) {
            save({
                ...grant,
                ...vals,
            });
        }
    }, [
        debouncedForm.content,
        debouncedForm.subtitle,
        debouncedForm.title,
        save,
        grant.content,
        grant.subtitle,
        grant.title,
    ]);

    return (
        <Stack gap="sm" mah="100%">
            <Paper className="paper-light" p="sm">
                <Group gap="md" align="center" wrap="nowrap">
                    <IconHeading size={32} />
                    <Stack gap={0} style={{ flexGrow: 1 }}>
                        <TextInput
                            size="lg"
                            fw="600"
                            className="subtle-input"
                            variant="unstyled"
                            placeholder={t(
                                "views.admin.services.config.grants.message.fields.title"
                            )}
                            {...form.getInputProps("title")}
                        />
                        <TextInput
                            size="sm"
                            styles={{
                                input: {
                                    color: "var(--mantine-color-dimmed)",
                                },
                            }}
                            className="subtle-input"
                            variant="unstyled"
                            placeholder={t(
                                "views.admin.services.config.grants.message.fields.subtitle"
                            )}
                            {...form.getInputProps("subtitle")}
                        />
                    </Stack>
                </Group>
            </Paper>
            <MDXEditor
                ref={editor}
                markdown={form.values.content}
                onChange={(v) => form.setFieldValue("content", v)}
                className="mdx-editor-dark dark-theme"
                contentEditableClassName="mdx-content"
                plugins={[
                    directivesPlugin({
                        directiveDescriptors: [AdmonitionDirectiveDescriptor],
                    }),
                    linkPlugin(),
                    linkDialogPlugin(),
                    listsPlugin(),
                    headingsPlugin(),
                    quotePlugin(),
                    markdownShortcutPlugin(),
                    thematicBreakPlugin(),
                    imagePlugin({
                        imageUploadHandler: async (image) => {
                            const uploadResult = (
                                await api.upload_file(image)
                            ).or_default(null);
                            if (uploadResult) {
                                const grantResult = (
                                    await api.createServiceGrant(service._id, {
                                        type: "inline_image",
                                        file_id: uploadResult.id,
                                    })
                                ).or_default(null);
                                if (grantResult) {
                                    return `${location.origin}/api/files/${uploadResult.id}`;
                                }
                            }
                            error(
                                t(
                                    "views.admin.services.config.grants.message.uploadFailed"
                                )
                            );
                            return "https://http.cat/images/418.jpg";
                        },
                    }),
                    tablePlugin(),
                    toolbarPlugin({
                        toolbarClassName: "mdx-toolbar",
                        toolbarContents: () => (
                            <Group gap={0} justify="space-between" w="100%">
                                <Group gap={0}>
                                    <UndoRedo />
                                    <Divider orientation="vertical" />
                                    <BoldItalicUnderlineToggles />
                                    <CodeToggle />
                                    <Divider orientation="vertical" />
                                    <StrikeThroughSupSubToggles />
                                    <Divider orientation="vertical" />
                                    <ListsToggle />
                                    <Divider orientation="vertical" />
                                    <InsertImage />
                                    <InsertTable />
                                    <InsertThematicBreak />
                                    <InsertAdmonition />
                                </Group>
                                <BlockTypeSelect />
                            </Group>
                        ),
                    }),
                ]}
            />
        </Stack>
    );
}
