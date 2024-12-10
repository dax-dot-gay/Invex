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
    codeBlockPlugin,
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
    CreateLink,
    InsertImage,
    InsertTable,
    InsertThematicBreak,
    thematicBreakPlugin,
    InsertCodeBlock,
    InsertAdmonition,
} from "@mdxeditor/editor";

export function MessageGrantEditor({
    id,
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

    return (
        <Stack gap="sm">
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
                                input: { color: "var(--mantine-color-dimmed)" },
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
                markdown={form.values.content}
                onChange={console.log}
                className="mdx-editor-dark dark-theme"
                plugins={[
                    directivesPlugin({
                        directiveDescriptors: [AdmonitionDirectiveDescriptor],
                    }),
                    linkPlugin(),
                    listsPlugin(),
                    headingsPlugin(),
                    codeBlockPlugin(),
                    quotePlugin(),
                    markdownShortcutPlugin(),
                    thematicBreakPlugin(),
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
                                    <CreateLink />
                                    <InsertImage />
                                    <Divider orientation="vertical" />
                                    <InsertTable />
                                    <InsertThematicBreak />
                                    <InsertCodeBlock />
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
