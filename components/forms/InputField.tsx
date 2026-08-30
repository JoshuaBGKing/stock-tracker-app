import type {
    FieldError,
    FieldValues,
    Path,
    RegisterOptions,
    UseFormRegister,
} from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FormInputProps<T extends FieldValues> {
    name: Path<T>;
    label: string;
    placeholder?: string;
    type?: string;
    autoComplete?: string;
    register: UseFormRegister<T>;
    error?: FieldError;
    validation?: RegisterOptions<T, Path<T>>;
    disabled?: boolean;
}

const InputField = <T extends FieldValues,>({
                                                name,
                                                label,
                                                placeholder,
                                                type = "text",
                                                autoComplete,
                                                register,
                                                error,
                                                validation,
                                                disabled = false,
                                            }: FormInputProps<T>) => {
    return (
        <div className="space-y-2">
            <Label
                htmlFor={name}
                className="text-sm font-medium text-gray-300"
            >
                {label}
            </Label>

            <Input
                id={name}
                type={type}
                placeholder={placeholder}
                autoComplete={autoComplete}
                disabled={disabled}
                aria-invalid={Boolean(error)}
                className={cn(
                    "h-11 w-full border-gray-700 bg-zinc-950 px-3 text-gray-100",
                    "placeholder:text-gray-500",
                    "focus-visible:border-yellow-400 focus-visible:ring-yellow-400/20",
                    {
                        "border-red-500": error,
                        "cursor-not-allowed opacity-50": disabled,
                    }
                )}
                {...register(name, validation)}
            />

            {error && (
                <p className="text-sm text-red-500">
                    {error.message}
                </p>
            )}
        </div>
    );
};

export default InputField;