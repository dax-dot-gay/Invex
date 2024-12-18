import { GrantResource } from "./plugin";
import { Service } from "./service";

export type Expiration =
    | {
          uses: number;
      }
    | {
          datetime: string;
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
    resources: { [key: string]: GrantResource[] };
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
};
