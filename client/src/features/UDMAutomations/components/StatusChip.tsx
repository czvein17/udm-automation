import type { ReactNode } from "react";

type StatusChipProps = {
  icon: ReactNode;
  label: string;
  variant?: "primary" | "secondary";
};

export function StatusChip({
  icon,
  label,
  variant = "secondary",
}: StatusChipProps) {
  const variantClass =
    variant === "primary"
      ? "automation-chip-primary"
      : "automation-chip-secondary";

  return (
    <span className={`automation-chip ${variantClass}`}>
      {icon}
      {label}
    </span>
  );
}
