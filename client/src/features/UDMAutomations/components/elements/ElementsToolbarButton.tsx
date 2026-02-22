import type { ReactNode } from "react";

type ElementsToolbarButtonProps = {
  icon: ReactNode;
  label?: string;
  onClick: () => void;
  id?: string;
  title?: string;
};

export function ElementsToolbarButton({
  icon,
  label,
  onClick,
  id,
  title,
}: ElementsToolbarButtonProps) {
  const className = label
    ? "flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold tracking-wide duration-200 ease-in-out bg-white border rounded-lg shadow-sm text-slate-600 border-slate-200 hover:bg-slate-900 hover:text-white"
    : "p-2 text-xs transition-all duration-200 ease-in-out rounded-md shadow-sm bg-slate-200 text-slate-900 hover:bg-slate-900 hover:text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      id={id}
      className={className}
      title={title}
    >
      {icon}
      {label ? <span>{label}</span> : null}
    </button>
  );
}
