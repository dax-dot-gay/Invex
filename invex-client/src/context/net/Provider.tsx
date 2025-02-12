import { useLocalStorage } from "@mantine/hooks";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { ConnectionInfo, ServerCustomization, User } from "../../types/auth";
import axios, { AxiosError } from "axios";
import { NetContext } from "./types";

export function NetProvider({
    children,
}: {
    children?: ReactNode | ReactNode[];
}) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState<{ code: number; reason?: any } | null>(
        null
    );
    const [serverCustomization, setServerCustomization] =
        useLocalStorage<ServerCustomization | null>({
            key: "server-customization",
            defaultValue: null,
        });

    const client = useMemo(() => {
        return axios.create({
            baseURL: `${window.location.origin}/api/`,
            timeout: 5000,
        });
    }, []);

    const refresh = useCallback(async () => {
        try {
            const response = await client.get<ConnectionInfo>("/", {
                responseType: "json",
            });
            setError(null);
            setToken(response.data.session);
            setUser(response.data.user);
            setServerCustomization(response.data.customization);
        } catch (e) {
            const error = e as AxiosError;
            setError({ code: error.status ?? 0, reason: error.message });
            setUser(null);
            setToken(null);
        }
    }, [token, user?.id, setToken, setUser, setError]);

    useEffect(() => {
        refresh();
    }, []);

    return (
        <NetContext.Provider
            value={
                token
                    ? user
                        ? {
                              state: {
                                  state: "authed",
                                  token,
                                  user,
                              },
                              axios: client,
                              refresh,
                              customization: serverCustomization,
                          }
                        : {
                              state: {
                                  state: "ready",
                                  token,
                              },
                              axios: client,
                              refresh,
                              customization: serverCustomization,
                          }
                    : error
                    ? {
                          state: {
                              state: "error",
                              code: error.code,
                              reason: error.reason,
                          },
                          refresh,
                          customization: serverCustomization,
                      }
                    : {
                          state: { state: "new" },
                          refresh,
                          customization: serverCustomization,
                      }
            }
        >
            {children}
        </NetContext.Provider>
    );
}
