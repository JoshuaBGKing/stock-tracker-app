"use server";

const FINNHUB_BASE_URL =
    process.env.FINNHUB_BASE_URL ??
    "https://finnhub.io/api/v1";

const POPULAR_STOCK_SYMBOLS = [
    "AAPL",
    "MSFT",
    "NVDA",
    "GOOGL",
    "AMZN",
    "META",
    "TSLA",
    "JPM",
    "V",
    "WMT",
];

export interface MarketNewsArticle {
    id: number;
    headline: string;
    summary: string;
    source: string;
    url: string;
    datetime: number;
    category: string;
    related: string;
    image?: string;
}

export interface StockWithWatchlistStatus {
    symbol: string;
    name: string;
    exchange: string;
    type: string;
    isInWatchlist: boolean;
}

interface RawNewsArticle {
    id?: number;
    headline?: string;
    summary?: string;
    source?: string;
    url?: string;
    datetime?: number;
    image?: string;
    category?: string;
    related?: string;
}

interface FinnhubSearchResult {
    symbol: string;
    description: string;
    displaySymbol?: string;
    type: string;
}

interface FinnhubSearchResponse {
    count: number;
    result: FinnhubSearchResult[];
}

interface FinnhubCompanyProfile {
    exchange?: string;
    name?: string;
    ticker?: string;
}

function getFinnhubApiKey(): string {
    const apiKey =
        process.env.FINNHUB_API_KEY ??
        process.env
            .NEXT_PUBLIC_FINNHUB_API_KEY;

    if (!apiKey) {
        throw new Error(
            "FINNHUB_API_KEY is missing"
        );
    }

    return apiKey;
}

function createFinnhubUrl(
    endpoint: string,
    parameters: Record<
        string,
        string | number
    >
): string {
    const baseUrl =
        FINNHUB_BASE_URL.replace(/\/$/, "");

    const url = new URL(
        `${baseUrl}${endpoint}`
    );

    for (const [name, value] of Object.entries(
        parameters
    )) {
        url.searchParams.set(
            name,
            String(value)
        );
    }

    url.searchParams.set(
        "token",
        getFinnhubApiKey()
    );

    return url.toString();
}

export async function fetchJSON<T>(
    url: string,
    revalidateSeconds?: number
): Promise<T> {
    const requestOptions: RequestInit & {
        next?: {
            revalidate: number;
        };
    } =
        typeof revalidateSeconds ===
        "number" &&
        revalidateSeconds > 0
            ? {
                next: {
                    revalidate:
                    revalidateSeconds,
                },
            }
            : {
                cache: "no-store",
            };

    const response = await fetch(
        url,
        requestOptions
    );

    if (!response.ok) {
        const errorBody = await response
            .text()
            .catch(() => "");

        throw new Error(
            `Finnhub request failed (${response.status}): ${errorBody}`
        );
    }

    const data: unknown =
        await response.json();

    if (
        data &&
        typeof data === "object" &&
        "error" in data
    ) {
        const errorMessage = (
            data as {
                error?: unknown;
            }
        ).error;

        if (
            typeof errorMessage === "string"
        ) {
            throw new Error(errorMessage);
        }
    }

    return data as T;
}

function getDateRange(days: number): {
    from: string;
    to: string;
} {
    const endingDate = new Date();
    const startingDate = new Date();

    startingDate.setUTCDate(
        startingDate.getUTCDate() - days
    );

    return {
        from: startingDate
            .toISOString()
            .split("T")[0],
        to: endingDate
            .toISOString()
            .split("T")[0],
    };
}

function isValidArticle(
    article: RawNewsArticle
): boolean {
    return Boolean(
        article.headline &&
        article.url &&
        article.datetime
    );
}

function formatArticle(
    article: RawNewsArticle,
    symbol?: string,
    index = 0
): MarketNewsArticle {
    return {
        id:
            article.id ??
            (article.datetime ?? Date.now()) +
            index,
        headline:
            article.headline ??
            "Market update",
        summary: article.summary ?? "",
        source:
            article.source ?? "Finnhub",
        url: article.url ?? "#",
        datetime: article.datetime ?? 0,
        category:
            article.category ?? "general",
        related:
            article.related ?? symbol ?? "",
        image:
            article.image || undefined,
    };
}

