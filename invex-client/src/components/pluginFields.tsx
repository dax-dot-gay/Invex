import { IconQuestionMark } from "@tabler/icons-react";
import { FieldValue, Plugin, PluginField } from "../types/plugin";
import { PasswordField } from "./fields";
import { DynamicAvatar } from "./icon";
import { isArray, isBoolean, isNumber, isString } from "lodash";
import {
    Checkbox,
    Group,
    MultiSelect,
    NumberInput,
    Select,
    Stack,
    Text,
    Textarea,
    TextInput,
} from "@mantine/core";
import { useTranslation } from "react-i18next";

export function PluginFieldElement({
    field,
    value,
    onChange,
    error,
}: {
    field: PluginField;
    value: FieldValue | null;
    onChange: (value: FieldValue | null, valid: boolean) => void;
    error: string | null;
    context: "plugin" | "service" | "invite";
    plugin: Plugin;
    pluginConfig?: { [key: string]: FieldValue };
    serviceConfig?: { [key: string]: FieldValue };
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
            return <>plugin_defined</>;
    }
}

export function PluginFieldForm({
    value,
    onChange,
    fields,
    plugin,
    pluginConfig,
    serviceConfig,
    context,
}: {
    plugin: Plugin;
    fields: PluginField[];
    context: "plugin" | "service" | "invite";
    value: { [key: string]: { value: FieldValue | null; valid: boolean } };
    onChange: (values: {
        [key: string]: { value: FieldValue | null; valid: boolean };
    }) => void;
    pluginConfig?: { [key: string]: FieldValue };
    serviceConfig?: { [key: string]: FieldValue };
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
                        pluginConfig={pluginConfig}
                        serviceConfig={serviceConfig}
                    />
                );
            })}
        </Stack>
    );
}
