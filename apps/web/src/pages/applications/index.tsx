import { fetchMyApplications } from "@/features/applications/actions/applications.actions";
import { Application } from "@/features/applications/types";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../shared/components/ui/table";
import { EmptyRow } from "@/features/applications/components/empty-row";
import { ExistingRow } from "@/features/applications/components/existing-row";

export const Applications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [rows, setRows] = useState<(Application | null)[]>([]);

  function handleCreated(newApp: Application) {
    setRows((prev) => {
      const updated = [...prev];
      const firstNull = updated.indexOf(null);

      updated[firstNull] = newApp;

      return updated;
    });
  }

  function handleDelete(id: number) {
    setRows((prev) =>
      prev.map((row) => (row !== null && row.id === id ? null : row)),
    );
  }

  useEffect(() => {
    fetchMyApplications()
      .then((data) => {
        setApplications(data);
        const empty_rows = Array(Math.max(0, 50 - data.length)).fill(null);
        setRows([...data, ...empty_rows]);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Entreprise</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date de candidature</TableHead>
            <TableHead>Date de relance</TableHead>
            <TableHead>Issue de la candidature</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) =>
            row === null ? (
              <EmptyRow key={`empty-${index}`} onCreated={handleCreated} />
            ) : (
              <ExistingRow key={row.id} row={row} onDeleted={handleDelete} />
            ),
          )}
        </TableBody>
      </Table>
    </>
  );
};
