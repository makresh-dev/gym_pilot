import { Link } from '@inertiajs/react';
import {
    CalendarCheck2,
    CreditCard,
    LayoutGrid,
    Users,
} from 'lucide-react';

import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

import attendance from '@/routes/attendance';
import { dashboard } from '@/routes';
import membershipPlans from '@/routes/membership-plans';
import members from '@/routes/members';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Members',
        href: members.index(),
        icon: Users,
    },
    {
        title: 'Attendance',
        href: attendance.index(),
        icon: CalendarCheck2,
    },
    {
        title: 'Membership Plans',
        href: membershipPlans.index(),
        icon: CreditCard,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            tooltip={{ children: 'GymPilot' }}
                            className="group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center"
                        >
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}