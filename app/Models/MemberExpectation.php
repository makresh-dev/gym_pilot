<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberExpectation extends Model
{
    use HasUlids, BelongsToTenant;

    protected $fillable = [
        'organization_id',
        'member_id',
        'visits_per_week',
        'start_date',
        'end_date',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }
}
