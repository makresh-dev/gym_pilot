import { usePage } from '@inertiajs/react';

import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-xs border border-border/70 bg-white dark:bg-card p-0.5 transition-all">
                <img
                    src="/images/gympilot-icon.png"
                    alt="GymPilot"
                    className="size-full object-contain"
                />
            </div>
            <div className="ml-1.5 grid flex-1 text-left text-sm group-data-[collapsible=icon]:hidden">
                <span className="mb-0.5 truncate leading-tight font-semibold tracking-tight text-foreground">
                    {name}
                </span>
            </div>
        </>
    );
}
