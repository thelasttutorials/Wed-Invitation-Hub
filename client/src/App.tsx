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
import PricingPage from "@/pages/pricing";
import AdminPricing from "@/pages/admin/pricing";
import AdminOrders from "@/pages/admin/orders";
import AdminBankSettings from "@/pages/admin/bank-settings";
import AdminTemplates from "@/pages/admin/templates";
import TemplateBuilder from "@/pages/admin/template-builder";
import PrivacyPage from "@/pages/privacy";
import TermsPage from "@/pages/terms";
import ContactPage from "@/pages/contact";
import AdminContactMessages from "@/pages/admin/contact-messages";
import DemoPage from "@/pages/demo";
import InvoicePage from "@/pages/dashboard/invoice";
import GuestManagementPage from "@/pages/dashboard/guests";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Landing} />
      <Route path="/invite/:slug" component={InvitePage} />
      <Route path="/invitation/:slug" component={InvitationPage} />
      <Route path="/demo/:slug" component={DemoPage} />

      {/* Legal & Contact */}
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/contact" component={ContactPage} />

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
      <Route path="/dashboard/guests" component={GuestManagementPage} />
      <Route path="/dashboard/rsvp">
        {() => <Dashboard section="rsvp" />}
      </Route>
      <Route path="/dashboard/wishes">
        {() => <Dashboard section="wishes" />}
      </Route>
      <Route path="/dashboard/settings">
        {() => <Dashboard section="settings" />}
      </Route>
      <Route path="/dashboard/billing">
        {() => <Dashboard section="billing" />}
      </Route>
      <Route path="/dashboard/orders">
        {() => <Dashboard section="orders" />}
      </Route>
      <Route path="/dashboard/invoice/:id" component={InvoicePage} />

      {/* Pricing page — public */}
      <Route path="/pricing" component={PricingPage} />

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

      <Route path="/admin/pricing">
        {() => (
          <AdminGuard pageTitle="Paket">
            <AdminPricing />
          </AdminGuard>
        )}
      </Route>

      <Route path="/admin/orders">
        {() => (
          <AdminGuard pageTitle="Orders">
            <AdminOrders />
          </AdminGuard>
        )}
      </Route>

      <Route path="/admin/bank-settings">
        {() => (
          <AdminGuard pageTitle="Rekening Bank">
            <AdminBankSettings />
          </AdminGuard>
        )}
      </Route>

      <Route path="/admin/templates">
        {() => (
          <AdminGuard pageTitle="Templates">
            <AdminTemplates />
          </AdminGuard>
        )}
      </Route>

      <Route path="/admin/contact-messages">
        {() => (
          <AdminGuard pageTitle="Pesan Kontak">
            <AdminContactMessages />
          </AdminGuard>
        )}
      </Route>

      {/* Template builder has its own full-screen layout */}
      <Route path="/admin/templates/:id/builder" component={TemplateBuilder} />

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
