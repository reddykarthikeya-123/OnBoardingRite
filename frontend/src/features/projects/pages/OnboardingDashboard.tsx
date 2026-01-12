import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * OnboardingDashboard - Redirects to ProjectDetailPage
 * 
 * This page was originally designed as a more detailed project dashboard
 * but has been consolidated with ProjectDetailPage which now contains
 * full project management functionality.
 */
export function OnboardingDashboard() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect to the main project detail page
        if (projectId) {
            navigate(`/projects/${projectId}`, { replace: true });
        } else {
            navigate('/projects', { replace: true });
        }
    }, [projectId, navigate]);

    return null;
}
