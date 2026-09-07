import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="w-full max-w-sm md:max-w-md">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={home()}
                            className="group flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="relative mb-1 flex items-center justify-center">
                                <div className="absolute -inset-2 rounded-full bg-emerald-500/20 blur-lg dark:bg-emerald-500/10" />
                                <img
                                    src="/images/gympilot-logo.png"
                                    alt="GymPilot"
                                    className="relative size-16 rounded-2xl object-contain border border-border/80 bg-white dark:bg-card p-1 shadow-xs transition-transform duration-200 group-hover:scale-105"
                                />
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-base font-bold tracking-tight text-foreground">
                                    GymPilot
                                </span>
                                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                    Smart Fitness Technology
                                </span>
                            </div>
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">{title}</h1>
                            <p className="text-muted-foreground text-center text-sm">
                                {description}
                            </p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
