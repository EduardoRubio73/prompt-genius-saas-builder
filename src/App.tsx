import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { SuperAdminGuard } from "@/components/guards/SuperAdminGuard";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/landing/LandingPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPrompts from "./pages/admin/AdminPrompts";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminAIConfig from "./pages/admin/AdminAIConfig";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminFlags from "./pages/admin/AdminFlags";
import MistoMode from "./pages/misto/MistoMode";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={<AuthGuard><Dashboard /></AuthGuard>}
          />
          <Route
            path="/prompt"
            element={<AuthGuard><PlaceholderPage title="Modo Prompt" /></AuthGuard>}
          />
          <Route
            path="/saas-spec"
            element={<AuthGuard><PlaceholderPage title="Modo SaaS Spec" /></AuthGuard>}
          />
          <Route
            path="/mixed"
            element={<AuthGuard><PlaceholderPage title="Modo Misto" /></AuthGuard>}
          />
          {/* Admin routes */}
          <Route
            path="/admin"
            element={<SuperAdminGuard><AdminLayout /></SuperAdminGuard>}
          >
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="prompts" element={<AdminPrompts />} />
            <Route path="billing" element={<AdminBilling />} />
            <Route path="ai-config" element={<AdminAIConfig />} />
            <Route path="logs" element={<AdminAuditLogs />} />
            <Route path="flags" element={<AdminFlags />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
