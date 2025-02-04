import { ClientResourceGrant } from "../../../types/client";

export type HydratedService = {
    index: number;
    id: string;
    name: string;
    icon: string | null;
    description: string | null;
    grants: { [key: string]: ClientResourceGrant };
};

export type HydratedInvite = {
    usage: string;
    code: string;
    alias: string | null;
    services: { [key: string]: HydratedService };
};
