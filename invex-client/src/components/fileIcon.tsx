import {
    Icon,
    IconBook2,
    IconCube,
    IconFile,
    IconFileCode,
    IconFileDigit,
    IconFileSpreadsheet,
    IconFileText,
    IconFileTypeCss,
    IconFileTypeHtml,
    IconFileTypeJpg,
    IconFileTypeJs,
    IconFileTypeJsx,
    IconFileTypePhp,
    IconFileTypePng,
    IconFileTypePpt,
    IconFileTypeXml,
    IconFileVector,
    IconFileWord,
    IconFileZip,
    IconGif,
    IconJson,
    IconLetterCase,
    IconMusic,
    IconPdf,
    IconPhoto,
    IconPlayerPlay,
    IconProps,
    IconSql,
    IconTerminal2,
} from "@tabler/icons-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";

export const SYMBOL_MAP: {
    [key: string]: {
        [key: string]: ForwardRefExoticComponent<
            IconProps & RefAttributes<Icon>
        >;
    } & { _all: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>> };
} = {
    application: {
        json: IconJson,
        pdf: IconPdf,
        msword: IconFileWord,
        ogg: IconMusic,
        "x-httpd-php": IconFileTypePhp,
        rtf: IconFileText,
        "x-bzip": IconFileZip,
        "x-bzip2": IconFileZip,
        "x-csh": IconTerminal2,
        "epub+zip": IconBook2,
        "x-sh": IconTerminal2,
        "x-tar": IconFileZip,
        "xhtml+xml": IconFileTypeHtml,
        xml: IconFileTypeXml,
        "vnd.ms-excel": IconFileSpreadsheet,
        "vnd.openxmlformats-officedocument.spreadsheetml.sheet":
            IconFileSpreadsheet,
        zip: IconFileZip,
        "x-7z-compressed": IconFileZip,
        "octet-stream": IconFileDigit,
        "vnd.sqlite3": IconSql,
        "vnd.ms-powerpoint": IconFileTypePpt,
        _all: IconFileCode,
    },
    image: {
        "svg+xml": IconFileVector,
        gif: IconGif,
        jpeg: IconFileTypeJpg,
        png: IconFileTypePng,
        _all: IconPhoto,
    },
    video: {
        _all: IconPlayerPlay,
    },
    font: {
        _all: IconLetterCase,
    },
    text: {
        plain: IconFileText,
        javascript: IconFileTypeJs,
        jsx: IconFileTypeJsx,
        html: IconFileTypeHtml,
        csv: IconFileSpreadsheet,
        css: IconFileTypeCss,
        _all: IconFileText,
    },
    model: {
        _all: IconCube,
    },
};

export function FileIcon({
    mime,
    ...props
}: { mime: string } & Partial<IconProps>) {
    if (!mime.includes("/")) {
        return <IconFile {...props} />;
    }
    const [head, tail] = mime.split("/", 2);
    const Resolved = SYMBOL_MAP[head]
        ? SYMBOL_MAP[head][tail] ?? SYMBOL_MAP[head]._all
        : IconFile;
    return <Resolved {...props} />;
}
