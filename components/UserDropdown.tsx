'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import NavItems from "@/components/NavItems";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

const UserDropdown = () => {
    const router = useRouter();

    const user = {
        name: "Guest",
        email: "Not Signed In",
    };

    const handleSignOut = () => {
        router.push("/sign-in");
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="flex h-auto items-center gap-3 px-2 text-gray-400 hover:text-yellow-500"
                >
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-yellow-500 text-sm font-bold text-yellow-900">
                            {user.name[0]}
                        </AvatarFallback>
                    </Avatar>

                    <div className="hidden flex-col items-start md:flex">
            <span className="text-base font-medium text-gray-300">
              {user.name}
            </span>
                    </div>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-64 border-gray-700 bg-gray-950 text-gray-300 shadow-xl"
            >
                <DropdownMenuLabel>
                    <div className="flex items-center gap-3 py-2">
                        <Avatar className="h-10 w-10 shrink-0">
                            <AvatarFallback className="bg-yellow-500 text-sm font-bold text-yellow-900">
                                {user.name[0]}
                            </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
              <span className="block text-base font-medium text-gray-200">
                {user.name}
              </span>

                            <span className="block truncate text-sm text-gray-400">
                {user.email}
              </span>
                        </div>
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="bg-gray-700" />

                <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-sm font-medium text-gray-100 transition-colors focus:bg-transparent focus:text-yellow-500"
                >
                    <LogOut className="mr-2 hidden h-4 w-4 sm:block" />
                    Logout
                </DropdownMenuItem>

                <DropdownMenuSeparator className="hidden bg-gray-700 sm:block" />

                <nav className="sm:hidden">
                    <NavItems />
                </nav>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default UserDropdown;