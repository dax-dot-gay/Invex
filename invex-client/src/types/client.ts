import { Invite } from "./invite";
import { PluginField } from "./plugin";

export type RedeemingGrant = {
    plugin: string;
    key: string;
    label: string;
    description: string | null;
    icon: string | null;
    arguments: PluginField[];
    revocable: boolean;
    url: string | null;
    help: string | null;
};

export type RedeemingService = {
    id: string;
    name: string;
    icon: string | null;
    description: string | null;
    additional_grants: number;
    actions: { [key: string]: RedeemingGrant };
};

export type RedeemingInvite = {
    invite: Invite;
    services: RedeemingService[];
};
