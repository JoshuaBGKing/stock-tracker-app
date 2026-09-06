import Image from "next/image";
import Link from "next/link";

import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";
import { searchStocks } from "@/lib/actions/finnhub.actions";

interface HeaderProps {
    user: {
        id: string;
        name: string;
        email: string;
    };
}

const Header = async ({ user }: HeaderProps) => {
    const initialStocks = await searchStocks();

    return (
        <header className="sticky top-0 z-50 border-b border-gray-800 bg-black">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/">
                    <Image
                        src="/assets/icons/logo.svg"
                        alt="Signalist logo"
                        width={140}
                        height={32}
                        className="h-8 w-auto"
                        priority
                    />
                </Link>

                <nav className="hidden sm:block">
                    <NavItems initialStocks={initialStocks} />
                </nav>

                <UserDropdown user={user} />
            </div>
        </header>
    );
};

export default Header;
