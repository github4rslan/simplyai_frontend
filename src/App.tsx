import React, { Suspense, useEffect, lazy } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Services = lazy(() => import("./pages/Services"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogDetails = lazy(() => import("./pages/BlogDetails"));
const Pricing = lazy(() => import("./pages/Pricing"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));
const Faq = lazy(() => import("./pages/Faq"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Account = lazy(() => import("./pages/Account"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Payment = lazy(() => import("./pages/Payment"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const EmailVerification = lazy(() => import("./pages/EmailVerification"));
const Profile = lazy(() => import("./pages/Profile"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Questionnaire = lazy(() => import("./pages/Questionnaire"));
const QuestionnaireSurveyJS = lazy(() => import("./pages/QuestionnaireSurveyJS"));
const FormPreview = lazy(() => import("./pages/FormPreview"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const Guide = lazy(() => import("./pages/Guide"));
import { Toaster } from "./components/ui/toaster";
import { AuthProvider } from "./contexts/AuthContext";
import { SettingsProvider } from "./contexts/SettingsContext";
const PagePreview = lazy(() => import("./pages/PagePreview"));
const Report = lazy(() => import("./pages/Report"));
const FormEditorPage = lazy(() => import("./components/form-builder/FormEditorPage"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const FormBuilderTestStandalone = lazy(() => import("./pages/admin/FormBuilderTestStandalone"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
import ErrorBoundary from "./components/ErrorBoundary";

// import FormBuilderV2 from './FormBuilderV2';

const AdminDashboard = lazy(() =>
  import("./pages/admin").then((m) => ({ default: m.AdminDashboard }))
);
const AdminLogin = lazy(() => import("./pages/admin").then((m) => ({ default: m.AdminLogin })));
const AdminUserManagement = lazy(() =>
  import("./pages/admin").then((m) => ({ default: m.AdminUserManagement }))
);
const CustomerDetails = lazy(() =>
  import("./pages/admin").then((m) => ({ default: m.CustomerDetails }))
);
const FormBuilder = lazy(() => import("./pages/admin").then((m) => ({ default: m.FormBuilder })));
const FormBuilderEditor = lazy(() =>
  import("./pages/admin").then((m) => ({ default: m.FormBuilderEditor }))
);
const PageEditor = lazy(() => import("./pages/admin").then((m) => ({ default: m.PageEditor })));
const FormPageEditor = lazy(() =>
  import("./pages/admin").then((m) => ({ default: m.FormPageEditor }))
);
const Settings = lazy(() => import("./pages/admin").then((m) => ({ default: m.Settings })));
const ChatGPTIntegration = lazy(() =>
  import("./pages/admin").then((m) => ({ default: m.ChatGPTIntegration }))
);
const PlansManagement = lazy(() =>
  import("./pages/admin").then((m) => ({ default: m.PlansManagement }))
);
const PlanEditor = lazy(() => import("./pages/admin").then((m) => ({ default: m.PlanEditor })));
const PromptTemplatesManager = lazy(() =>
  import("./pages/admin").then((m) => ({ default: m.PromptTemplatesManager }))
);
const PromptTemplatesList = lazy(() =>
  import("./pages/admin").then((m) => ({ default: m.PromptTemplatesList }))
);
const PromptEditor = lazy(() => import("./pages/admin").then((m) => ({ default: m.PromptEditor })));
const ReportTemplateEditor = lazy(() =>
  import("./pages/admin").then((m) => ({ default: m.ReportTemplateEditor }))
);
const ReportsPage = lazy(() => import("./pages/admin").then((m) => ({ default: m.ReportsPage })));
const FormBuilderV2 = lazy(() => import("./pages/admin").then((m) => ({ default: m.FormBuilderV2 })));
import { fetchColorProfiles } from "./services/settingsService";

const App = () => {
  // useEffect for fetch color profiles
  useEffect(() => {
    const getColorProfiles = async () => {
      const response = await fetchColorProfiles();
      if (response) {
        document.documentElement.style.setProperty(
          "--color-primary",
          response.primary_color
        );
        document.documentElement.style.setProperty(
          "--color-secondary",
          response.secondary_color
        );
        document.documentElement.style.setProperty(
          "--color-accent",
          response.accent_color
        );
      }
    };

    // run once at mount
    getColorProfiles();
  }, []);
  return (
    <Router>
      <SettingsProvider>
        <AuthProvider>
          <ErrorBoundary>
            <Suspense fallback={<div />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/services" element={<Services />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:id" element={<BlogDetails />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/guide" element={<Guide />} />
              <Route path="*" element={<NotFound />} />
              <Route path="/coming-soon" element={<ComingSoon />} />
              <Route path="/faq" element={<Faq />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/account" element={<Account />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/email-verification"
                element={<EmailVerification />}
              />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/dashboard/*" element={<UserDashboard />} />
              <Route path="/questionnaire/:id" element={<Questionnaire />} />
              <Route
                path="/questionnaire-surveyjs/:id"
                element={<QuestionnaireSurveyJS />}
              />
              <Route path="/form-preview/:id" element={<FormPreview />} />
              <Route path="/page-preview/:id" element={<PagePreview />} />
              <Route path="/report/:id" element={<Report />} />
              <Route path="/form-builder/editor" element={<FormEditorPage />} />
              //{" "}
              <Route
                path="/admin/form-builder-v2"
                element={<FormBuilderV2 />}
              />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminLayout>
                    <AdminUserManagement />
                  </AdminLayout>
                }
              />
              <Route
                path="/admin/users/:id"
                element={
                  <AdminLayout>
                    <CustomerDetails />
                  </AdminLayout>
                }
              />
              <Route
                path="/admin/form-builder"
                element={
                  <AdminLayout>
                    <FormBuilder />
                  </AdminLayout>
                }
              />
              <Route
                path="/admin/form-builder/:action/:id?"
                element={
                  <AdminLayout>
                    <FormBuilderEditor />
                  </AdminLayout>
                }
              />
              <Route
                path="/admin/form-builder/page-layout/:formId"
                element={
                  <AdminLayout>
                    <FormPageEditor />
                  </AdminLayout>
                }
              />
              <Route
                path="/admin/page-editor"
                element={
                  <AdminLayout>
                    <PageEditor />
                  </AdminLayout>
                }
              />
              <Route
                path="/admin/page-editor/:id"
                element={
                  <AdminLayout>
                    <PageEditor />
                  </AdminLayout>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <AdminLayout>
                    <Settings />
                  </AdminLayout>
                }
              />
              <Route
                path="/admin/plans"
                element={
                  <AdminLayout>
                    <PlansManagement />
                  </AdminLayout>
                }
              />
              <Route
                path="/admin/plans/create"
                element={
                  <AdminLayout>
                    <PlanEditor />
                  </AdminLayout>
                }
              />
              <Route
                path="/admin/plans/edit/:id"
                element={
                  <AdminLayout>
                    <PlanEditor />
                  </AdminLayout>
                }
              />
              <Route
                path="/admin/chatgpt"
                element={
                  <AdminLayout>
                    <ChatGPTIntegration />
                  </AdminLayout>
                }
              />
              <Route
                path="/admin/plans/:planId/prompts"
                element={
                  <AdminLayout>
                    <PromptTemplatesList />
                  </AdminLayout>
                }
              />
              <Route
                path="/admin/plans/:planId/prompts/new"
                element={
                  <AdminLayout>
                    <PromptEditor />
                  </AdminLayout>
                }
              />
              <Route
                path="/admin/plans/:planId/prompts/edit/:promptId"
                element={
                  <AdminLayout>
                    <PromptEditor />
                  </AdminLayout>
                }
              />
              <Route
                path="/admin/plans/:planId/reports"
                element={
                  <AdminLayout>
                    <ReportTemplateEditor />
                  </AdminLayout>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <AdminLayout>
                    <ReportsPage />
                  </AdminLayout>
                }
              />
              <Route
                path="/admin/form-builder-test"
                element={<FormBuilderTestStandalone />}
              />
            </Routes>
            </Suspense>
          </ErrorBoundary>

          <Toaster />
        </AuthProvider>
      </SettingsProvider>
    </Router>
  );
};

export default App;
