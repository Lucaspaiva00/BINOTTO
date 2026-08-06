<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory;
    use SoftDeletes;

    protected $table = "usuarios";

    protected $fillable = [
        'nome',
        'email',
        'senha',
        'codigo_pais_telefone',
        'iso_pais_telefone', 
        'numero_telefone',
        'whatsapp',
        'perfil',
        'pre_cadastro',
        'senha_convite',
        'oficina_id_convite',
        'ativo',
        'cod_recuperacao',
        'cod_expira_em',
        'cod_usado_em',
        'cod_canal',
        'idioma',
        'pre_cadastro_social',
        'google_id',
        'apple_id',
        'facebook_id',
        'biometria_enabled',
        'biometria_hash',
        'social_data_temporario'
    ];

    protected $hidden = [
        'senha',
    ];

    protected $casts = [
        'ativo' => 'boolean',
        'cod_expira_em' => 'datetime',
        'cod_usado_em' => 'datetime',
        'social_data_temporario' => 'array'
    ];

    public function tecnico(): HasOne
    {
        return $this->hasOne(Tecnico::class, 'usuario_id');
    }

    public function oficina(): HasOne
    {
        return $this->hasOne(Oficina::class, 'usuario_id');
    }

    public function dispositivos(): HasMany
    {
        return $this->hasMany(DispositivoUsuario::class, 'usuario_id');
    }

    public function oficinaConvite(): BelongsTo
    {
        return $this->belongsTo(Oficina::class, 'oficina_id_convite');
    }

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }
}
