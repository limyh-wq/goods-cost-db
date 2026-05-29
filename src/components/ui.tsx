import Link from "next/link";
import { cn } from "@/lib/utils";

/** 가벼운 공용 UI 프리미티브 (radix 의존 없이 Tailwind 만) */

export function Button({
  className,
  variant = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "danger" | "ghost";
}) {
  return (
    <button
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        variant === "default" && "bg-brand text-white hover:bg-blue-700",
        variant === "outline" &&
          "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        variant === "ghost" && "text-gray-700 hover:bg-gray-100",
        className,
      )}
      {...props}
    />
  );
}

export function LinkButton({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof Link> & {
  variant?: "default" | "outline" | "danger" | "ghost";
}) {
  return (
    <Link
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
        variant === "default" && "bg-brand text-white hover:bg-blue-700",
        variant === "outline" &&
          "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        variant === "ghost" && "text-gray-700 hover:bg-gray-100",
        className,
      )}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-9 rounded-md border border-gray-300 bg-white px-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand",
        className,
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  required,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={cn("text-sm font-medium text-gray-700", className)} {...props}>
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

export function MarginBadge({ rate }: { rate: number | null }) {
  if (rate === null) {
    return <span className="text-gray-400">-</span>;
  }
  const tone =
    rate < 0
      ? "bg-red-100 text-red-700"
      : rate < 15
        ? "bg-amber-100 text-amber-700"
        : "bg-emerald-100 text-emerald-700";
  return (
    <span className={cn("rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums", tone)}>
      {rate.toLocaleString("ko-KR", { maximumFractionDigits: 4 })}%
    </span>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
      {children}
    </span>
  );
}
