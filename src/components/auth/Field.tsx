import type { InputHTMLAttributes } from "react";

export function Field({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between gap-3 text-sm font-medium">
        {label}
        {hint}
      </span>
      <input
        {...props}
        className="w-full rounded-xl border border-input bg-secondary/40 px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-brand-blue/60 focus:ring-2 focus:ring-ring/30"
      />
    </label>
  );
}

export function SubmitButton({ children, loading }: { children: React.ReactNode; loading?: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-xl bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}