export type PluginCapability = "create_account" | "delete_account";

export type PluginMeta = {
    id: string;
    name: string;
    capabilities: PluginCapability[];
    version: string;
    author: string | null;
    url: string | null;
    description: string | null;
    icon: string | null;
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
      };

export type PluginField = {
    key: string;
    label: string;
    field: FieldParams;
    icon: string | null;
    width: 1 | 2 | 3;
    required: boolean;
};

export type Plugin = {
    id: string;
    url: string | null;
    enabled: boolean;
    source: {
        id: string;
        filename: string | null;
        content_type: string;
    };
    metadata: PluginMeta;
    fields: PluginField[];
};