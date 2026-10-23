interface SpecRow {
  label: string;
  value: string;
}

interface SpecTableProps {
  specs: SpecRow[];
}

export function SpecTable({ specs }: SpecTableProps) {
  return (
    <table className="w-full border-collapse text-left text-sm">
      <tbody className="text-muted-foreground divide-y divide-border">
        {specs.map((row) => (
          <tr key={row.label} className="hover:bg-muted/50">
            <td className="py-3 w-1/3 font-medium text-foreground">
              {row.label}
            </td>
            <td className="py-3">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
