import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import members from '@/routes/members';

type Member = {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    date_of_birth: string | null;
};

type EditProps = {
    member: Member;
};

type MemberForm = {
    name: string;
    email: string;
    phone: string;
    date_of_birth: string;
};

export default function Edit({ member }: EditProps) {
    const { data, setData, put, processing, errors } = useForm<MemberForm>({
        name: member.name ?? '',
        email: member.email ?? '',
        phone: member.phone ?? '',
        date_of_birth: member.date_of_birth ?? '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(`/members/${member.id}`);
    };

    return (
        <>
            <Head title={`Edit ${member.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2 text-muted-foreground">
                        <Link href={members.show(member.id)}>
                            <ArrowLeft data-icon="inline-start" className="size-4" />
                            Back to Member Profile
                        </Link>
                    </Button>

                    <h1 className="text-2xl font-bold tracking-tight">Edit Member Profile</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Update personal and contact information for {member.name}.
                    </p>
                </div>

                <div className="max-w-2xl">
                    <Card>
                        <form onSubmit={submit}>
                            <CardHeader>
                                <CardTitle className="text-lg">Personal Details</CardTitle>
                                <CardDescription>
                                    Keep member contact information and identification accurate.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="flex flex-col gap-5">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(event) =>
                                            setData('name', event.target.value)
                                        }
                                        required
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={data.phone}
                                            onChange={(event) =>
                                                setData('phone', event.target.value)
                                            }
                                            required
                                        />
                                        <InputError message={errors.phone} />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(event) =>
                                                setData('email', event.target.value)
                                            }
                                            placeholder="john@example.com"
                                        />
                                        <InputError message={errors.email} />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                                    <Input
                                        id="date_of_birth"
                                        type="date"
                                        value={data.date_of_birth}
                                        onChange={(event) =>
                                            setData('date_of_birth', event.target.value)
                                        }
                                    />
                                    <InputError message={errors.date_of_birth} />
                                </div>
                            </CardContent>

                            <CardFooter className="flex justify-end gap-3 border-t bg-muted/10 px-6 py-4">
                                <Button variant="outline" asChild>
                                    <Link href={members.show(member.id)}>Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? (
                                        <Spinner data-icon="inline-start" />
                                    ) : (
                                        <Save data-icon="inline-start" className="size-4" />
                                    )}
                                    Save Changes
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        </>
    );
}
