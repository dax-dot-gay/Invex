export type GrantAction = {
    key: string;
    method: string;
    label: string;
    options: PluginField[];
    arguments: PluginField[];
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
          kind: "integer" | "float" | "unsigned";
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
          placeholder: string | null;
      }
    | {
          type: "plugin_defined";
          method: string;
          context: "plugin" | "service" | "invite";
          expected_type:
              | "string"
              | "integer"
              | "float"
              | "unsigned"
              | "boolean"
              | "string_array";
      };

export type FieldValue = number | string | boolean | string[];

export type PluginField = {
    key: string;
    label: string;
    description: string | null;
    field: FieldParams;
    icon: string | null;
    required: boolean;
    default: FieldValue | null;
};

export type Plugin = {
    id: string;
    metadata: PluginMeta;
    url: string | null;
    enabled: boolean;
};

export type PluginConfig = {
    _id: string;
    plugin: string;
    icon: string | null;
    name: string;
    options: { [key: string]: FieldValue };
};

export type ValidatedArgument = {
    argument: PluginField;
    valid: boolean;
    value: FieldValue | null;
    previous: FieldValue | null;
};

export type ValidatedForm = {
    valid: boolean;
    arguments: { [key: string]: ValidatedArgument };
};

export type MethodCall =
    | {
          method: "plugin_defined_field";
          field_key: string;
      }
    | {
          method: "service_defined_field";
          field_key: string;
          config_id: string;
          grant_id: string;
      }
    | {
          method: "invite_defined_field";
          field_key: string;
          invite_id: string;
          service_id: string;
          grant_id: string;
      };

export type MethodReply = {
    plugin_defined_field: FieldParams;
    service_defined_field: FieldParams;
    invite_defined_field: FieldParams;
};

export type MethodResult<T extends MethodCall["method"]> =
    | {
          type: "success";
          data: MethodReply[T];
      }
    | {
          type: "failure";
          code: number;
          reason: string;
      };

export class MethodResponse<T extends MethodCall["method"]> {
    public constructor(private reply: MethodResult<T>) {}

    public ok(call: (value: MethodReply[T]) => void): MethodResponse<T> {
        if (this.reply.type === "success") {
            call(this.reply.data);
        }
        return this;
    }

    public err(
        call: (code: number, reason: string) => void
    ): MethodResponse<T> {
        if (this.reply.type === "failure") {
            call(this.reply.code, this.reply.reason);
        }
        return this;
    }

    public or_default<D = MethodReply[T]>(def: D): MethodReply[T] | D {
        return this.reply.type === "success" ? this.reply.data : def;
    }

    public resolve<S = MethodReply[T], E = MethodReply[T]>(
        success: (value: MethodReply[T]) => S,
        failure: (code: number, reason: string) => E
    ): S | E {
        if (this.reply.type === "success") {
            return success(this.reply.data);
        } else {
            return failure(this.reply.code, this.reply.reason);
        }
    }

    public get successful(): boolean {
        return this.reply.type === "success";
    }
}

export type GrantResource_Account = {
    type: "account";
    id: string;
    user_id: string | null;
    username: string | null;
    email: string | null;
    password: string | null;
    metadata: any | null;
};

export type GrantResource_File = {
    type: "file";
    id: string;
    file_id: string;
    filename: string | null;
    content_type: string | null;
    metadata: any | null;
};

export type GrantResource_Url = {
    type: "url";
    id: string;
    url: string;
    alias: string | null;
    label: string | null;
    metadata: any | null;
};

export type GrantResource_Generic = {
    type: "generic";
    id: string;
    name: string;
    metadata: any | null;
};

export type GrantResource_Action = {
    type: "action";
    id: string;
    metadata: any | null;
    method: string;
    label: string;
    arguments: PluginField[];
    description: string | null;
    icon: string | null;
};

export type GrantResource =
    | GrantResource_Account
    | GrantResource_File
    | GrantResource_Url
    | GrantResource_Generic
    | GrantResource_Action;
    