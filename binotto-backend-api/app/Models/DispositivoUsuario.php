<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DispositivoUsuario extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'dispositivos_usuario';

    protected $fillable = [
        'usuario_id',
        'token',
        'idioma',
        'plataforma',
        'nome_dispositivo',
        'versao_app',
        'ultimo_uso_em',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}
