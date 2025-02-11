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

export type GrantItemProps = {
    invite: HydratedInvite;
    service: HydratedService;
    id: string;
    grant: ClientResourceGrant;
};

type CGIProps<T extends ClientResourceGrant["type"]> = Omit<
    GrantItemProps,
    "grant"
> & { grant: Extract<ClientResourceGrant, { type: T }> };

export type AttachmentGIProps = CGIProps<"attachment">;
export type MessageGIProps = CGIProps<"message">;
export type PluginGIProps = CGIProps<"plugin">;
