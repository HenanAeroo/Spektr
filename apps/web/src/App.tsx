import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { ThemeProvider } from "@/shared/components/theme-provider";
import { AuthProvider } from "@/shared/components/auth-provider";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import Sidebar from "@/shared/components/layout/sidebar";
import LoginPage from "./pages/login";
import GoogleCallbackPage from "./pages/oauth/callback";
import HomePage from "./pages/Home";
import ProfilePage from "./pages/profile";
import ApplicationsPage from "./pages/applications";
import DocumentsPage from "@/src/pages/documents";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function AppLayout() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/oauth/callback" element={<GoogleCallbackPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/applications" element={<ApplicationsPage />} />
                  <Route path="/documents" element={<DocumentsPage />} />
                </Route>
              </Route>
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
