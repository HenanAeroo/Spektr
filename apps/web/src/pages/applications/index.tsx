import {
  createApplication,
  fetchMyApplications,
} from "@/features/applications/actions/applications.actions";
import { Application } from "@/features/applications/types";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../shared/components/ui/table";

function EmptyRow({ onCreated }: { onCreated: (app: Application) => void }) {
  const [value, setValue] = useState("");

  function handleBlur() {
    if (value.trim() === "") return;
    createApplication({ entreprise: value }).then((newApp) =>
      onCreated(newApp),
    );
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
              <TableRow key={row.id}>
                <TableCell>{row.entreprise}</TableCell>
                <TableCell>{row.statut}</TableCell>
                <TableCell>{row.date_candidature}</TableCell>
                <TableCell>{row.date_relance}</TableCell>
                <TableCell>{row.outcome}</TableCell>
              </TableRow>
            ),
          )}
        </TableBody>
      </Table>
    </>
  );
};
