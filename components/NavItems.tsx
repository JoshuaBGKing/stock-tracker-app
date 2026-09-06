"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import SearchCommand from "@/components/SearchCommand";
import { NAV_ITEMS } from "@/lib/constants";
import type { StockWithWatchlistStatus } from "@/lib/actions/finnhub.actions";

interface NavItemsProps {
    initialStocks?: StockWithWatchlistStatus[];
}

const NavItems = ({
                      initialStocks = [],
                  }: NavItemsProps) => {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === "/") {
            return pathname === "/";
        }

        return pathname.startsWith(path);
    };

    return (
        <ul className="flex flex-col gap-3 p-2 font-medium sm:flex-row sm:gap-10">
            {NAV_ITEMS.map(({ href, label }) => {
                if (href === "/search") {
                    return (
                        <li key="search-trigger">
                            <SearchCommand
                                renderAs="text"
                                label="Search"
                                initialStocks={initialStocks}
                            />
                        </li>
                    );
                }

                return (
                    <li key={href}>
                        <Link
                            href={href}
                            className={`transition-colors hover:text-yellow-500 ${
                                isActive(href)
                                    ? "text-gray-100"
                                    : "text-gray-400"
                            }`}
                        >
                            {label}
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
};

export default NavItems;