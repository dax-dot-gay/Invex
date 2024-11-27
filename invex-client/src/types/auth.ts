export type User = {
    type: "User" | "Admin";
    id: string;
    username: string;
};

export type ConnectionInfo = {
    profile: string;
    request_time: string;
    session: string;
    user: User | null;
};
