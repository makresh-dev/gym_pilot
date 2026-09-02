<?php

namespace App\Policies;

use App\Models\Member;
use App\Models\User;

class MemberPolicy
{
    public function view(User $user, Member $member): bool
    {
        return $user->organization_id === $member->organization_id;
    }

    public function update(User $user, Member $member): bool
    {
        return $user->organization_id === $member->organization_id;
    }

    public function delete(User $user, Member $member): bool
    {
        return $user->organization_id === $member->organization_id;
    }

    public function destroy(Member $member): RedirectResponse
{
    Gate::authorize('delete', $member);

    $member->delete();

    return redirect()
        ->route('members.index');
}
}