<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class MemberExpectation extends Model
{
    use HasUlids;

    protected $fillable = [
        'organization_id',
        'member_id',
        'visits_per_week',
        'start_date',
        'end_date',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function member()
    {
        return $this->belongsTo(Member::class);
    }
}
