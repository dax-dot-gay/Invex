import { User } from "./auth";
import { GrantResource } from "./plugin";
import { Service } from "./service";

export type Expiration =
    | {
          uses: number;
      }
    | {
          datetime: number;
      };

export type ResolvedExpiration =
    | {
          type: "never";
      }
    | {
          type: "uses";
          value: number;
      }
    | {
          type: "datetime";
          value: string;
      };

export type GrantResult<T> =
    | {
          type: "success";
          value: T;
      }
    | {
          type: "error";
          code: number;
          reason: string;
      };

export type DbInvite = {
    _id: string;
    code: string;
    created_by: string;
    expires: Expiration | null;
    services: string[];
};

export type InviteGrant = {
    service: string;
    resources: GrantResult<{ [key: string]: GrantResult<GrantResource[]> }>;
};

export type InviteUsage = {
    _id: string;
    user: string;
    invite_id: string;
    invite_code: string;
    grants: InviteGrant[];
};

export type Invite = {
    id: string;
    invite: DbInvite;
    services: Service[];
    usages: InviteUsage[];
    expires: ResolvedExpiration;
};

export type InviteRedemption = {
    user: User;
    usage: InviteUsage;
};
