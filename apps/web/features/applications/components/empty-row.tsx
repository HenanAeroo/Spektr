import { useState } from "react";
import { Application } from "../types";
import { createApplication } from "../actions/createApplication";
import { TableCell, TableRow } from "@/shared/components/ui/table";

export function EmptyRow({
  onCreated,
}: {
  onCreated: (app: Application) => void;
}) {
  const [value, setValue] = useState("");

  function handleBlur() {
    if (value.trim() === "") return;
    createApplication({ entreprise: value })
      .then((newApp) => onCreated(newApp))
      .catch((err) => console.error("Erreur création : ", err));
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
      <TableCell></TableCell>
      <TableCell></TableCell>
      <TableCell></TableCell>
      <TableCell></TableCell>
    </TableRow>
  );
}
