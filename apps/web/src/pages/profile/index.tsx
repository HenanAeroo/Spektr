import { useState } from "react";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useAuthContext } from "@/shared/components/auth-provider";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { changePassword } from "@/features/profile/actions/changePassword";
import { useMutation } from "@tanstack/react-query";

const inputCls =
  "w-full px-3 py-[10px] border-[1.5px] border-spektr-border rounded-lg font-source-sans text-[13px] bg-white text-spektr-dark focus:outline-none focus:border-spektr-teal box-border";

const labelCls =
  "font-montserrat font-semibold text-[11px] text-gray-500 uppercase tracking-[0.5px] block mb-1";

export default function ProfilePage() {
  const { user } = useAuthContext();
  const { profile, loading, saving, handleUpdate } = useProfile();
  const { handleLogout } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [activeSection, setActiveSection] = useState<"profile" | "security">("profile");

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

  const handleStartEdit = () => {
    setFirstName(profile?.first_name ?? "");
    setLastName(profile?.last_name ?? "");
    setEditMode(true);
  };

  const initials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "U"
    : "U";

  const pwdInvalid =
    pwdPending || !oldPassword || !newPassword || newPassword.length < 8 || newPassword !== confirmPassword;

  if (loading) {
    return (
      <div className="py-7 px-8 flex items-center justify-center text-gray-400 min-h-[60vh]">
        Chargement…
      </div>
    );
  }

  return (
    <div className="py-7 px-8 bg-spektr-bg min-h-full">
      <div className="mb-6">
        <h1 className="font-montserrat font-extrabold text-[22px] text-spektr-dark tracking-[-0.3px]">
          Mon profil
        </h1>
        <p className="font-source-sans text-[13px] text-gray-500 mt-0.5">
          Gérez vos informations personnelles et paramètres de compte
        </p>
      </div>

      <div className="grid grid-cols-[200px_1fr] gap-4">
        {/* Nav */}
        <div className="bg-white rounded-[10px] border border-spektr-border p-2 h-fit">
          {(["profile", "security"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={[
                "w-full text-left px-3.5 py-2.5 rounded-lg border-none cursor-pointer font-source-sans text-[13px] mb-0.5",
                activeSection === s
                  ? "bg-spektr-teal/10 text-spektr-teal font-semibold"
                  : "bg-transparent text-gray-500 font-normal",
              ].join(" ")}
            >
              {s === "profile" ? "Mon profil" : "Sécurité"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {activeSection === "profile" && (
            <div className="bg-white rounded-[10px] border border-spektr-border p-7">
              {/* Avatar + info */}
              <div className="flex items-center gap-5 mb-7 pb-6 border-b border-spektr-border">
                <div className="w-[72px] h-[72px] rounded-full bg-spektr-teal flex items-center justify-center text-2xl font-bold text-white font-montserrat flex-shrink-0">
                  {initials}
                </div>
                <div className="flex-1">
                  <div className="font-montserrat font-extrabold text-xl text-spektr-dark">
                    {firstName} {lastName}
                  </div>
                  <div className="font-source-sans text-[13px] text-gray-400 mt-0.5">
                    {profile?.email}
                  </div>
                  <div className="mt-2">
                    <span className="bg-spektr-teal/10 text-spektr-teal text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-spektr-teal/20">
                      Étudiant
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => editMode ? setEditMode(false) : handleStartEdit()}
                  className="px-4 py-2 rounded-lg border-[1.5px] border-spektr-teal bg-transparent text-spektr-teal font-montserrat font-bold text-[13px] cursor-pointer"
                >
                  {editMode ? "Annuler" : "Modifier"}
                </button>
              </div>

              {/* Form */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className={labelCls}>Prénom</label>
                  {editMode ? (
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={inputCls}
                    />
                  ) : (
                    <div className="font-source-sans text-sm font-semibold text-spektr-dark">
                      {firstName || "—"}
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Nom</label>
                  {editMode ? (
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={inputCls}
                    />
                  ) : (
                    <div className="font-source-sans text-sm font-semibold text-spektr-dark">
                      {lastName || "—"}
                    </div>
                  )}
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Adresse email</label>
                  <div className="font-source-sans text-sm text-gray-500">
                    {profile?.email || "—"}
                  </div>
                  <p className="font-source-sans text-xs text-gray-400 mt-0.5">
                    L'adresse email ne peut pas être modifiée.
                  </p>
                </div>
              </div>

              {editMode && (
                <button
                  onClick={async () => {
                    await handleUpdate({ first_name: firstName, last_name: lastName });
                    setEditMode(false);
                  }}
                  disabled={saving}
                  className={[
                    "px-6 py-[11px] rounded-lg border-none font-montserrat font-bold text-sm text-white",
                    saving ? "bg-spektr-teal/50 cursor-not-allowed" : "bg-spektr-teal cursor-pointer",
                  ].join(" ")}
                >
                  {saving ? "Enregistrement…" : "✅ Enregistrer les modifications"}
                </button>
              )}
            </div>
          )}

          {activeSection === "security" && (
            <div className="bg-white rounded-[10px] border border-spektr-border p-7">
              <h2 className="font-montserrat font-bold text-base text-spektr-dark mb-1.5">
                Sécurité
              </h2>
              <p className="font-source-sans text-[13px] text-gray-500 mb-6">
                Modifiez votre mot de passe. Vous serez déconnecté après confirmation.
              </p>

              {pwdSuccess ? (
                <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-[10px] px-6 py-5 flex items-center gap-3.5">
                  <span className="text-[28px]">✅</span>
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
                <div className="flex flex-col gap-4 max-w-[400px]">
                  <div>
                    <label className={labelCls}>Mot de passe actuel</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => { setOldPassword(e.target.value); setPwdError(null); }}
                      placeholder="••••••••"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Nouveau mot de passe</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setPwdError(null); }}
                      placeholder="••••••••"
                      className={inputCls}
                    />
                    {newPassword.length > 0 && newPassword.length < 8 && (
                      <p className="font-source-sans text-xs text-amber-600 mt-1">Minimum 8 caractères</p>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Confirmer le nouveau mot de passe</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setPwdError(null); }}
                      placeholder="••••••••"
                      className={[
                        inputCls,
                        confirmPassword && confirmPassword !== newPassword
                          ? "border-spektr-red focus:border-spektr-red"
                          : "",
                      ].join(" ")}
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
                    className={[
                      "px-6 py-[11px] rounded-lg border-none font-montserrat font-bold text-sm transition-all",
                      pwdInvalid
                        ? "bg-spektr-border text-gray-400 cursor-not-allowed"
                        : "bg-spektr-teal text-white cursor-pointer",
                    ].join(" ")}
                  >
                    {pwdPending ? "Modification en cours…" : "🔐 Modifier le mot de passe"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
