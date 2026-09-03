import {
    getAllUsersForNewsEmail,
    type UserForNewsEmail,
} from "@/lib/actions/user.actions";
import {
    getNews,
    type MarketNewsArticle,
} from "@/lib/actions/finnhub.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { inngest } from "@/lib/inngest/client";
import {
    NEWS_SUMMARY_EMAIL_PROMPT,
    PERSONALIZED_WELCOME_EMAIL_PROMPT,
} from "@/lib/inngest/prompts";
import {
    sendNewsSummaryEmail,
    sendWelcomeEmail,
} from "@/lib/nodemailer";

function cleanGeneratedHtml(
    value: string
): string {
    return value
        .replace(/^```html\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
}

function createSafeStepId(
    value: string
): string {
    return value.replace(
        /[^a-zA-Z0-9_-]/g,
        "-"
    );
}

export const sendSignUpEmail =
    inngest.createFunction(
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

            const response =
                await step.ai.infer(
                    "generate-welcome-intro",
                    {
                        model: step.ai.models.gemini(
                            {
                                model: "gemini-3.5-flash-lite",
                            }
                        ),
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

            await step.run(
                "send-welcome-email",
                async () => {
                    const part =
                        response.candidates?.[0]
                            ?.content?.parts?.[0];

                    const generatedText =
                        part &&
                        "text" in part &&
                        typeof part.text ===
                        "string"
                            ? part.text
                            : "";

                    const introText =
                        cleanGeneratedHtml(
                            generatedText
                        ) ||
                        "Thanks for joining Signalist. You now have the tools to follow the market and make informed decisions.";

                    const {
                        email,
                        name,
                    } = event.data;

                    if (!email || !name) {
                        throw new Error(
                            "The event must include an email and name"
                        );
                    }

                    await sendWelcomeEmail({
                        email,
                        name,
                        intro: introText,
                    });
                }
            );

            return {
                success: true,
                message:
                    "Welcome email sent successfully",
            };
        }
    );

export const sendDailyNewsSummary =
    inngest.createFunction(
        {
            id: "daily-news-summary",
        },
        [
            {
                event: "app/send.daily.news",
            },
            {
                cron: "TZ=America/Barbados 0 12 * * *",
            },
        ],
        async ({ step }) => {
            const users = await step.run(
                "get-all-users",
                async () => {
                    return getAllUsersForNewsEmail();
                }
            );

            if (
                !users ||
                users.length === 0
            ) {
                return {
                    success: false,
                    message:
                        "No users found for news email",
                    usersFound: 0,
                    emailsSent: 0,
                };
            }

            const userNews = await step.run(
                "fetch-user-news",
                async () => {
                    const results: Array<{
                        user: UserForNewsEmail;
                        articles: MarketNewsArticle[];
                    }> = [];

                    for (const user of users) {
                        try {
                            const symbols =
                                await getWatchlistSymbolsByEmail(
                                    user.email
                                );

                            let articles =
                                await getNews(
                                    symbols
                                );

                            if (
                                articles.length === 0
                            ) {
                                articles =
                                    await getNews();
                            }

                            results.push({
                                user,
                                articles:
                                    articles.slice(
                                        0,
                                        6
                                    ),
                            });
                        } catch (error) {
                            console.error(
                                `Unable to prepare news for ${user.email}:`,
                                error
                            );

                            results.push({
                                user,
                                articles: [],
                            });
                        }
                    }

                    return results;
                }
            );

            const summaries: Array<{
                user: UserForNewsEmail;
                newsContent: string;
            }> = [];

            for (const {
                user,
                articles,
            } of userNews) {
                if (
                    articles.length === 0
                ) {
                    console.warn(
                        `No news found for ${user.email}`
                    );

                    continue;
                }

                try {
                    const prompt =
                        NEWS_SUMMARY_EMAIL_PROMPT.replace(
                            "{{newsData}}",
                            JSON.stringify(
                                articles,
                                null,
                                2
                            )
                        );

                    const safeUserId =
                        createSafeStepId(
                            user.id ||
                            user.email
                        );

                    const response =
                        await step.ai.infer(
                            `summarize-news-${safeUserId}`,
                            {
                                model: step.ai.models.gemini(
                                    {
                                        model: "gemini-3.5-flash-lite",
                                    }
                                ),
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

                    const part =
                        response.candidates?.[0]
                            ?.content?.parts?.[0];

                    const generatedText =
                        part &&
                        "text" in part &&
                        typeof part.text ===
                        "string"
                            ? part.text
                            : "";

                    const newsContent =
                        cleanGeneratedHtml(
                            generatedText
                        );

                    if (newsContent) {
                        summaries.push({
                            user,
                            newsContent,
                        });
                    }
                } catch (error) {
                    console.error(
                        `Unable to summarize news for ${user.email}:`,
                        error
                    );
                }
            }

            let emailsSent = 0;

            for (const {
                user,
                newsContent,
            } of summaries) {
                const safeUserId =
                    createSafeStepId(
                        user.id ||
                        user.email
                    );

                await step.run(
                    `send-news-email-${safeUserId}`,
                    async () => {
                        const date =
                            new Intl.DateTimeFormat(
                                "en-BB",
                                {
                                    dateStyle:
                                        "long",
                                    timeZone:
                                        "America/Barbados",
                                }
                            ).format(
                                new Date()
                            );

                        await sendNewsSummaryEmail({
                            email:
                            user.email,
                            date,
                            newsContent,
                        });
                    }
                );

                emailsSent += 1;
            }

            return {
                success: true,
                message:
                    "Daily news summary completed",
                usersFound: users.length,
                summariesCreated:
                summaries.length,
                emailsSent,
            };
        }
    );