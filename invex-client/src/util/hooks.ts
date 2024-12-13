import { MantineSize, px, useMantineTheme } from "@mantine/core";
import { useMediaQuery, useViewportSize } from "@mantine/hooks";
import { useEffect, useState } from "react";

export function useMobile() {
    return useMediaQuery("(max-width: 768px)", false);
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

export function useAsynchronous<T, TArgs extends any[]>(
    callable: (...args: TArgs) => Promise<T>,
    args: TArgs,
    defaultValue?: T | null
): T | null {
    const [result, setResult] = useState<T | null>(defaultValue ?? null);

    useEffect(() => {
        callable(...args)
            .then(setResult)
            .catch(() => setResult(defaultValue ?? null));
    }, [callable, `${args}`, setResult, `${defaultValue}`]);
    return result;
}