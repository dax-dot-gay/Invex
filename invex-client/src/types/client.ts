import { DbInvite } from "./invite";
import { GrantResource, Plugin, PluginField } from "./plugin";

export type RedeemingGrant = {
    plugin: Plugin;
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
    invite: DbInvite;
    services: RedeemingService[];
};

export type ClientResourceInvite = {
    usage: string;
    code: string;
};

export type ClientResourceService = {
    index: number;
    id: string;
    name: string;
    icon: string | null;
    description: string | null;
};

export type ClientResourcePluginGrant =
    | {
          type: "service_failure";
          code: number;
          reason: string;
      }
    | {
          type: "grant_failure";
          id: string;
          code: number;
          reason: string;
      }
    | {
          type: "success";
          id: string;
          resources: GrantResource[];
          plugin_id: string;
          plugin_name: string;
          plugin_icon: string | null;
          grant_id: string;
          grant_name: string;
          grant_icon: string | null;
      };

export type ClientResourceGrant = { id: string } & (
    | {
          type: "unknown_plugin";
      }
    | {
          type: "plugin";
          plugin_id: string;
          config_id: string;
          grant_id: string;
          url: string | null;
          help: string | null;
          result: ClientResourcePluginGrant;
      }
    | {
          type: "attachment";
          file_id: string;
          display_name: string | null;
          help: string | null;
          preview: boolean;
      }
    | {
          type: "message";
          title: string;
          subtitle: string | null;
          content: string;
      }
    | {
          type: "inline_image";
          file_id: string;
      }
);

export type ClientResource = {
    invite: ClientResourceInvite;
    service: ClientResourceService;
    grant: ClientResourceGrant;
};
