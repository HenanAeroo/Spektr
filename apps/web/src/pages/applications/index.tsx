import { fetchMyApplications } from "@/features/applications/actions/fetchMyApplications";
import { Application } from "@/features/applications/types";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../shared/components/ui/table";
import { EmptyRow } from "@/features/applications/components/empty-row";
import { ExistingRow } from "@/features/applications/components/existing-row";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { ApplicationForm } from "@/features/applications/components/application-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteApplication } from "@/features/applications/actions/deleteApplication";
import {
  updateApplication,
  UpdateApplicationData,
} from "@/features/applications/actions/updateApplication";
import { Skeleton } from "@/shared/components/ui/skeleton";

const ApplicationsPage = () => {
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: fetchMyApplications,
  });

  const rows = [
    ...applications,
    ...Array(Math.max(0, 50 - applications.length)).fill(null),
  ];
  const [selectedRow, setSelectedRow] = useState<Application | null>(null);

  function handleCreate(_app: Application) {
    queryClient.invalidateQueries({ queryKey: ["applications"] });
  }

  const { mutate: deleteApp } = useMutation({
    mutationFn: (id: number) => deleteApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  function handleDelete(id: number) {
    deleteApp(id);
  }

  const { mutate: updateApp } = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateApplicationData }) =>
      updateApplication(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["applications"] }),
  });

  function handleUpdated(app: Application) {
    updateApp({ id: app.id, data: app });
  }

  if (isLoading) {
    return (
      <Table>
        <TableBody>
          {Array(10)
            .fill(null)
            .map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    );
  }

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
              <EmptyRow key={`empty-${index}`} onCreated={handleCreate} />
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

export default ApplicationsPage;
