'use client';

import {
    type SubmitHandler,
    useForm,
} from "react-hook-form";

import CountrySelectField from "@/components/forms/CountrySelectField";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";
import { Button } from "@/components/ui/button";

interface SignUpFormData {
    fullName: string;
    email: string;
    password: string;
    country: string;
    investmentGoals: string;
    riskTolerance: string;
    preferredIndustry: string;
}

const INVESTMENT_GOALS = [
    {
        label: "Growth",
        value: "Growth",
    },
    {
        label: "Income",
        value: "Income",
    },
    {
        label: "Capital Preservation",
        value: "Capital Preservation",
    },
    {
        label: "Retirement",
        value: "Retirement",
    },
];

const RISK_TOLERANCE_OPTIONS = [
    {
        label: "Low",
        value: "Low",
    },
    {
        label: "Medium",
        value: "Medium",
    },
    {
        label: "High",
        value: "High",
    },
];

const INDUSTRY_OPTIONS = [
    {
        label: "Technology",
        value: "Technology",
    },
    {
        label: "Finance",
        value: "Finance",
    },
    {
        label: "Healthcare",
        value: "Healthcare",
    },
    {
        label: "Energy",
        value: "Energy",
    },
    {
        label: "Consumer Goods",
        value: "Consumer Goods",
    },
];

const SignUp = () => {
    const {
        register,
        control,
        handleSubmit,
        formState: {
            errors,
            isSubmitting,
        },
    } = useForm<SignUpFormData>({
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            country: "AU",
            investmentGoals: "Growth",
            riskTolerance: "",
            preferredIndustry: "",
        },
        mode: "onBlur",
    });

    const onSubmit: SubmitHandler<SignUpFormData> = async (data) => {
        try {
            console.log(data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <>
            <h1 className="mb-6 text-3xl font-semibold text-gray-100">
                Sign Up &amp; Personalize
            </h1>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
                noValidate
            >
                <InputField
                    name="fullName"
                    label="Full Name"
                    placeholder="John Doe"
                    autoComplete="name"
                    register={register}
                    error={errors.fullName}
                    validation={{
                        required: "Full name is required",
                        minLength: {
                            value: 2,
                            message: "Full name must contain at least 2 characters",
                        },
                    }}
                />

                <InputField
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="Enter your email"
                    autoComplete="email"
                    register={register}
                    error={errors.email}
                    validation={{
                        required: "Email is required",
                        pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Enter a valid email address",
                        },
                    }}
                />

                <CountrySelectField
                    name="country"
                    label="Country"
                    control={control}
                    error={errors.country}
                    required
                />

                <InputField
                    name="password"
                    label="Password"
                    type="password"
                    placeholder="Enter a strong password"
                    autoComplete="new-password"
                    register={register}
                    error={errors.password}
                    validation={{
                        required: "Password is required",
                        minLength: {
                            value: 8,
                            message: "Password must contain at least 8 characters",
                        },
                    }}
                />

                <SelectField
                    name="investmentGoals"
                    label="Investment Goals"
                    placeholder="Select your investment goal"
                    options={INVESTMENT_GOALS}
                    control={control}
                    error={errors.investmentGoals}
                    required
                />

                <SelectField
                    name="riskTolerance"
                    label="Risk Tolerance"
                    placeholder="Select your risk level"
                    options={RISK_TOLERANCE_OPTIONS}
                    control={control}
                    error={errors.riskTolerance}
                    required
                />

                <SelectField
                    name="preferredIndustry"
                    label="Preferred Industry"
                    placeholder="Select your preferred industry"
                    options={INDUSTRY_OPTIONS}
                    control={control}
                    error={errors.preferredIndustry}
                    required
                />

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-5 h-11 w-full bg-yellow-400 font-medium text-black hover:bg-yellow-500"
                >
                    {isSubmitting
                        ? "Creating Account..."
                        : "Start Your Investing Journey"}
                </Button>
            </form>
        </>
    );
};

export default SignUp;