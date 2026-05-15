import { assignPromo } from "@/features/promos/actions/assignPromo";
import { createPromo } from "@/features/promos/actions/createPromo";
import { deletePromo } from "@/features/promos/actions/deletePromo";
import { fetchPromos } from "@/features/promos/actions/fetchPromos";
import { fetchUsers } from "@/features/promos/actions/fetchUsers";
import { Promo } from "@/features/promos/types";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/shared/components/ui/select";
import { User } from "@/shared/types";
import { useEffect, useState } from "react";

const AdminPage = () => {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [newName, setNewName] = useState("");
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchPromos().then((data) => setPromos(data));
  }, []);

  useEffect(() => {
    fetchUsers().then((data) => setUsers(data));
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

  async function handleAssign(userId: number, promoId: number) {
    await assignPromo(promoId, userId);

    setUsers((prev) =>
      prev.map((user) => {
        if (user.id === userId) {
          return { ...user, promoId: promoId };
        } else {
          return user;
        }
      }),
    );
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

      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <span>
              {user.first_name} {user.last_name}
            </span>

            <Select
              value={user.promoId === null ? "" : String(user.promoId)}
              onValueChange={(value) => handleAssign(user.id, parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Assigner une promo" />
              </SelectTrigger>
              <SelectContent>
                {promos.map((promo) => (
                  <SelectItem key={promo.id} value={String(promo.id)}>
                    {promo.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminPage;
