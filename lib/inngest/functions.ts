import { inngest } from "@/lib/inngest/client";
import { PERSONALIZED_WELCOME_EMAIL_PROMPT } from "@/lib/inngest/prompts";
import { sendWelcomeEmail } from "@/lib/nodemailer";

export const sendSignUpEmail = inngest.createFunction(
    {
        id: "sign-up-email",
    },
    {
        event: "app/user.created",
    },
    async ({ event, step }) => {
        const userProfile = `
            - Country: ${event.data.country}
            - Investment goals: ${event.data.investmentGoals}
            - Risk tolerance: ${event.data.riskTolerance}
            - Preferred industry: ${event.data.preferredIndustry}
        `;

        const prompt =
            PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
                "{{userProfile}}",
                userProfile
            );

        const response = await step.ai.infer(
            "generate-welcome-intro",
            {
                model: step.ai.models.gemini({
                    model: "gemini-3.5-flash-lite",
                }),
                body: {
                    contents: [
                        {
                            role: "user",
                            parts: [
                                {
                                    text: prompt,
                                },
                            ],
                        },
                    ],
                },
            }
        );

        await step.run("send-welcome-email", async () => {
            const part =
                response.candidates?.[0]?.content?.parts?.[0];

            const introText =
                part &&
                "text" in part &&
                typeof part.text === "string"
                    ? part.text
                    : "Thanks for joining Signalist. You now have the tools to track markets and make smarter moves.";

            const {
                email,
                name,
            } = event.data;

            if (!email || !name) {
                throw new Error(
                    "The user-created event must include an email and name."
                );
            }

            return sendWelcomeEmail({
                email,
                name,
                intro: introText,
            });
        });

        return {
            success: true,
            message: "Welcome email sent successfully",
        };
    }
);