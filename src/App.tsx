import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout';
import { MobileLayout } from './components/layout/MobileLayout';
import { AuthProvider, ProtectedRoute } from './contexts/AuthContext';

// Auth Pages
import { LandingPage } from './pages/LandingPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { CandidateLoginPage } from './pages/CandidateLoginPage';
import { SetPasswordPage } from './pages/SetPasswordPage';

// Feature Pages
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { ApiTestPage } from './features/dashboard/pages/ApiTestPage';
import { ProjectsPage } from './features/projects/pages/ProjectsPage';
import { ProjectDetailPage } from './features/projects/pages/ProjectDetailPage';
import { ProjectEditPage } from './features/projects/pages/ProjectEditPage';
import { ProjectSetupWizard } from './features/projects/components/ProjectSetupWizard';
import { OnboardingDashboard } from './features/projects/pages/OnboardingDashboard';
import { TemplatesPage } from './features/templates/pages/TemplatesPage';
import { TemplateDetailPage } from './features/templates/pages/TemplateDetailPage';
import { TaskLibraryPage } from './features/tasks/pages/TaskLibraryPage';
import { EligibilityRulesPage } from './features/eligibility/pages/EligibilityRulesPage';
import { TeamMembersPage } from './features/team/pages/TeamMembersPage';

// Candidate Portal Pages (Consolidated - Using V2 as main)
import { CandidateHomeV2Page } from './features/candidate/pages/CandidateHomeV2Page';
import { CandidateTasksV2Page } from './features/candidate/pages/CandidateTasksV2Page';
import { CandidateTaskFormPage } from './features/candidate/pages/CandidateTaskFormPage';
import { CandidateProfilePage } from './features/candidate/pages/CandidateProfilePage';
import { CandidateChatPage } from './features/candidate/pages/CandidateChatPage';
import { CandidateNotificationsPage } from './features/candidate/pages/CandidateNotificationsPage';

function App() {
    return (
        <AuthProvider>
            <Routes>
                {/* Public Routes - No Auth Required */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login/admin" element={<AdminLoginPage />} />
                <Route path="/login/candidate" element={<CandidateLoginPage />} />
                <Route path="/set-password" element={<SetPasswordPage />} />

                {/* HR Portal - Desktop Layout (Protected - Admin Only) */}
                <Route path="/dashboard" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <Layout><DashboardPage /></Layout>
                    </ProtectedRoute>
                } />
                <Route path="/api-test" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <Layout><ApiTestPage /></Layout>
                    </ProtectedRoute>
                } />
                <Route path="/projects" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <Layout><ProjectsPage /></Layout>
                    </ProtectedRoute>
                } />
                <Route path="/projects/new" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <Layout><ProjectSetupWizard /></Layout>
                    </ProtectedRoute>
                } />
                <Route path="/projects/:projectId" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <Layout><ProjectDetailPage /></Layout>
                    </ProtectedRoute>
                } />
                <Route path="/projects/:projectId/edit" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <Layout><ProjectEditPage /></Layout>
                    </ProtectedRoute>
                } />
                <Route path="/projects/:projectId/dashboard" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <Layout><OnboardingDashboard /></Layout>
                    </ProtectedRoute>
                } />
                <Route path="/templates" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <Layout><TemplatesPage /></Layout>
                    </ProtectedRoute>
                } />
                <Route path="/templates/:templateId" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <Layout><TemplateDetailPage /></Layout>
                    </ProtectedRoute>
                } />
                <Route path="/tasks" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <Layout><TaskLibraryPage /></Layout>
                    </ProtectedRoute>
                } />
                <Route path="/eligibility-rules" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <Layout><EligibilityRulesPage /></Layout>
                    </ProtectedRoute>
                } />
                <Route path="/team-members" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <Layout><TeamMembersPage /></Layout>
                    </ProtectedRoute>
                } />

                {/* Candidate Portal - Mobile Layout (Protected - Candidate Only) */}
                <Route path="/candidate" element={
                    <ProtectedRoute allowedRoles={['candidate']}>
                        <MobileLayout><CandidateHomeV2Page /></MobileLayout>
                    </ProtectedRoute>
                } />
                <Route path="/candidate/tasks" element={
                    <ProtectedRoute allowedRoles={['candidate']}>
                        <MobileLayout><CandidateTasksV2Page /></MobileLayout>
                    </ProtectedRoute>
                } />
                <Route path="/candidate/task/:taskInstanceId" element={
                    <ProtectedRoute allowedRoles={['candidate']}>
                        <MobileLayout><CandidateTaskFormPage /></MobileLayout>
                    </ProtectedRoute>
                } />
                <Route path="/candidate/chat" element={
                    <ProtectedRoute allowedRoles={['candidate']}>
                        <MobileLayout><CandidateChatPage /></MobileLayout>
                    </ProtectedRoute>
                } />
                <Route path="/candidate/notifications" element={
                    <ProtectedRoute allowedRoles={['candidate']}>
                        <MobileLayout><CandidateNotificationsPage /></MobileLayout>
                    </ProtectedRoute>
                } />
                <Route path="/candidate/profile" element={
                    <ProtectedRoute allowedRoles={['candidate']}>
                        <MobileLayout><CandidateProfilePage /></MobileLayout>
                    </ProtectedRoute>
                } />

                {/* Fallback - Redirect to landing */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AuthProvider>
    );
}

export default App;
