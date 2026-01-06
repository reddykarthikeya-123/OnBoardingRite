import { Search, Bell, HelpCircle } from 'lucide-react';

interface HeaderProps {
    title?: string;
}

export function Header({ title }: HeaderProps) {
    return (
        <header className="app-header">
            <div className="flex items-center gap-4">
                {title && <h1 className="text-xl font-semibold">{title}</h1>}
            </div>

            <div className="flex items-center gap-3">
                <div className="search-bar">
                    <Search size={18} className="search-bar-icon" />
                    <input
                        type="text"
                        className="input search-bar-input"
                        placeholder="Search anything..."
                    />
                </div>

                <button className="btn btn-ghost btn-icon" title="Notifications">
                    <Bell size={20} />
                </button>

                <button className="btn btn-ghost btn-icon" title="Help">
                    <HelpCircle size={20} />
                </button>
            </div>
        </header>
    );
}
