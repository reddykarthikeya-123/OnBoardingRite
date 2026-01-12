import { useState, useEffect } from 'react';
import { dashboardApi, projectsApi, eligibilityApi } from '../../../services/api';
import { Card, Button, Badge } from '../../../components/ui';

interface ApiStatus {
    name: string;
    status: 'pending' | 'success' | 'error';
    data?: any;
    error?: string;
}

export function ApiTestPage() {
    const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([
        { name: 'Dashboard Stats', status: 'pending' },
        { name: 'Projects Summary', status: 'pending' },
        { name: 'Projects List', status: 'pending' },
        { name: 'Eligibility Rules', status: 'pending' },
    ]);

    const testApi = async (index: number, name: string, apiCall: () => Promise<any>) => {
        try {
            const data = await apiCall();
            setApiStatuses(prev => prev.map((s, i) =>
                i === index ? { name, status: 'success', data } : s
            ));
        } catch (error: any) {
            setApiStatuses(prev => prev.map((s, i) =>
                i === index ? { name, status: 'error', error: error.message } : s
            ));
        }
    };

    const runAllTests = () => {
        setApiStatuses([
            { name: 'Dashboard Stats', status: 'pending' },
            { name: 'Projects Summary', status: 'pending' },
            { name: 'Projects List', status: 'pending' },
            { name: 'Eligibility Rules', status: 'pending' },
        ]);

        testApi(0, 'Dashboard Stats', dashboardApi.getGlobalStats);
        testApi(1, 'Projects Summary', dashboardApi.getProjectsSummary);
        testApi(2, 'Projects List', projectsApi.list);
        testApi(3, 'Eligibility Rules', eligibilityApi.list);
    };

    useEffect(() => {
        runAllTests();
    }, []);

    return (
        <div className="page-enter">
            <div className="page-header">
                <div className="page-header-top">
                    <div>
                        <h1 className="page-title">API Integration Test</h1>
                        <p className="page-description">
                            Testing connection between frontend and backend APIs
                        </p>
                    </div>
                    <div className="page-actions">
                        <Button variant="primary" onClick={runAllTests}>
                            Run All Tests
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {apiStatuses.map((api, index) => (
                    <Card key={index} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{api.name}</h3>
                            <Badge
                                variant={
                                    api.status === 'success' ? 'success' :
                                        api.status === 'error' ? 'danger' :
                                            'secondary'
                                }
                            >
                                {api.status === 'success' ? '✓ Success' :
                                    api.status === 'error' ? '✗ Error' :
                                        '⏳ Pending'}
                            </Badge>
                        </div>

                        {api.status === 'success' && (
                            <pre className="text-xs bg-gray-900 p-2 rounded overflow-auto max-h-40">
                                {JSON.stringify(api.data, null, 2)}
                            </pre>
                        )}

                        {api.status === 'error' && (
                            <div className="text-red-400 text-sm">
                                {api.error}
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}
