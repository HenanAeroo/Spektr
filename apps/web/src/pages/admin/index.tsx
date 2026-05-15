import { createPromo } from "@/features/promos/actions/createPromo";
import { deletePromo } from "@/features/promos/actions/deletePromo";
import { fetchPromos } from "@/features/promos/actions/fetchPromos";
import { Promo } from "@/features/promos/types";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useEffect, useState } from "react";

const AdminPage = () => {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    fetchPromos().then((data) => setPromos(data));
  }, []);

  async function handleCreate() {
    const promo = await createPromo({ name: newName });
    setPromos((prev) => [...prev, promo]);
    setNewName("");
  }

  async function handleDelete(id: number) {
    await deletePromo(id);
    setPromos((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div>
      <ul>
        {promos.map((promo) => (
          <li key={promo.id}>
            <span>{promo.name}</span>
            <Button onClick={() => handleDelete(promo.id)}>Supprimer</Button>
          </li>
        ))}
      </ul>

      <Input
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        placeholder="Nom de la promo"
      />
      <Button onClick={handleCreate}>Créer</Button>
    </div>
  );
};

export default AdminPage;
