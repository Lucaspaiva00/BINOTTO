<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServicoRecusado extends Model
{
    protected $table = 'servicos_recusados';

    protected $fillable = [
        'servico_id',
        'tecnico_id',
    ];
}
