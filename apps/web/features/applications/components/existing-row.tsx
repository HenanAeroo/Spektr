import { useState } from "react";
import { Application, Outcome, Statut } from "../types";
import {
  deleteApplication,
  updateApplication,
} from "../actions/applications.actions";
import { TableCell, TableRow } from "@/shared/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { Button } from "@/shared/components/ui/button";
import { Calendar } from "@/shared/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

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
  const [statut, setStatut] = useState(row.statut ?? undefined);
  const [outcome, setOutcome] = useState(row.outcome ?? undefined);

  const [applicationDate, setApplicationDate] = useState<Date | undefined>(
    row.date_candidature ? new Date(row.date_candidature) : undefined,
  );
  const [relaunchDate, setRelaunchDate] = useState<Date | undefined>(
    row.date_relance ? new Date(row.date_relance) : undefined,
  );

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

      <TableCell onClick={(e) => e.stopPropagation()}>
        <Select
          value={statut}
          onValueChange={(e) => {
            setStatut(e as Statut);
            updateApplication(row.id, { statut: e as Statut });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A_CONTACTER">À contacter</SelectItem>
            <SelectItem value="ENVOYE">Envoyé</SelectItem>
            <SelectItem value="RELANCE">Relancé</SelectItem>
            <SelectItem value="EN_DISCUSSION">En discussion</SelectItem>
            <SelectItem value="REPONSE_POSITIVE">Réponse positive</SelectItem>
            <SelectItem value="REFUS">Refusé</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>

      <TableCell onClick={(e) => e.stopPropagation()}>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              {applicationDate
                ? applicationDate.toLocaleDateString()
                : "Choisir une date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <Calendar
              mode="single"
              selected={applicationDate}
              onSelect={(date) => {
                setApplicationDate(date);
                updateApplication(row.id, {
                  date_candidature: date?.toISOString(),
                });
              }}
            />
          </PopoverContent>
        </Popover>
      </TableCell>

      <TableCell onClick={(e) => e.stopPropagation()}>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              {relaunchDate
                ? relaunchDate.toLocaleDateString()
                : "Choisir une date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <Calendar
              mode="single"
              selected={relaunchDate}
              onSelect={(date) => {
                setRelaunchDate(date);
                updateApplication(row.id, {
                  date_relance: date?.toISOString(),
                });
              }}
            />
          </PopoverContent>
        </Popover>
      </TableCell>

      <TableCell onClick={(e) => e.stopPropagation()}>
        <Select
          value={outcome}
          onValueChange={(e) => {
            setOutcome(e as Outcome);
            updateApplication(row.id, { outcome: e as Outcome });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Issue" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="RAPPEL">À rappeler</SelectItem>
            <SelectItem value="SANS_REPONSE">Pas de réponse</SelectItem>
            <SelectItem value="ENTRETIEN">Entretien</SelectItem>
            <SelectItem value="DECROCHEE">Alternance/Stage obtenu</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
    </TableRow>
  );
}
