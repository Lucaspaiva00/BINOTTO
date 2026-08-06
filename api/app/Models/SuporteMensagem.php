<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SuporteMensagem extends Model
{
    protected $table = 'suporte_mensagens';

    protected $fillable = [
        'chamado_id',
        'autor_tipo',
        'autor_id',
        'corpo',
    ];

    public function chamado(): BelongsTo
    {
        return $this->belongsTo(SuporteChamado::class, 'chamado_id');
    }
}
