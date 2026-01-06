import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout';
import { MobileLayout } from './components/layout/MobileLayout';

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

// Candidate Portal Pages (V1)
import { CandidateHomePage } from './features/candidate/pages/CandidateHomePage';
import { CandidateTasksPage } from './features/candidate/pages/CandidateTasksPage';
import { CandidateProfilePage } from './features/candidate/pages/CandidateProfilePage';

// Candidate Portal Pages (V2 - Mobile-First)
import { CandidateHomeV2Page } from './features/candidate/pages/CandidateHomeV2Page';
import { CandidateTasksV2Page } from './features/candidate/pages/CandidateTasksV2Page';

// Candidate Portal Pages (V3 - Condensed)
import { CandidateTasksV3Page } from './features/candidate/pages/CandidateTasksV3Page';

// Candidate Chat Page
import { CandidateChatPage } from './features/candidate/pages/CandidateChatPage';

// Candidate Notifications Page
import { CandidateNotificationsPage } from './features/candidate/pages/CandidateNotificationsPage';

function App() {
    return (
        <Routes>
            {/* HR Portal - Desktop Layout */}
            <Route path="/" element={<Layout><Navigate to="/dashboard" replace /></Layout>} />
            <Route path="/dashboard" element={<Layout><DashboardPage /></Layout>} />
            <Route path="/api-test" element={<Layout><ApiTestPage /></Layout>} />
            <Route path="/projects" element={<Layout><ProjectsPage /></Layout>} />
            <Route path="/projects/new" element={<Layout><ProjectSetupWizard /></Layout>} />
            <Route path="/projects/:projectId" element={<Layout><ProjectDetailPage /></Layout>} />
            <Route path="/projects/:projectId/edit" element={<Layout><ProjectEditPage /></Layout>} />
            <Route path="/projects/:projectId/dashboard" element={<Layout><OnboardingDashboard /></Layout>} />
            <Route path="/templates" element={<Layout><TemplatesPage /></Layout>} />
            <Route path="/templates/:templateId" element={<Layout><TemplateDetailPage /></Layout>} />
            <Route path="/tasks" element={<Layout><TaskLibraryPage /></Layout>} />
            <Route path="/eligibility-rules" element={<Layout><EligibilityRulesPage /></Layout>} />
            <Route path="/team-members" element={<Layout><TeamMembersPage /></Layout>} />

            {/* Candidate Portal V1 - Mobile Layout */}
            <Route path="/candidate" element={<MobileLayout><CandidateHomePage /></MobileLayout>} />
            <Route path="/candidate/tasks" element={<MobileLayout><CandidateTasksPage /></MobileLayout>} />
            <Route path="/candidate/tasks/:taskId" element={<MobileLayout><CandidateTasksPage /></MobileLayout>} />
            <Route path="/candidate/chat" element={<MobileLayout><CandidateChatPage /></MobileLayout>} />
            <Route path="/candidate/notifications" element={<MobileLayout><CandidateNotificationsPage /></MobileLayout>} />
            <Route path="/candidate/profile" element={<MobileLayout><CandidateProfilePage /></MobileLayout>} />

            {/* Candidate Portal V2 - Mobile-First Design */}
            <Route path="/candidate-v2" element={<MobileLayout><CandidateHomeV2Page /></MobileLayout>} />
            <Route path="/candidate-v2/tasks" element={<MobileLayout><CandidateTasksV2Page /></MobileLayout>} />

            {/* Candidate Portal V3 - Condensed Design */}
            <Route path="/candidate-v3/tasks" element={<MobileLayout><CandidateTasksV3Page /></MobileLayout>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default App;
