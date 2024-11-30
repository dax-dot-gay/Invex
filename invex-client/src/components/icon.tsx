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
