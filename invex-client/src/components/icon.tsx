import { Avatar, AvatarProps } from "@mantine/core";
import { Icon, IconLoader, IconProps } from "@tabler/icons-react";
import {
    ForwardRefExoticComponent,
    RefAttributes,
    useEffect,
    useState,
} from "react";

export function DynamicIcon({
    icon,
    fallback,
    ...props
}: {
    icon: string;
    fallback?: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
} & Partial<IconProps>) {
    const [Element, setElement] = useState<
        ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>
    >(fallback ?? IconLoader);

    useEffect(() => {
        import(
            `@/node_modules/@tabler/icons-react/dist/esm/icons/${icon}`
        ).then((v) =>
            v ? setElement(v.default) : setElement(fallback ?? IconLoader)
        );
    }, [icon, setElement]);

    return <Element className="dynamic-icon" {...props} />;
}

export function DynamicAvatar({
    source,
    fallback,
    ...props
}: {
    source: `icon:${string}` | `img:${string}`;
    fallback: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
} & Partial<AvatarProps>) {
    const [kind, ...reference] = source.split(":") as [
        "icon" | "img",
        string[]
    ];

    switch (kind) {
        case "icon":
            return (
                <Avatar {...props} radius="sm">
                    <DynamicIcon
                        icon={reference.join(":")}
                        fallback={fallback}
                        size="80%"
                    />
                </Avatar>
            );
        case "img":
            const Fallback = fallback;
            return (
                <Avatar src={reference.join(":")} {...props} radius="sm">
                    <Fallback size="80%" />
                </Avatar>
            );
    }
}
