import Link from "next/link";

interface FooterLinkProps {
    text: string;
    linkText: string;
    href: string;
}

const FooterLink = ({
                        text,
                        linkText,
                        href,
                    }: FooterLinkProps) => {
    return (
        <p className="text-center text-sm text-gray-400">
            {text}{" "}

            <Link
                href={href}
                className="font-medium text-yellow-500 transition-colors hover:text-yellow-400"
            >
                {linkText}
            </Link>
        </p>
    );
};

export default FooterLink;