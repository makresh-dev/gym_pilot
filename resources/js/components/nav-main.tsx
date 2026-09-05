import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    function isItemActive(item: NavItem): boolean {
        /*
         * Members represents an entire route family:
         *
         * /members
         * /members/{id}
         * /members/{id}/edit
         * /members/{id}/memberships
         * /members/{id}/attendance
         *
         * Keep Members highlighted across all of these pages.
         */
        if (item.title === 'Members') {
            const currentPath = window.location.pathname;

            return (
                currentPath === '/members' ||
                currentPath.startsWith('/members/')
            );
        }

        /*
         * All other navigation items continue using the
         * application's existing URL matching logic.
         */
        return isCurrentUrl(item.href);
    }

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>

            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isItemActive(item)}
                            tooltip={{ children: item.title }}
                        >
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}