export async function getNews(
    symbols?: string[]
): Promise<MarketNewsArticle[]> {
    try {
        const cleanedSymbols = (
            symbols ?? []
        )
            .map((symbol) =>
                symbol
                    .trim()
                    .toUpperCase()
            )
            .filter(Boolean);

        const maximumArticles = 6;
        const dateRange = getDateRange(5);

        if (cleanedSymbols.length > 0) {
            const newsBySymbol =
                await Promise.all(
                    cleanedSymbols.map(
                        async (symbol) => {
                            try {
                                const url =
                                    createFinnhubUrl(
                                        "/company-news",
                                        {
                                            symbol,
                                            from: dateRange.from,
                                            to: dateRange.to,
                                        }
                                    );

                                const articles =
                                    await fetchJSON<
                                        RawNewsArticle[]
                                    >(
                                        url,
                                        300
                                    );

                                return {
                                    symbol,
                                    articles:
                                        articles.filter(
                                            isValidArticle
                                        ),
                                };
                            } catch (error) {
                                console.error(
                                    `Unable to retrieve news for ${symbol}:`,
                                    error
                                );

                                return {
                                    symbol,
                                    articles:
                                        [] as RawNewsArticle[],
                                };
                            }
                        }
                    )
                );

            const selectedArticles:
                MarketNewsArticle[] = [];

            let articleIndex = 0;

            while (
                selectedArticles.length <
                maximumArticles
                ) {
                let articleAdded = false;

                for (const stockNews of newsBySymbol) {
                    const article =
                        stockNews.articles[
                            articleIndex
                            ];

                    if (!article) {
                        continue;
                    }

                    selectedArticles.push(
                        formatArticle(
                            article,
                            stockNews.symbol,
                            articleIndex
                        )
                    );

                    articleAdded = true;

                    if (
                        selectedArticles.length >=
                        maximumArticles
                    ) {
                        break;
                    }
                }

                if (!articleAdded) {
                    break;
                }

                articleIndex += 1;
            }

            if (
                selectedArticles.length > 0
            ) {
                return selectedArticles.sort(
                    (first, second) =>
                        second.datetime -
                        first.datetime
                );
            }
        }

        // Use general market news when
        // the user has no watchlist.
        const generalNewsUrl =
            createFinnhubUrl("/news", {
                category: "general",
            });

        const generalNews =
            await fetchJSON<
                RawNewsArticle[]
            >(generalNewsUrl, 300);

        const seenArticles =
            new Set<string>();

        const uniqueArticles:
            MarketNewsArticle[] = [];

        for (const article of generalNews) {
            if (!isValidArticle(article)) {
                continue;
            }

            const uniqueKey = `${article.id}-${article.url}-${article.headline}`;

            if (
                seenArticles.has(uniqueKey)
            ) {
                continue;
            }

            seenArticles.add(uniqueKey);

            uniqueArticles.push(
                formatArticle(
                    article,
                    undefined,
                    uniqueArticles.length
                )
            );

            if (
                uniqueArticles.length >=
                maximumArticles
            ) {
                break;
            }
        }

        return uniqueArticles;
    } catch (error) {
        console.error(
            "Unable to retrieve Finnhub news:",
            error
        );

        return [];
    }
}

export async function searchStocks(
    query?: string
): Promise<
    StockWithWatchlistStatus[]
> {
    try {
        const cleanedQuery =
            query?.trim() ?? "";

        if (!cleanedQuery) {
            const profiles =
                await Promise.all(
                    POPULAR_STOCK_SYMBOLS.map(
                        async (symbol) => {
                            try {
                                const url =
                                    createFinnhubUrl(
                                        "/stock/profile2",
                                        {
                                            symbol,
                                        }
                                    );

                                const profile =
                                    await fetchJSON<
                                        FinnhubCompanyProfile
                                    >(
                                        url,
                                        3600
                                    );

                                return {
                                    symbol,
                                    profile,
                                };
                            } catch (error) {
                                console.error(
                                    `Unable to retrieve ${symbol}:`,
                                    error
                                );

                                return {
                                    symbol,
                                    profile: null,
                                };
                            }
                        }
                    )
                );

            return profiles
                .filter(
                    (
                        result
                    ): result is {
                        symbol: string;
                        profile: FinnhubCompanyProfile;
                    } =>
                        result.profile !==
                        null
                )
                .map(
                    ({
                         symbol,
                         profile,
                     }) => ({
                        symbol,
                        name:
                            profile.name ??
                            profile.ticker ??
                            symbol,
                        exchange:
                            profile.exchange ??
                            "US",
                        type: "Common Stock",
                        isInWatchlist:
                            false,
                    })
                );
        }

        const searchUrl =
            createFinnhubUrl("/search", {
                q: cleanedQuery,
            });

        const searchResponse =
            await fetchJSON<
                FinnhubSearchResponse
            >(searchUrl, 1800);

        return (
            searchResponse.result ?? []
        )
            .filter((stock) =>
                Boolean(stock.symbol)
            )
            .map((stock) => ({
                symbol:
                    stock.symbol.toUpperCase(),
                name:
                    stock.description ||
                    stock.symbol.toUpperCase(),
                exchange:
                    stock.displaySymbol ??
                    "US",
                type:
                    stock.type || "Stock",
                isInWatchlist: false,
            }))
            .slice(0, 15);
    } catch (error) {
        console.error(
            "Unable to search stocks:",
            error
        );

        return [];
    }
}