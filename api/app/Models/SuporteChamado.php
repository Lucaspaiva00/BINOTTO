<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SuporteChamado extends Model
{
    protected $table = 'suporte_chamados';

    protected $fillable = [
        'usuario_id',
        'assunto',
        'status',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function mensagens(): HasMany
    {
        return $this->hasMany(SuporteMensagem::class, 'chamado_id')->orderBy('created_at');
    }
}
