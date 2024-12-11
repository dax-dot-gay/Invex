export type GrantAction = {
    key: string;
    method: string;
    label: string;
    arguments: FieldParams[];
    description: string | null;
    icon: string | null;
    revoke_method: string | null;
};

export type PluginMeta = {
    id: string;
    name: string;
    grants: GrantAction[];
    version: string;
    author: string | null;
    url: string | null;
    description: string | null;
    icon: string | null;
    config: PluginField[];
};

export type FieldParams =
    | {
          type: "text";
          placeholder: string | null;
          password: boolean;
          validation: string | null;
      }
    | {
          type: "number";
          placeholder: string | null;
          min: number | null;
          max: number | null;
      }
    | {
          type: "switch";
      }
    | {
          type: "select";
          options: (string | { value: string; label: string })[];
          multiple: boolean;
      }
    | {
          type: "text_area";
          lines: number | null;
      }
    | {
          type: "plugin_defined";
          method: string;
          context: "plugin" | "service" | "invite";
      };

export type PluginField = {
    key: string;
    label: string;
    field: FieldParams;
    icon: string | null;
    required: boolean;
};

export type Plugin = {
    id: string;
    metadata: PluginMeta;
    url: string | null;
    enabled: boolean;
};
