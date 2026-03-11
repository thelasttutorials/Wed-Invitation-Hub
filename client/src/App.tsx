import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";

// Lightweight pages — imported directly for instant load
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import AuthLogin from "@/pages/auth-login";
import AdminLogin from "@/pages/admin/login";
import AdminGuard from "@/components/admin-guard";

// Heavy public pages — lazy loaded to reduce initial bundle
const InvitePage = lazy(() => import("@/pages/invite"));
const InvitationPage = lazy(() => import("@/pages/invitation"));
const DemoPage = lazy(() => import("@/pages/demo"));

// Legal & contact pages — lazy loaded (not on critical path)
const PrivacyPage = lazy(() => import("@/pages/privacy"));
const TermsPage = lazy(() => import("@/pages/terms"));
const ContactPage = lazy(() => import("@/pages/contact"));
const PricingPage = lazy(() => import("@/pages/pricing"));

// Customer dashboard — lazy loaded
const Dashboard = lazy(() => import("@/pages/dashboard"));
const InvoicePage = lazy(() => import("@/pages/dashboard/invoice"));
const GuestManagementPage = lazy(() => import("@/pages/dashboard/guests"));

// Admin pages — lazy loaded (admin users are not first-load priority)
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const AdminInvitations = lazy(() => import("@/pages/admin/invitations"));
const AdminNewInvitation = lazy(() => import("@/pages/admin/new-invitation"));
const AdminEditInvitation = lazy(() => import("@/pages/admin/edit-invitation"));
const AdminLanding = lazy(() => import("@/pages/admin/landing"));
const AdminRsvp = lazy(() => import("@/pages/admin/rsvp"));
const AdminWishes = lazy(() => import("@/pages/admin/wishes"));
const AdminPricing = lazy(() => import("@/pages/admin/pricing"));
const AdminOrders = lazy(() => import("@/pages/admin/orders"));
const AdminBankSettings = lazy(() => import("@/pages/admin/bank-settings"));
const AdminTemplates = lazy(() => import("@/pages/admin/templates"));
const TemplateBuilder = lazy(() => import("@/pages/admin/template-builder"));
const AdminContactMessages = lazy(() => import("@/pages/admin/contact-messages"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
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
