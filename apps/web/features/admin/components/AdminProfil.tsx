import { changePassword } from "@/features/profile/actions/changePassword";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useAuthContext } from "@/shared/components/auth-provider";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { inputCls, labelCls } from "../constants";
import { Card } from "./Card";

export function AdminProfil() {
  const { user: authUser } = useAuthContext();
  const { profile, loading, saving, handleUpdate } = useProfile();
  const { handleLogout } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdError, setPwdError] = useState<string | null>(null);

  const {
    mutate: submitPasswordChange,
    isPending: pwdPending,
    isSuccess: pwdSuccess,
  } = useMutation({
    mutationFn: () => changePassword(oldPassword, newPassword),
    onSuccess: () => {
      setTimeout(() => handleLogout(), 2000);
    },
    onError: (err: Error) => {
      setPwdError(err.message ?? "Une erreur est survenue.");
    },
  });

  const profileFirstName = profile?.first_name ?? authUser?.first_name ?? "";
  const profileLastName = profile?.last_name ?? authUser?.last_name ?? "";

  const initials = authUser
    ? `${authUser.first_name?.[0] ?? ""}${authUser.last_name?.[0] ?? ""}`.toUpperCase() ||
      "RE"
    : "RE";

  const pwdInvalid =
    pwdPending ||
    !oldPassword ||
    !newPassword ||
    newPassword.length < 8 ||
    newPassword !== confirmPassword;

  if (loading) {
    return (
      <div className="py-[60px] text-center text-gray-400">Chargement…</div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-montserrat font-extrabold text-[22px] text-spektr-dark">
          Mon profil
        </h1>
        <p className="font-source-sans text-[13px] text-gray-500 mt-0.5">
          Informations de votre compte chargé RE
        </p>
      </div>
      <Card>
        <div className="flex items-center gap-5 mb-7 pb-6 border-b border-spektr-border">
          <div className="w-[72px] h-[72px] rounded-full bg-spektr-teal flex items-center justify-center text-2xl font-bold text-white font-montserrat flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1">
            <div className="font-montserrat font-extrabold text-xl text-spektr-dark">
              {profileFirstName} {profileLastName}
            </div>
            <div className="font-source-sans text-[13px] text-gray-400 mt-0.5">
              {profile?.email ?? authUser?.email}
            </div>
            <div className="mt-2">
              <span className="bg-spektr-teal/10 text-spektr-teal text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-spektr-teal/20">
                Chargé RE
              </span>
            </div>
          </div>
          {!editMode && (
            <button
              onClick={() => {
                setFirstName(profileFirstName);
                setLastName(profileLastName);
                setEditMode(true);
              }}
              className="px-4 py-2 rounded-lg border-[1.5px] border-spektr-teal bg-transparent text-spektr-teal font-montserrat font-bold text-[13px] cursor-pointer"
            >
              Modifier
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label htmlFor="re-firstname" className={labelCls}>
              Prénom
            </label>
            {editMode ? (
              <input
                id="re-firstname"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputCls}
              />
            ) : (
              <div className="font-source-sans text-sm font-semibold text-spektr-dark">
                {profileFirstName || "—"}
              </div>
            )}
          </div>
          <div>
            <label htmlFor="re-lastname" className={labelCls}>
              Nom
            </label>
            {editMode ? (
              <input
                id="re-lastname"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputCls}
              />
            ) : (
              <div className="font-source-sans text-sm font-semibold text-spektr-dark">
                {profileLastName || "—"}
              </div>
            )}
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Adresse email</label>
            <div className="font-source-sans text-sm text-gray-500">
              {profile?.email ?? authUser?.email ?? "—"}
            </div>
            <p className="font-source-sans text-xs text-gray-400 mt-0.5">
              L'adresse email ne peut pas être modifiée.
            </p>
          </div>
        </div>

        {editMode && (
          <div className="flex gap-2.5">
            <button
              onClick={() => setEditMode(false)}
              className="px-[18px] py-2.5 rounded-lg border-[1.5px] border-spektr-border bg-white text-gray-500 font-montserrat font-semibold text-[13px] cursor-pointer"
            >
              Annuler
            </button>
            <button
              onClick={async () => {
                await handleUpdate({
                  first_name: firstName,
                  last_name: lastName,
                });
                setEditMode(false);
              }}
              disabled={saving}
              aria-busy={saving}
              className={`px-6 py-2.5 rounded-lg border-none font-montserrat font-bold text-sm text-white ${saving ? "bg-spektr-teal/50 cursor-not-allowed" : "bg-spektr-teal cursor-pointer"}`}
            >
              {saving ? "Enregistrement…" : "Enregistrer les modifications"}
            </button>
          </div>
        )}
      </Card>

      {/* Password change */}
      <Card className="mt-4">
        <h2 className="font-montserrat font-bold text-[15px] text-spektr-dark mb-1.5">
          Sécurité
        </h2>
        <p className="font-source-sans text-[13px] text-gray-500 mb-5">
          Modifiez votre mot de passe. Vous serez déconnecté après confirmation.
        </p>

        {pwdSuccess ? (
          <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-[10px] px-5 py-4 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <div className="font-montserrat font-bold text-sm text-green-600">
                Mot de passe modifié !
              </div>
              <div className="font-source-sans text-[13px] text-green-400 mt-0.5">
                Un email de confirmation a été envoyé. Déconnexion en cours…
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5 max-w-[400px]">
            <div>
              <label className={labelCls}>Mot de passe actuel</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => {
                  setOldPassword(e.target.value);
                  setPwdError(null);
                }}
                placeholder="••••••••"
                className={inputCls}
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className={labelCls}>Nouveau mot de passe</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPwdError(null);
                }}
                placeholder="••••••••"
                className={inputCls}
                autoComplete="new-password"
              />
              {newPassword.length > 0 && newPassword.length < 8 && (
                <p className="font-source-sans text-xs text-amber-600 mt-1">
                  Minimum 8 caractères
                </p>
              )}
            </div>
            <div>
              <label className={labelCls}>
                Confirmer le nouveau mot de passe
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPwdError(null);
                }}
                placeholder="••••••••"
                className={`${inputCls} ${confirmPassword && confirmPassword !== newPassword ? "border-spektr-red focus:border-spektr-red" : ""}`}
                autoComplete="new-password"
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="font-source-sans text-xs text-spektr-red mt-1">
                  Les mots de passe ne correspondent pas
                </p>
              )}
            </div>
            {pwdError && (
              <div className="bg-[#fee2e2] border border-[#fecaca] rounded-lg px-3.5 py-2.5 font-source-sans text-[13px] text-[#dc2626]">
                {pwdError}
              </div>
            )}
            <button
              onClick={() => {
                if (pwdInvalid) return;
                submitPasswordChange();
              }}
              disabled={pwdInvalid}
              className={`px-5 py-2.5 rounded-lg border-none font-montserrat font-bold text-[13px] w-fit ${pwdInvalid ? "bg-spektr-border text-gray-400 cursor-not-allowed" : "bg-spektr-teal text-white cursor-pointer"}`}
            >
              {pwdPending
                ? "Modification en cours…"
                : "🔐 Modifier le mot de passe"}
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
