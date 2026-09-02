"use client";

import {
    type SubmitHandler,
    useForm,
} from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import FooterLink from "@/components/forms/FooterLink";
import InputField from "@/components/forms/InputField";
import { Button } from "@/components/ui/button";
import { signInWithEmail } from "@/lib/actions/auth.actions";

interface SignInFormData {
    email: string;
    password: string;
}

const SignIn = () => {
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: {
            errors,
            isSubmitting,
        },
    } = useForm<SignInFormData>({
        defaultValues: {
            email: "",
            password: "",
        },
        mode: "onBlur",
    });

    const onSubmit: SubmitHandler<SignInFormData> = async (data) => {
        try {
            const result = await signInWithEmail(data);

            if (!result.success) {
                toast.error("Sign in failed", {
                    description:
                        result.error ??
                        "Please check your email and password.",
                });

                return;
            }

            router.push("/");
            router.refresh();
        } catch (error) {
            console.error("Sign in failed:", error);

            toast.error("Sign in failed", {
                description:
                    error instanceof Error
                        ? error.message
                        : "Failed to sign in.",
            });
        }
    };

    return (
        <>
            <h1 className="form-title">
                Welcome back
            </h1>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
                noValidate
            >
                <InputField
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="Enter your email"
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

                <InputField
                    name="password"
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    register={register}
                    error={errors.password}
                    validation={{
                        required: "Password is required",
                        minLength: {
                            value: 8,
                            message:
                                "Password must contain at least 8 characters",
                        },
                    }}
                />

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="yellow-btn mt-5 w-full"
                >
                    {isSubmitting
                        ? "Signing In..."
                        : "Sign In"}
                </Button>

                <FooterLink
                    text="Don't have an account?"
                    linkText="Create an account"
                    href="/sign-up"
                />
            </form>
        </>
    );
};

export default SignIn;