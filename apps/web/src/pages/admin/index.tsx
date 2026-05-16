import { assignPromo } from "@/features/promos/actions/assignPromo";
import {
  createPromo,
  CreatePromoData,
} from "@/features/promos/actions/createPromo";
import { deletePromo } from "@/features/promos/actions/deletePromo";
import { fetchPromos } from "@/features/promos/actions/fetchPromos";
import { fetchUsers } from "@/features/promos/actions/fetchUsers";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/shared/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const AdminPage = () => {
  const queryClient = useQueryClient();

  const { data: promos = [], isLoading } = useQuery({
    queryKey: ["promos"],
    queryFn: fetchPromos,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const [newName, setNewName] = useState("");

  const { mutate: handlerCreate } = useMutation({
    mutationFn: (data: CreatePromoData) => createPromo(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["promos"] }),
  });

  async function handleCreate(data: CreatePromoData) {
    handlerCreate(data);
  }

  const { mutate: handlerDelete } = useMutation({
    mutationFn: (id: number) => deletePromo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["promos"] }),
  });

  async function handleDelete(id: number) {
    handlerDelete(id);
  }

  const { mutate: handlerAssign } = useMutation({
    mutationFn: ({ promoId, userId }: { promoId: number; userId: number }) =>
      assignPromo(promoId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  async function handleAssign(promoId: number, userId: number) {
    handlerAssign({ promoId, userId });
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
      <Button onClick={() => handleCreate({ name: newName })}>Créer</Button>

      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <span>
              {user.first_name} {user.last_name}
            </span>

            <Select
              value={user.promoId === null ? "" : String(user.promoId)}
              onValueChange={(value) => handleAssign(parseInt(value), user.id)}
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
