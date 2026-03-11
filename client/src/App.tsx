import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import InvitationPage from "@/pages/invitation";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminNewInvitation from "@/pages/admin/new-invitation";
import AdminEditInvitation from "@/pages/admin/edit-invitation";
import AdminGuard from "@/components/admin-guard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/invitation/:slug" component={InvitationPage} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin">
        {() => (
          <AdminGuard>
            <AdminDashboard />
          </AdminGuard>
        )}
      </Route>
      <Route path="/admin/new">
        {() => (
          <AdminGuard>
            <AdminNewInvitation />
          </AdminGuard>
        )}
      </Route>
      <Route path="/admin/:id/edit">
        {() => (
          <AdminGuard>
            <AdminEditInvitation />
          </AdminGuard>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
