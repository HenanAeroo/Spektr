"use client";

import { useAuth } from "../hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Field, FieldLabel, FieldError } from "@/shared/components/ui/field";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

const registerSchema = z.object({
  email: z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
  password: z.string().min(8),
  first_name: z.string(),
  last_name: z.string(),
});

type RegisterSchema = z.infer<typeof registerSchema>;

const RegisterForm = () => {
  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      first_name: "",
      last_name: "",
    },
  });

  const { handleRegister, loginWithGoogle, isLoading, error } = useAuth();

  async function onSubmit(data: RegisterSchema) {
    await handleRegister(data);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <h2>S&apos;inscrire</h2>
      <Field>
        <FieldLabel>Email</FieldLabel>
        <Input {...form.register("email")} type="email" />
        <FieldError errors={[form.formState.errors.email]} />
      </Field>
      <Field>
        <FieldLabel>Mot de passe</FieldLabel>
        <Input {...form.register("password")} type="password" />
        <FieldError errors={[form.formState.errors.password]} />
      </Field>
      <Field>
        <FieldLabel>Prénom</FieldLabel>
        <Input {...form.register("first_name")} />
        <FieldError errors={[form.formState.errors.first_name]} />
      </Field>
      <Field>
        <FieldLabel>Nom</FieldLabel>
        <Input {...form.register("last_name")} />
        <FieldError errors={[form.formState.errors.last_name]} />
      </Field>
      {error && <p>{error}</p>}

      <div className="flex items-center mt-5">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Chargement..." : "S'inscrire"}
        </Button>
        <p>ou</p>
        <Button type="button" onClick={() => loginWithGoogle()}>
          S&apos;inscrire avec Google
        </Button>
      </div>
    </form>
  );
};

export default RegisterForm;
