import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import InvitationPage from "@/pages/invitation";
import InvitePage from "@/pages/invite";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminInvitations from "@/pages/admin/invitations";
import AdminNewInvitation from "@/pages/admin/new-invitation";
import AdminEditInvitation from "@/pages/admin/edit-invitation";
import AdminLanding from "@/pages/admin/landing";
import AdminRsvp from "@/pages/admin/rsvp";
import AdminWishes from "@/pages/admin/wishes";
import AdminGuard from "@/components/admin-guard";
import AuthLogin from "@/pages/auth-login";
import Dashboard from "@/pages/dashboard";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Landing} />
      <Route path="/invite/:slug" component={InvitePage} />
      <Route path="/invitation/:slug" component={InvitationPage} />

      {/* Customer auth — no guard */}
      <Route path="/login" component={AuthLogin} />
      <Route path="/register" component={AuthLogin} />

      {/* Customer dashboard */}
      <Route path="/dashboard">
        {() => <Dashboard section="home" />}
      </Route>
      <Route path="/dashboard/invitations">
        {() => <Dashboard section="invitations" />}
      </Route>
      <Route path="/dashboard/new">
        {() => <Dashboard section="new" />}
      </Route>
      <Route path="/dashboard/rsvp">
        {() => <Dashboard section="rsvp" />}
      </Route>
      <Route path="/dashboard/wishes">
        {() => <Dashboard section="wishes" />}
      </Route>
      <Route path="/dashboard/settings">
        {() => <Dashboard section="settings" />}
      </Route>

      {/* Admin login — no guard */}
      <Route path="/admin/login" component={AdminLogin} />

      {/* Admin pages — all wrapped with AdminGuard (auth + sidebar layout) */}
      <Route path="/admin">
        {() => (
          <AdminGuard pageTitle="Dashboard">
            <AdminDashboard />
          </AdminGuard>
        )}
      </Route>

      <Route path="/admin/landing">
        {() => (
          <AdminGuard pageTitle="Landing Page">
            <AdminLanding />
          </AdminGuard>
        )}
      </Route>

      <Route path="/admin/invitations">
        {() => (
          <AdminGuard pageTitle="Undangan">
            <AdminInvitations />
          </AdminGuard>
        )}
      </Route>

      <Route path="/admin/new">
        {() => (
          <AdminGuard pageTitle="Buat Undangan">
            <AdminNewInvitation />
          </AdminGuard>
        )}
      </Route>

      <Route path="/admin/rsvp">
        {() => (
          <AdminGuard pageTitle="RSVP">
            <AdminRsvp />
          </AdminGuard>
        )}
      </Route>

      <Route path="/admin/wishes">
        {() => (
          <AdminGuard pageTitle="Ucapan">
            <AdminWishes />
          </AdminGuard>
        )}
      </Route>

      <Route path="/admin/:id/edit">
        {() => (
          <AdminGuard pageTitle="Edit Undangan">
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
