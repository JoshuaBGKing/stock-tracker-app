import nodemailer from "nodemailer";

import {
    NEWS_SUMMARY_EMAIL_TEMPLATE,
    WELCOME_EMAIL_TEMPLATE,
} from "@/lib/nodemailer/templates";

interface WelcomeEmailData {
    email: string;
    name: string;
    intro: string;
}

interface NewsSummaryEmailData {
    email: string;
    date: string;
    newsContent: string;
}

export const transporter =
    nodemailer.createTransport({
        service: "gmail",
        auth: {
            user:
            process.env.NODEMAILER_EMAIL,
            pass:
            process.env
                .NODEMAILER_PASSWORD,
        },
    });

function checkEmailConfiguration(): void {
    if (
        !process.env.NODEMAILER_EMAIL ||
        !process.env.NODEMAILER_PASSWORD
    ) {
        throw new Error(
            "NODEMAILER_EMAIL or NODEMAILER_PASSWORD is missing"
        );
    }
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export const sendWelcomeEmail =
    async ({
               email,
               name,
               intro,
           }: WelcomeEmailData): Promise<void> => {
        checkEmailConfiguration();

        const htmlTemplate =
            WELCOME_EMAIL_TEMPLATE.replace(
                "{{name}}",
                escapeHtml(name)
            ).replace(
                "{{intro}}",
                intro
            );

        await transporter.sendMail({
            from: `"Signalist" <${process.env.NODEMAILER_EMAIL}>`,
            to: email,
            subject:
                "Welcome to Signalist — your stock market toolkit is ready!",
            text: `Welcome to Signalist, ${name}. Your account is ready.`,
            html: htmlTemplate,
        });
    };

export const sendNewsSummaryEmail =
    async ({
               email,
               date,
               newsContent,
           }: NewsSummaryEmailData): Promise<void> => {
        checkEmailConfiguration();

        const htmlTemplate =
            NEWS_SUMMARY_EMAIL_TEMPLATE.replace(
                "{{date}}",
                escapeHtml(date)
            ).replace(
                "{{newsContent}}",
                newsContent
            );

        await transporter.sendMail({
            from: `"Signalist News" <${process.env.NODEMAILER_EMAIL}>`,
            to: email,
            subject: `Market News Summary — ${date}`,
            text: `Your Signalist market news summary for ${date}`,
            html: htmlTemplate,
        });
    };