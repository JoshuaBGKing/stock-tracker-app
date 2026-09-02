import nodemailer from "nodemailer";

import { WELCOME_EMAIL_TEMPLATE } from "@/lib/nodemailer/templates";

interface WelcomeEmailData {
    email: string;
    name: string;
    intro: string;
}

const emailUser = process.env.NODEMAILER_EMAIL;
const emailPassword = process.env.NODEMAILER_PASSWORD;

if (!emailUser) {
    throw new Error(
        "NODEMAILER_EMAIL must be defined in the .env file"
    );
}

if (!emailPassword) {
    throw new Error(
        "NODEMAILER_PASSWORD must be defined in the .env file"
    );
}

export const transporter = nodemailer.createTransport({
    service: "gmail",

    auth: {
        user: emailUser,
        pass: emailPassword,
    },
});

export const sendWelcomeEmail = async ({
                                           email,
                                           name,
                                           intro,
                                       }: WelcomeEmailData): Promise<void> => {
    const htmlTemplate = WELCOME_EMAIL_TEMPLATE
        .replace("{{name}}", name)
        .replace("{{intro}}", intro);

    const mailOptions = {
        from: `"Signalist" <${emailUser}>`,
        to: email,
        subject:
            "Welcome to Signalist – your stock market toolkit is ready!",
        text: `Welcome to Signalist, ${name}. Thanks for joining us.`,
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
};
