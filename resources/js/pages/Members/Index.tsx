import { Head, Link } from '@inertiajs/react';

type Member = {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    date_of_birth: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedMembers = {
    data: Member[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
};

type MembersIndexProps = {
    members: PaginatedMembers;
};

export default function Index({ members }: MembersIndexProps) {
    return (
        <>
            <Head title="Members" />

            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Members
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage your gym members.
                        </p>
                    </div>

                    <Link
                        href="/members/create"
                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                    >
                        Add Member
                    </Link>
                </div>

                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">
                                    Name
                                </th>

                                <th className="px-4 py-3 text-left font-medium">
                                    Phone
                                </th>

                                <th className="px-4 py-3 text-left font-medium">
                                    Email
                                </th>

                                <th className="px-4 py-3 text-right font-medium">
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {members.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                        No members found.
                                    </td>
                                </tr>
                            ) : (
                                members.data.map((member) => (
                                    <tr
                                        key={member.id}
                                        className="border-b last:border-0"
                                    >
                                        <td className="px-4 py-3">
                                            {member.name}
                                        </td>

                                        <td className="px-4 py-3">
                                            {member.phone}
                                        </td>

                                        <td className="px-4 py-3">
                                            {member.email ?? '—'}
                                        </td>

                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={`/members/${member.id}`}
                                                className="font-medium hover:underline"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {members.last_page > 1 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {members.links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url ?? '#'}
                                className={[
                                    'rounded-md border px-3 py-1 text-sm',
                                    link.active
                                        ? 'bg-muted font-medium'
                                        : '',
                                    !link.url
                                        ? 'pointer-events-none opacity-50'
                                        : '',
                                ].join(' ')}
                                dangerouslySetInnerHTML={{
                                    __html: link.label,
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}