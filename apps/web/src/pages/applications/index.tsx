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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/shared/components/ui/sheet";
import { ApplicationForm } from "@/features/applications/components/application-form";

export const Applications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [rows, setRows] = useState<(Application | null)[]>([]);
  const [selectedRow, setSelectedRow] = useState<Application | null>(null);

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

  function handleUpdated(updatedApp: Application) {
    setRows((prev) =>
      prev.map((row) =>
        row !== null && row.id === updatedApp.id ? updatedApp : row,
      ),
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
              <ExistingRow
                key={row.id}
                row={row}
                onDeleted={handleDelete}
                onEdit={(row) => setSelectedRow(row)}
              />
            ),
          )}
        </TableBody>
      </Table>
      <Sheet
        open={selectedRow !== null}
        onOpenChange={() => setSelectedRow(null)}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Modifier la candidature</SheetTitle>
          </SheetHeader>
          {selectedRow && (
            <ApplicationForm row={selectedRow} onUpdated={handleUpdated} />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
