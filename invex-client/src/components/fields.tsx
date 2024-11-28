import { PasswordInput, PasswordInputProps } from "@mantine/core";
import { IconEye, IconEyeClosed } from "@tabler/icons-react";

export function PasswordField(
    props: Omit<PasswordInputProps, "visibilityToggleIcon">
) {
    return (
        <PasswordInput
            {...props}
            visibilityToggleIcon={({ reveal }) =>
                reveal ? <IconEyeClosed size={16} /> : <IconEye size={16} />
            }
        />
    );
}
