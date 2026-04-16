import { useState } from "react";
import { Application, Outcome, Statut } from "../types";
import { updateApplication } from "../actions/applications.actions";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { Button } from "@/shared/components/ui/button";
import { Calendar } from "@/shared/components/ui/calendar";

export function ApplicationForm({
  row,
  onUpdated,
}: {
  row: Application;
  onUpdated: (updated: Application) => void;
}) {
  const [statut, setStatut] = useState(row.statut ?? undefined);
  const [outcome, setOutcome] = useState(row.outcome ?? undefined);
  const [contactName, setContactName] = useState(row.contact_nom ?? undefined);
  const [contactMail, setContactMail] = useState(
    row.contact_email ?? undefined,
  );
  const [contactNumber, setContactNumber] = useState(
    row.contact_tel ?? undefined,
  );
  const [comment, setComment] = useState(row.commentaire ?? undefined);
  const [applicationDate, setApplicationDate] = useState<Date | undefined>(
    row.date_candidature ? new Date(row.date_candidature) : undefined,
  );
  const [relaunchDate, setRelaunchDate] = useState<Date | undefined>(
    row.date_relance ? new Date(row.date_relance) : undefined,
  );

  function handleSubmit() {
    updateApplication(row.id, {
      statut,
      outcome,
      contact_nom: contactName,
      contact_email: contactMail,
      contact_tel: contactNumber,
      commentaire: comment,
      date_candidature: applicationDate?.toISOString(),
      date_relance: relaunchDate?.toISOString(),
    }).then((updated) => onUpdated(updated));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <Select value={statut} onValueChange={(e) => setStatut(e as Statut)}>
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
      <Select value={outcome} onValueChange={(e) => setOutcome(e as Outcome)}>
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

      <Input
        value={contactName}
        onChange={(e) => setContactName(e.target.value)}
        placeholder="Nom du contact"
      />
      <Input
        value={contactMail}
        onChange={(e) => setContactMail(e.target.value)}
        placeholder="Email du contact"
      />
      <Input
        value={contactNumber}
        onChange={(e) => setContactNumber(e.target.value)}
        placeholder="Numéro de téléphone du contact"
      />
      <Input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Commentaire"
      />

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
            onSelect={setApplicationDate}
          />
        </PopoverContent>
      </Popover>

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
            onSelect={setRelaunchDate}
          />
        </PopoverContent>
      </Popover>
      <button type="submit">Enregistrer</button>
    </form>
  );
}
