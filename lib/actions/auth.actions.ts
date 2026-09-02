"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/better-auth/auth";
import { inngest } from "@/lib/inngest/client";

interface SignUpWithEmailParams {
    email: string;
    password: string;
    fullName: string;
    country: string;
    investmentGoals: string;
    riskTolerance: string;
    preferredIndustry: string;
}

interface SignInWithEmailParams {
    email: string;
    password: string;
}

export const signUpWithEmail = async ({
                                          email,
                                          password,
                                          fullName,
                                          country,
                                          investmentGoals,
                                          riskTolerance,
                                          preferredIndustry,
                                      }: SignUpWithEmailParams) => {
    try {
        const response = await auth.api.signUpEmail({
            body: {
                email,
                password,
                name: fullName,
            },
            headers: await headers(),
        });

        if (!response) {
            return {
                success: false,
                error: "Unable to create the account.",
            };
        }

        await inngest.send({
            name: "app/user.created",
            data: {
                email,
                name: fullName,
                country,
                investmentGoals,
                riskTolerance,
                preferredIndustry,
            },
        });

        return {
            success: true,
            data: response,
        };
    } catch (error) {
        console.error("Sign up failed:", error);

        return {
            success: false,
            error: "Sign up failed. Please try again.",
        };
    }
};

export const signOut = async () => {
    try {
        await auth.api.signOut({
            headers: await headers(),
        });

        return {
            success: true,
        };
    } catch (error) {
        console.error("Sign out failed:", error);

        return {
            success: false,
            error: "Sign out failed. Please try again.",
        };
    }
};

export const signInWithEmail = async ({
                                          email,
                                          password,
                                      }: SignInWithEmailParams) => {
    try {
        const response = await auth.api.signInEmail({
            body: {
                email,
                password,
            },
            headers: await headers(),
        });

        return {
            success: true,
            data: response,
        };
    } catch (error) {
        console.error("Sign in failed:", error);

        return {
            success: false,
            error: "Sign in failed. Please check your email and password.",
        };
    }
};
