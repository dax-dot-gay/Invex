import { IconQuestionMark } from "@tabler/icons-react";
import { FieldParams, FieldValue, Plugin, PluginField } from "../types/plugin";
import { PasswordField } from "./fields";
import { DynamicAvatar } from "./icon";
import { isArray, isBoolean, isNumber, isString } from "lodash";
import {
    Center,
    Checkbox,
    Group,
    Loader,
    MultiSelect,
    NumberInput,
    Select,
    Stack,
    Text,
    Textarea,
    TextInput,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import { PluginsMixin, useApi } from "../context/net";
import { useEffect, useState } from "react";

export type FieldSelector = Partial<{
    config: string;
    grant: string;
    invite: string;
    service: string;
}>;

function PluginDefinedField(props: {
    field: PluginField;
    pluginDefined: Extract<FieldParams, { type: "plugin_defined" }>;
    value: FieldValue | null;
    onChange: (value: FieldValue | null, valid: boolean) => void;
    error: string | null;
    context: "plugin" | "service" | "invite";
    plugin: Plugin;
    selector?: FieldSelector;
}) {
    const api = useApi(PluginsMixin);
    const [result, setResult] = useState<FieldParams | null>(null);

    useEffect(() => {
        switch (props.context) {
            case "plugin":
                api.call_plugin_method(
                    props.plugin.id,
                    "plugin_defined_field",
                    { field_key: props.field.key }
                ).then((r) => setResult(r.or_default(null)));
                break;
            case "service":
                api.call_plugin_method(
                    props.plugin.id,
                    "service_defined_field",
                    {
                        field_key: props.field.key,
                        config_id: props.selector?.config ?? "",
                        grant_id: props.selector?.grant ?? "",
                    }
                ).then((r) => setResult(r.or_default(null)));
                break;
            case "invite":
                api.call_plugin_method(
                    props.plugin.id,
                    "invite_defined_field",
                    {
                        field_key: props.field.key,
                        invite_id: props.selector?.invite ?? "",
                        service_id: props.selector?.service ?? "",
                        grant_id: props.selector?.service ?? "",
                    }
                ).then((r) => setResult(r.or_default(null)));
                break;
        }
    }, [
        props.pluginDefined.context,
        props.pluginDefined.expected_type,
        props.pluginDefined.method,
        setResult,
        api.call_plugin_method,
    ]);

    return result ? (
        <PluginFieldElement
            {...props}
            field={{ ...props.field, field: result }}
        />
    ) : (
        <Center>
            <Loader />
        </Center>
    );
}

export function PluginFieldElement({
    field,
    value,
    onChange,
    error,
    context,
    plugin,
    selector,
}: {
    field: PluginField;
    value: FieldValue | null;
    onChange: (value: FieldValue | null, valid: boolean) => void;
    error: string | null;
    context: "plugin" | "service" | "invite";
    plugin: Plugin;
    selector?: FieldSelector;
}) {
    switch (field.field.type) {
        case "text":
            if (field.field.password) {
                return (
                    <PasswordField
                        className="plugin-field text"
                        error={error}
                        withAsterisk={field.required}
                        label={field.label}
                        placeholder={field.field.placeholder ?? undefined}
                        leftSection={
                            field.icon && (
                                <DynamicAvatar
                                    source={field.icon as any}
                                    fallback={IconQuestionMark}
                                    size={24}
                                    variant="transparent"
                                />
                            )
                        }
                        description={field.description ?? undefined}
                        value={isString(value) ? value : ""}
                        onChange={(event) => {
                            if (
                                field.field.type === "text" &&
                                field.field.validation
                            ) {
                                onChange(
                                    event.target.value,
                                    new RegExp(field.field.validation).test(
                                        event.target.value
                                    )
                                );
                            } else {
                                onChange(event.target.value, true);
                            }
                        }}
                    />
                );
            } else {
                return (
                    <TextInput
                        className="plugin-field text"
                        error={error}
                        withAsterisk={field.required}
                        placeholder={field.field.placeholder ?? undefined}
                        label={field.label}
                        description={field.description ?? undefined}
                        leftSection={
                            field.icon && (
                                <DynamicAvatar
                                    source={field.icon as any}
                                    fallback={IconQuestionMark}
                                    size={24}
                                    variant="transparent"
                                />
                            )
                        }
                        value={isString(value) ? value : ""}
                        onChange={(event) => {
                            if (
                                field.field.type === "text" &&
                                field.field.validation
                            ) {
                                onChange(
                                    event.target.value,
                                    new RegExp(field.field.validation).test(
                                        event.target.value
                                    )
                                );
                            } else {
                                onChange(event.target.value, true);
                            }
                        }}
                    />
                );
            }
        case "number":
            return (
                <NumberInput
                    error={error}
                    className="plugin-field number"
                    withAsterisk={field.required}
                    label={field.label}
                    description={field.description ?? undefined}
                    placeholder={field.field.placeholder ?? undefined}
                    leftSection={
                        field.icon && (
                            <DynamicAvatar
                                source={field.icon as any}
                                fallback={IconQuestionMark}
                                size={24}
                                variant="transparent"
                            />
                        )
                    }
                    value={isNumber(value) || isString(value) ? value : ""}
                    onChange={(value) => onChange(value, true)}
                    min={field.field.min ?? undefined}
                    max={field.field.max ?? undefined}
                    allowNegative={field.field.kind !== "unsigned"}
                    allowDecimal={field.field.kind === "float"}
                />
            );
        case "switch":
            return (
                <Checkbox.Card
                    className="plugin-field switch"
                    radius="sm"
                    checked={isBoolean(value) ? value : false}
                    onClick={() =>
                        onChange(!(isBoolean(value) ? value : false), true)
                    }
                    p="sm"
                    style={{
                        borderColor: (isBoolean(value) ? value : false)
                            ? "var(--mantine-color-primary-filled)"
                            : undefined,
                    }}
                >
                    <Group gap="sm" wrap="nowrap" align="flex-start">
                        <Checkbox.Indicator />
                        <div>
                            <Group gap="sm">
                                {field.icon && (
                                    <DynamicAvatar
                                        source={field.icon as any}
                                        fallback={IconQuestionMark}
                                        size={24}
                                        variant="transparent"
                                    />
                                )}
                                <Text ff="monospace" fw={600} size="lg">
                                    {field.label}
                                </Text>
                            </Group>
                            {field.description && (
                                <Text size="sm" c="dimmed">
                                    {field.description}
                                </Text>
                            )}
                        </div>
                    </Group>
                </Checkbox.Card>
            );
        case "select":
            if (field.field.multiple) {
                return (
                    <MultiSelect
                        error={error}
                        className="plugin-field select"
                        withAsterisk={field.required}
                        label={field.label}
                        description={field.description ?? undefined}
                        leftSection={
                            field.icon && (
                                <DynamicAvatar
                                    source={field.icon as any}
                                    fallback={IconQuestionMark}
                                    size={24}
                                    variant="transparent"
                                />
                            )
                        }
                        value={isArray(value) ? value : []}
                        onChange={(value) => onChange(value, true)}
                        data={field.field.options}
                    />
                );
            } else {
                return (
                    <Select
                        error={error}
                        className="plugin-field select"
                        withAsterisk={field.required}
                        label={field.label}
                        description={field.description ?? undefined}
                        leftSection={
                            field.icon && (
                                <DynamicAvatar
                                    source={field.icon as any}
                                    fallback={IconQuestionMark}
                                    size={24}
                                    variant="transparent"
                                />
                            )
                        }
                        value={isString(value) ? value : null}
                        onChange={(value) => onChange(value, true)}
                        data={field.field.options}
                    />
                );
            }
        case "text_area":
            return (
                <Textarea
                    error={error}
                    className="plugin-field textarea"
                    withAsterisk={field.required}
                    label={field.label}
                    description={field.description ?? undefined}
                    placeholder={field.field.placeholder ?? undefined}
                    leftSection={
                        field.icon && (
                            <DynamicAvatar
                                source={field.icon as any}
                                fallback={IconQuestionMark}
                                size={24}
                                variant="transparent"
                            />
                        )
                    }
                    value={isString(value) ? value : ""}
                    onChange={(event) => onChange(event.target.value, true)}
                    maxRows={field.field.lines ?? undefined}
                />
            );
        case "plugin_defined":
            return (
                <PluginDefinedField
                    value={value}
                    field={field}
                    pluginDefined={field.field}
                    onChange={onChange}
                    error={error}
                    context={context}
                    plugin={plugin}
                    selector={selector}
                />
            );
    }
}

export function PluginFieldForm({
    value,
    onChange,
    fields,
    plugin,
    context,
    selector,
}: {
    plugin: Plugin;
    fields: PluginField[];
    context: "plugin" | "service" | "invite";
    value: { [key: string]: { value: FieldValue | null; valid: boolean } };
    onChange: (values: {
        [key: string]: { value: FieldValue | null; valid: boolean };
    }) => void;
    selector?: FieldSelector;
}) {
    const { t } = useTranslation();
    return (
        <Stack gap="sm" className="plugin-field-form">
            {fields.map((field) => {
                const resolvedValue =
                    (value[field.key]?.value ?? null) === ""
                        ? null
                        : value[field.key]?.value ?? null;
                return (
                    <PluginFieldElement
                        key={field.key}
                        field={field}
                        value={resolvedValue}
                        onChange={(newvalue, valid) =>
                            onChange({
                                ...value,
                                [field.key]: { value: newvalue, valid },
                            })
                        }
                        error={
                            value[field.key] && !value[field.key].valid
                                ? t("errors.form.invalid")
                                : null
                        }
                        plugin={plugin}
                        context={context}
                        selector={selector}
                    />
                );
            })}
        </Stack>
    );
}
