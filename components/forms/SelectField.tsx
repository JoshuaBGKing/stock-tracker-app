import type {
    Control,
    FieldError,
    FieldValues,
    Path,
} from "react-hook-form";
import { Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface SelectOption {
    label: string;
    value: string;
}

interface SelectFieldProps<T extends FieldValues> {
    name: Path<T>;
    label: string;
    placeholder?: string;
    options: SelectOption[];
    control: Control<T>;
    error?: FieldError;
    required?: boolean;
}

const SelectField = <T extends FieldValues,>({
                                                 name,
                                                 label,
                                                 placeholder,
                                                 options,
                                                 control,
                                                 error,
                                                 required = false,
                                             }: SelectFieldProps<T>) => {
    return (
        <div className="space-y-2">
            <Label
                htmlFor={name}
                className="form-label"
            >
                {label}
            </Label>

            <Controller
                name={name}
                control={control}
                rules={
                    required
                        ? {
                            required: `Please select ${label.toLowerCase()}`,
                        }
                        : undefined
                }
                render={({ field }) => (
                    <Select
                        value={field.value ? String(field.value) : ""}
                        onValueChange={field.onChange}
                    >
                        <SelectTrigger
                            id={name}
                            ref={field.ref}
                            onBlur={field.onBlur}
                            className="select-trigger"
                        >
                            <SelectValue placeholder={placeholder} />
                        </SelectTrigger>

                        <SelectContent className="border-gray-600 bg-gray-800 text-white">
                            {options.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    className="focus:bg-gray-700 focus:text-white"
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            />

            {error && (
                <p className="text-sm text-red-500">
                    {error.message}
                </p>
            )}
        </div>
    );
};

export default SelectField;