export type ServiceGrant =
    | {
          type: "account";
          plugin_id: string;
          options: any;
          url: string | null;
      }
    | {
          type: "attachment";
          file_id: string;
          display_name: string | null;
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
      };

export type Service = {
    _id: string;
    name: string;
    icon: string | null;
    description: string | null;
    grants: { [key: string]: ServiceGrant };
};
