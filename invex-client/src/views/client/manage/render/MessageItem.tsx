import { Paper, ScrollAreaAutosize } from "@mantine/core";
import { MessageGIProps } from "../types";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import remarkToc from "remark-toc";

export function MessageItem({ grant }: MessageGIProps) {
    return (
        <Paper
            p="sm"
            mah="256px"
            style={{ overflow: "hidden", position: "relative" }}
            m="sm"
            bg="var(--mantine-color-default)"
            className="message-grant-item"
        >
            <ScrollAreaAutosize
                style={{
                    overflow: "hidden",
                    maxHeight: "calc(256px - var(--mantine-spacing-sm) * 2)",
                }}
            >
                <Markdown
                    remarkPlugins={[remarkGfm, remarkFrontmatter, remarkToc]}
                >
                    {grant.content}
                </Markdown>
            </ScrollAreaAutosize>
        </Paper>
    );
}
