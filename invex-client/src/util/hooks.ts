import { MantineSize, px, useMantineTheme } from "@mantine/core";
import { useMediaQuery, useViewportSize } from "@mantine/hooks";

export function useMobile() {
    return useMediaQuery("(max-width: 768px)", false) ?? false;
}

export function useBreakpoint(): MantineSize {
    const { width } = useViewportSize();
    const breakpoints: [MantineSize, number][] = Object.entries(
        useMantineTheme().breakpoints
    ).map((v) => [v[0], px(v[1]) as number]) as any;

    for (const [point, size] of breakpoints) {
        if (width < size) {
            return point;
        }
    }

    return "xl";
}