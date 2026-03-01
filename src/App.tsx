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
import PromptMode from "./pages/prompt/PromptMode";
import SaasMode from "./pages/saas/SaasMode";
import BuildMode from "@/pages/build/BuildMode";
import MemoryPage from "./pages/MemoryPage";
import HistoryPage from "./pages/HistoryPage";
import ProfilePage from "./pages/ProfilePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider delayDuration={300} skipDelayDuration={100}>
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
            element={<AuthGuard><PromptMode /></AuthGuard>}
          />
          <Route
            path="/saas-spec"
            element={<AuthGuard><SaasMode /></AuthGuard>}
          />
          <Route
            path="/mixed"
            element={<AuthGuard><MistoMode /></AuthGuard>}
          />
          <Route
            path="/misto"
            element={<AuthGuard><MistoMode /></AuthGuard>}
          />
          <Route
            path="/build"
            element={<AuthGuard><BuildMode /></AuthGuard>}
          />
          <Route
            path="/memory"
            element={<AuthGuard><MemoryPage /></AuthGuard>}
          />
          <Route
            path="/history"
            element={<AuthGuard><HistoryPage /></AuthGuard>}
          />
          <Route
            path="/profile"
            element={<AuthGuard><ProfilePage /></AuthGuard>}
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
