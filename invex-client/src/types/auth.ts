export type User = {
    kind: "user" | "admin";
    id: string;
    username: string;
    email: string | null;
};

export type ServerCustomization = {
    server_name: string | null;
    server_welcome: string | null;
};

export type ConnectionInfo = {
    profile: string;
    request_time: string;
    session: string;
    user: User | null;
    customization: ServerCustomization;
};