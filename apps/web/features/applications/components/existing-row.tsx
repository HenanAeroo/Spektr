import { useState } from "react";
import { Application } from "../types";
import { deleteApplication } from "../actions/applications.actions";
import { TableCell, TableRow } from "@/shared/components/ui/table";

export function ExistingRow({
  onDeleted,
  row,
}: {
  onDeleted: (id: number) => void;
  row: Application;
}) {
  const [value, setValue] = useState(row.entreprise);

  function handleBlur() {
    if (value.trim() !== "") return;
    deleteApplication(row.id).then(() => onDeleted(row.id));
  }

  return (
    <TableRow>
      <TableCell>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
        />
      </TableCell>
      <TableCell>{row.statut}</TableCell>
      <TableCell>{row.date_candidature}</TableCell>
      <TableCell>{row.date_relance}</TableCell>
      <TableCell>{row.outcome}</TableCell>
    </TableRow>
  );
}
