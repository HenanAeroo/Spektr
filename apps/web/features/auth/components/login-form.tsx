import { useAuth } from "../hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Field, FieldLabel, FieldError } from "@/shared/components/ui/field";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

const loginSchema = z.object({
  email: z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
  password: z.string().min(8),
});

type LoginSchema = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { handleLogin, loginWithGoogle, isLoading, error } = useAuth();

  async function onSubmit(data: LoginSchema) {
    await handleLogin(data);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <h2>Se connecter</h2>
      <Field>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input {...form.register("email")} type="email" id="email" />
        <FieldError errors={[form.formState.errors.email]} />
      </Field>
      <Field>
        <FieldLabel>Password</FieldLabel>
        <Input {...form.register("password")} type="password" />
        <FieldError errors={[form.formState.errors.password]} />
      </Field>
      {error && <p>{error}</p>}

      <div className="flex items-center mt-5">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Chargement..." : "Se connecter"}
        </Button>
        <p>ou</p>
        <Button type="button" onClick={() => loginWithGoogle()}>
          Se connecter avec Google
        </Button>
      </div>
    </form>
  );
};

export default LoginForm;
