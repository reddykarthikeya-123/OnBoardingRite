import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
    children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="app-main">
                <Header />
                <div className="app-content">
                    {children}
                </div>
            </main>
        </div>
    );
}
