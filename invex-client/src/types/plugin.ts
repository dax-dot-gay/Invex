export type PluginCapabilityGrant = {
    type: "grant";
    method: string;
    fields: PluginField[];
};

export type PluginCapabilityRevoke = {
    type: "revoke";
    method: string;
};

export type PluginCapabilityAction = {
    type: "action";
    label: string;
    icon: string | null;
    description: string | null;
    method: string;
    fields: PluginField[];
};

export type PluginCapability =
    | PluginCapabilityGrant
    | PluginCapabilityRevoke
    | PluginCapabilityAction;

export type PluginMeta = {
    id: string;
    name: string;
    capabilities: PluginCapability[];
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
