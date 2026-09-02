import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Info } from "lucide-react";

interface AuthLayoutProps {
    children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
    return (
        <main className="min-h-screen bg-black text-white lg:grid lg:grid-cols-[45%_55%]">
            {/* Left side: authentication form */}
            <section className="min-h-screen overflow-y-auto px-5 py-5 sm:px-10 lg:max-h-screen lg:px-8 xl:px-14">
                <div className="mx-auto flex min-h-full w-full max-w-xl flex-col">
                    <header className="flex items-center justify-between">
                        <Link href="/" aria-label="Go to homepage">
                            <Image
                                src="/assets/icons/logo.svg"
                                alt="Signalist"
                                width={140}
                                height={32}
                                priority
                            />
                        </Link>

                        <Info
                            className="h-5 w-5 text-gray-500"
                            aria-hidden="true"
                        />
                    </header>

                    <div className="flex flex-1 flex-col justify-center py-8">
                        {children}
                    </div>
                </div>
            </section>

            {/* Right side: only visible on desktop */}
            <section className="relative hidden min-h-screen overflow-hidden border-l border-zinc-800 bg-zinc-950 px-10 pt-10 lg:flex lg:flex-col">
                <div className="relative z-10 max-w-2xl">
                    <blockquote className="text-xl font-medium leading-8 text-gray-100 xl:text-2xl">
                        “Signalist turned my watchlist into a winning list.
                        The alerts are spot-on, and I feel more confident
                        making moves in the market.”
                    </blockquote>

                    <div className="mt-6 flex items-center gap-4">
                        <p className="text-base text-gray-300">
                            — Ethan R., Swing Trader
                        </p>

                        <span
                            className="tracking-wide text-yellow-400"
                            aria-label="Five out of five stars"
                        >
                            ★★★★★
                        </span>
                    </div>
                </div>

                <div className="relative mt-10 min-h-[500px] flex-1">
                    <Image
                        src="/assets/images/dashboard.png"
                        alt="Signalist stock dashboard preview"
                        fill
                        priority
                        sizes="55vw"
                        className="object-cover object-top"
                    />
                </div>
            </section>
        </main>
    );
};

export default AuthLayout;
//