import { useLocalStorage } from "@mantine/hooks";
import { ReactNode, useCallback, useMemo, useState } from "react";
import { User } from "../../types/auth";
import { Axios } from "axios";

export function NetProvider({
    children,
}: {
    children?: ReactNode | ReactNode[];
}) {
    const [secretKey, setSecretKey] = useLocalStorage<string>({
        key: "secret-key",
        defaultValue: "",
    });
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    const client = useMemo(() => {
        return new Axios({
            baseURL: `${window.location.origin}/api/`,
            timeout: 5000,
            headers:
                secretKey.length > 0
                    ? { "X-Secret-Key": secretKey }
                    : undefined,
        });
    }, [secretKey]);

    const refresh = useCallback(async () => {}, [
        secretKey,
        token,
        user?.id,
        setToken,
        setUser,
    ]);
}
