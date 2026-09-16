<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tecnico extends Model
{
    protected $table = 'tecnicos';

    protected $fillable = [
        'usuario_id',
        'nome_completo',
        'apelido',
        'nacionalidade',
        'nacionalidade_secundaria',
        'disponibilidade_geografica',
        'telefone_secundario',
        'telefone_secundario_titular',
        'codigo_pais_telefone_secundario',
        'iso_pais_telefone_secundario',
        'data_nascimento',
        'cpf',
        'cnpj',
        'nome_fantasia_empresa',
        'razao_social_empresa',
        'endereco_rua',
        'endereco_numero',
        'endereco_complemento',
        'endereco_cidade',
        'endereco_estado',
        'endereco_cep',
        'pais_atual',
        'idiomas',
        'banco_nome',
        'banco_iban',
        'banco_swift',
        'banco_endereco',
    ];

    protected $casts = [
        'disponibilidade_geografica' => 'array',
        'idiomas' => 'array',
    ];

    // Relacionamentos
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function servicos()
    {
        return $this->hasMany(Servico::class);
    }
}
