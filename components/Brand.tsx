import Link from "next/link";
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="34"
      height="34"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="12" fill="currentColor" />
      <path
        d="M11 26V18L20 10L29 18V26M11 26L20 18L29 26M20 18V31"
        stroke="var(--logo-line, #fff)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export default function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Stillmark home">
      <BrandMark />
      <span>
        stillmark<span className="brand-period">.</span>
      </span>
    </Link>
  );
}
