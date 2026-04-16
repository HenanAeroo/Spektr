import { useState } from "react";
import { Application } from "../types";
import { deleteApplication } from "../actions/applications.actions";
import { TableCell, TableRow } from "@/shared/components/ui/table";

export function ExistingRow({
  row,
  onDeleted,
  onEdit,
}: {
  row: Application;
  onDeleted: (id: number) => void;
  onEdit: (row: Application) => void;
}) {
  const [value, setValue] = useState(row.entreprise);

  function handleBlur() {
    if (value.trim() !== "") return;
    deleteApplication(row.id).then(() => onDeleted(row.id));
  }

  return (
    <TableRow onClick={() => onEdit(row)}>
      <TableCell>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onClick={(e) => e.stopPropagation()}
        />
      </TableCell>
      <TableCell>{row.statut}</TableCell>
      <TableCell>{row.date_candidature}</TableCell>
      <TableCell>{row.date_relance}</TableCell>
      <TableCell>{row.outcome}</TableCell>
    </TableRow>
  );
}
