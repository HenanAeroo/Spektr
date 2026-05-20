import { useState } from "react";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useAuthContext } from "@/shared/components/auth-provider";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { changePassword } from "@/features/profile/actions/changePassword";
import { useMutation } from "@tanstack/react-query";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1.5px solid #e8e8e8",
  borderRadius: 8,
  fontFamily: "Source Sans 3, sans-serif",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
  color: "#1d1d1e",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "Montserrat, sans-serif",
  fontWeight: 600,
  fontSize: 11,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  display: "block",
  marginBottom: 4,
};

export default function ProfilePage() {
  const { user } = useAuthContext();
  const { profile, loading, saving, handleUpdate } = useProfile();
  const { handleLogout } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [activeSection, setActiveSection] = useState<"profile" | "security">(
    "profile",
  );

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
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() ||
      "U"
    : "U";

  if (loading) {
    return (
      <div
        style={{
          padding: "28px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#9ca3af",
          minHeight: "60vh",
        }}
      >
        Chargement…
      </div>
    );
  }

  return (
    <div
      style={{ padding: "28px 32px", background: "#f5f5f5", minHeight: "100%" }}
    >
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 800,
            fontSize: 22,
            color: "#1d1d1e",
            letterSpacing: "-0.3px",
          }}
        >
          Mon profil
        </h1>
        <p
          style={{
            fontFamily: "Source Sans 3, sans-serif",
            fontSize: 13,
            color: "#6b7280",
            marginTop: 3,
          }}
        >
          Gérez vos informations personnelles et paramètres de compte
        </p>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16 }}
      >
        {/* Nav */}
        <div
          style={{
            background: "#fff",
            borderRadius: 10,
            border: "1px solid #e8e8e8",
            padding: 8,
            height: "fit-content",
          }}
        >
          {(["profile", "security"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 14px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontFamily: "Source Sans 3, sans-serif",
                fontSize: 13,
                fontWeight: activeSection === s ? 600 : 400,
                background:
                  activeSection === s ? "rgba(35,178,164,0.1)" : "transparent",
                color: activeSection === s ? "#23b2a4" : "#6b7280",
                marginBottom: 2,
              }}
            >
              {s === "profile" ? "Mon profil" : "Sécurité"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {activeSection === "profile" && (
            <div
              style={{
                background: "#fff",
                borderRadius: 10,
                border: "1px solid #e8e8e8",
                padding: 28,
              }}
            >
              {/* Avatar + info */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  marginBottom: 28,
                  paddingBottom: 24,
                  borderBottom: "1px solid #e8e8e8",
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: "#23b2a4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#fff",
                    fontFamily: "Montserrat, sans-serif",
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: "Montserrat, sans-serif",
                      fontWeight: 800,
                      fontSize: 20,
                      color: "#1d1d1e",
                    }}
                  >
                    {firstName} {lastName}
                  </div>
                  <div
                    style={{
                      fontFamily: "Source Sans 3, sans-serif",
                      fontSize: 13,
                      color: "#9ca3af",
                      marginTop: 2,
                    }}
                  >
                    {profile?.email}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <span
                      style={{
                        background: "rgba(35,178,164,0.1)",
                        color: "#23b2a4",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 20,
                        border: "1px solid rgba(35,178,164,0.2)",
                      }}
                    >
                      Étudiant
                    </span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    editMode ? setEditMode(false) : handleStartEdit()
                  }
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "1.5px solid #23b2a4",
                    background: "transparent",
                    color: "#23b2a4",
                    fontFamily: "Montserrat, sans-serif",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {editMode ? "Annuler" : "Modifier"}
                </button>
              </div>

              {/* Form */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                <div>
                  <label style={labelStyle}>Prénom</label>
                  {editMode ? (
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
                      onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")}
                    />
                  ) : (
                    <div
                      style={{
                        fontFamily: "Source Sans 3, sans-serif",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#1d1d1e",
                      }}
                    >
                      {firstName || "—"}
                    </div>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>Nom</label>
                  {editMode ? (
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
                      onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")}
                    />
                  ) : (
                    <div
                      style={{
                        fontFamily: "Source Sans 3, sans-serif",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#1d1d1e",
                      }}
                    >
                      {lastName || "—"}
                    </div>
                  )}
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Adresse email</label>
                  <div
                    style={{
                      fontFamily: "Source Sans 3, sans-serif",
                      fontSize: 14,
                      color: "#6b7280",
                    }}
                  >
                    {profile?.email || "—"}
                  </div>
                  <p
                    style={{
                      fontFamily: "Source Sans 3, sans-serif",
                      fontSize: 12,
                      color: "#9ca3af",
                      marginTop: 3,
                    }}
                  >
                    L'adresse email ne peut pas être modifiée.
                  </p>
                </div>
              </div>

              {editMode && (
                <button
                  onClick={async () => {
                    await handleUpdate({
                      first_name: firstName,
                      last_name: lastName,
                    });
                    setEditMode(false);
                  }}
                  disabled={saving}
                  style={{
                    padding: "11px 24px",
                    borderRadius: 8,
                    border: "none",
                    background: saving ? "#88d5cf" : "#23b2a4",
                    color: "#fff",
                    fontFamily: "Montserrat, sans-serif",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving
                    ? "Enregistrement…"
                    : "✅ Enregistrer les modifications"}
                </button>
              )}
            </div>
          )}

          {activeSection === "security" && (
            <div
              style={{
                background: "#fff",
                borderRadius: 10,
                border: "1px solid #e8e8e8",
                padding: 28,
              }}
            >
              <h2
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 700,
                  fontSize: 16,
                  color: "#1d1d1e",
                  marginBottom: 6,
                }}
              >
                Sécurité
              </h2>
              <p
                style={{
                  fontFamily: "Source Sans 3, sans-serif",
                  fontSize: 13,
                  color: "#6b7280",
                  marginBottom: 24,
                }}
              >
                Modifiez votre mot de passe. Vous serez déconnecté après
                confirmation.
              </p>

              {pwdSuccess ? (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: 10,
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <span style={{ fontSize: 28 }}>✅</span>
                  <div>
                    <div
                      style={{
                        fontFamily: "Montserrat, sans-serif",
                        fontWeight: 700,
                        fontSize: 14,
                        color: "#16a34a",
                      }}
                    >
                      Mot de passe modifié !
                    </div>
                    <div
                      style={{
                        fontFamily: "Source Sans 3, sans-serif",
                        fontSize: 13,
                        color: "#4ade80",
                        marginTop: 3,
                      }}
                    >
                      Un email de confirmation a été envoyé. Déconnexion en
                      cours…
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    maxWidth: 400,
                  }}
                >
                  <div>
                    <label style={labelStyle}>Mot de passe actuel</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => {
                        setOldPassword(e.target.value);
                        setPwdError(null);
                      }}
                      placeholder="••••••••"
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
                      onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Nouveau mot de passe</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPwdError(null);
                      }}
                      placeholder="••••••••"
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
                      onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")}
                    />
                    {newPassword.length > 0 && newPassword.length < 8 && (
                      <p
                        style={{
                          fontFamily: "Source Sans 3, sans-serif",
                          fontSize: 12,
                          color: "#d97706",
                          marginTop: 4,
                        }}
                      >
                        Minimum 8 caractères
                      </p>
                    )}
                  </div>
                  <div>
                    <label style={labelStyle}>
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
                      style={{
                        ...inputStyle,
                        borderColor:
                          confirmPassword && confirmPassword !== newPassword
                            ? "#e05252"
                            : "#e8e8e8",
                      }}
                      onFocus={(e) =>
                        (e.target.style.borderColor =
                          confirmPassword !== newPassword
                            ? "#e05252"
                            : "#23b2a4")
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor =
                          confirmPassword !== newPassword
                            ? "#e05252"
                            : "#e8e8e8")
                      }
                    />
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p
                        style={{
                          fontFamily: "Source Sans 3, sans-serif",
                          fontSize: 12,
                          color: "#e05252",
                          marginTop: 4,
                        }}
                      >
                        Les mots de passe ne correspondent pas
                      </p>
                    )}
                  </div>

                  {pwdError && (
                    <div
                      style={{
                        background: "#fee2e2",
                        border: "1px solid #fecaca",
                        borderRadius: 8,
                        padding: "10px 14px",
                        fontFamily: "Source Sans 3, sans-serif",
                        fontSize: 13,
                        color: "#dc2626",
                      }}
                    >
                      {pwdError}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (
                        !oldPassword ||
                        !newPassword ||
                        newPassword.length < 8 ||
                        newPassword !== confirmPassword
                      )
                        return;
                      submitPasswordChange();
                    }}
                    disabled={
                      pwdPending ||
                      !oldPassword ||
                      !newPassword ||
                      newPassword.length < 8 ||
                      newPassword !== confirmPassword
                    }
                    style={{
                      padding: "11px 24px",
                      borderRadius: 8,
                      border: "none",
                      background:
                        pwdPending ||
                        !oldPassword ||
                        newPassword.length < 8 ||
                        newPassword !== confirmPassword
                          ? "#e8e8e8"
                          : "#23b2a4",
                      color:
                        pwdPending ||
                        !oldPassword ||
                        newPassword.length < 8 ||
                        newPassword !== confirmPassword
                          ? "#9ca3af"
                          : "#fff",
                      fontFamily: "Montserrat, sans-serif",
                      fontWeight: 700,
                      fontSize: 14,
                      cursor:
                        pwdPending ||
                        !oldPassword ||
                        newPassword.length < 8 ||
                        newPassword !== confirmPassword
                          ? "not-allowed"
                          : "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {pwdPending
                      ? "Modification en cours…"
                      : "🔐 Modifier le mot de passe"}
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
