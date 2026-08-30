/* eslint-disable @next/next/no-img-element */

'use client';

import { useMemo, useState } from "react";
import type {
    Control,
    FieldError,
    FieldValues,
    Path,
} from "react-hook-form";
import { Controller } from "react-hook-form";
import countryList from "react-select-country-list";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface CountryOption {
    label: string;
    value: string;
}

interface CountrySelectFieldProps<T extends FieldValues> {
    name: Path<T>;
    label: string;
    control: Control<T>;
    error?: FieldError;
    required?: boolean;
}

interface CountryPickerProps {
    value: string;
    onChange: (value: string) => void;
    hasError: boolean;
}

const FlagIcon = ({ code }: { code: string }) => {
    const countryCode = code.toLowerCase();

    return (
        <img
            src={`https://flagcdn.com/w40/${countryCode}.png`}
            srcSet={`https://flagcdn.com/w80/${countryCode}.png 2x`}
            width={20}
            height={14}
            alt={`${code} flag`}
            className="inline-block rounded-sm"
        />
    );
};

const CountryPicker = ({
                           value,
                           onChange,
                           hasError,
                       }: CountryPickerProps) => {
    const [open, setOpen] = useState(false);

    const countries = useMemo(
        () => countryList().getData() as CountryOption[],
        []
    );

    const selectedCountry = countries.find(
        (country) => country.value === value
    );

    return (
        <Popover
            open={open}
            onOpenChange={setOpen}
        >
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    aria-invalid={hasError}
                    className={cn(
                        "h-11 w-full justify-between border-gray-700",
                        "bg-zinc-950 px-3 font-normal text-gray-100",
                        "hover:bg-zinc-900 hover:text-gray-100",
                        {
                            "border-red-500": hasError,
                        }
                    )}
                >
                    {selectedCountry ? (
                        <span className="flex items-center gap-2">
              <FlagIcon code={selectedCountry.value} />
              <span>{selectedCountry.label}</span>
            </span>
                    ) : (
                        <span className="text-gray-500">
              Select your country
            </span>
                    )}

                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="start"
                className="w-[var(--radix-popover-trigger-width)] border-gray-600 bg-gray-800 p-0"
            >
                <Command className="bg-gray-800 text-white">
                    <CommandInput
                        placeholder="Search countries..."
                        className="text-white"
                    />

                    <CommandEmpty className="py-6 text-center text-sm text-gray-400">
                        No country found.
                    </CommandEmpty>

                    <CommandList className="max-h-60">
                        <CommandGroup>
                            {countries.map((country) => (
                                <CommandItem
                                    key={country.value}
                                    value={`${country.label} ${country.value}`}
                                    onSelect={() => {
                                        onChange(country.value);
                                        setOpen(false);
                                    }}
                                    className="cursor-pointer text-white data-[selected=true]:bg-gray-700"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4 text-yellow-500",
                                            value === country.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />

                                    <span className="flex items-center gap-2">
                    <FlagIcon code={country.value} />
                    <span>{country.label}</span>
                  </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

const CountrySelectField = <T extends FieldValues,>({
                                                        name,
                                                        label,
                                                        control,
                                                        error,
                                                        required = false,
                                                    }: CountrySelectFieldProps<T>) => {
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
                    <CountryPicker
                        value={field.value ? String(field.value) : ""}
                        onChange={field.onChange}
                        hasError={Boolean(error)}
                    />
                )}
            />

            {error && (
                <p className="text-sm text-red-500">
                    {error.message}
                </p>
            )}

            <p className="text-xs text-gray-500">
                Helps us show market data and news relevant to you.
            </p>
        </div>
    );
};

export default CountrySelectField;
