import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { home } from '@/routes';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="flex w-full max-w-md flex-col gap-6">
                <Link
                    href={home()}
                    className="group flex flex-col items-center gap-2 self-center font-medium"
                >
                    <div className="relative flex items-center justify-center">
                        <div className="absolute -inset-2 rounded-full bg-emerald-500/20 blur-lg dark:bg-emerald-500/10" />
                        <img
                            src="/images/gympilot-icon.png"
                            alt="GymPilot"
                            className="relative size-14 rounded-2xl object-contain border border-border/80 bg-white dark:bg-card p-1 shadow-xs transition-transform duration-200 group-hover:scale-105"
                        />
                    </div>
                    <span className="text-base font-bold tracking-tight text-foreground">GymPilot</span>
                </Link>

                <div className="flex flex-col gap-6">
                    <Card className="rounded-xl">
                        <CardHeader className="px-10 pt-8 pb-0 text-center">
                            <CardTitle className="text-xl">{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </CardHeader>
                        <CardContent className="px-10 py-8">
                            {children}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
