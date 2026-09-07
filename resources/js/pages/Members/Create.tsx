import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, UserPlus } from 'lucide-react';
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

type MemberForm = {
    name: string;
    email: string;
    phone: string;
    date_of_birth: string;
};

export default function Create() {
    const { data, setData, post, processing, errors } = useForm<MemberForm>({
        name: '',
        email: '',
        phone: '',
        date_of_birth: '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post('/members');
    };

    return (
        <>
            <Head title="Add Member" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2 text-muted-foreground">
                        <Link href={members.index()}>
                            <ArrowLeft data-icon="inline-start" className="size-4" />
                            Back to Members
                        </Link>
                    </Button>

                    <h1 className="text-2xl font-bold tracking-tight">Add Member</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Register a new gym member to start tracking workouts and memberships.
                    </p>
                </div>

                <div className="max-w-2xl">
                    <Card>
                        <form onSubmit={submit}>
                            <CardHeader>
                                <CardTitle className="text-lg">Personal Details</CardTitle>
                                <CardDescription>
                                    Essential profile details for identification, contact, and check-in.
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
                                        placeholder="e.g. John Doe"
                                        required
                                        autoFocus
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
                                            placeholder="+91 98765 43210"
                                            required
                                        />
                                        <InputError message={errors.phone} />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="email">Email Address (Optional)</Label>
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
                                    <Label htmlFor="date_of_birth">Date of Birth (Optional)</Label>
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
                                    <Link href={members.index()}>Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? (
                                        <Spinner data-icon="inline-start" />
                                    ) : (
                                        <UserPlus data-icon="inline-start" className="size-4" />
                                    )}
                                    Create Member
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        </>
    );
}