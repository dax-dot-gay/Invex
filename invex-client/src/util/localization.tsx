import { ReactNode, useMemo } from "react";
import { I18nextProvider } from "react-i18next";
import { createInstance } from "i18next";
import * as EN from "../lang/en.json";

export function LocalizationProvider({
    children,
}: {
    children?: ReactNode[] | ReactNode;
}) {
    const instance = useMemo(() => {
        const instance = createInstance({
            fallbackLng: "en",
            interpolation: {
                escapeValue: false,
            },
            resources: {
                en: {
                    translation: EN,
                },
            },
        });
        instance.init();
        return instance;
    }, []);

    return (
        <I18nextProvider i18n={instance} defaultNS="translation">
            {children}
        </I18nextProvider>
    );
}
