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
  const [contactName, setContactName] = useState(row.contact_nom ?? undefined);
  const [contactMail, setContactMail] = useState(
    row.contact_email ?? undefined,
  );
  const [contactNumber, setContactNumber] = useState(
    row.contact_tel ?? undefined,
  );
  const [comment, setComment] = useState(row.commentaire ?? undefined);

  function handleSubmit() {
    updateApplication(row.id, {
      contact_nom: contactName,
      contact_email: contactMail,
      contact_tel: contactNumber,
      commentaire: comment,
    }).then((updated) => onUpdated(updated));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
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

      <button type="submit">Enregistrer</button>
    </form>
  );
}
