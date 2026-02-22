type TableHeaderProps = {
  required: boolean;
  label: string;
};

export const TableHeader = ({ required, label }: TableHeaderProps) => {
  return (
    <span>
      {label} {required && <span className="ml-1 text-red-500">&#x2A;</span>}
    </span>
  );
};
