<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class OficinaDocumento extends Model
{
    use HasFactory;

    protected $table = 'oficina_documentos';

    protected $fillable = [
        'oficina_id',
        'nome',
        'arquivo',
        'url',
        'mime_type',
        'tamanho',
        'tipo',
    ];

    protected $casts = [
        'tamanho' => 'integer',
    ];

    protected $appends = [
        'arquivo_url',
        'tamanho_formatado',
    ];

    // relaacionamentos
    public function oficina()
    {
        return $this->belongsTo(Oficina::class);
    }

    // Accessors
    public function getArquivoUrlAttribute(): ?string
    {
        if (!$this->arquivo) {
            return null;
        }

        return Storage::disk('public')->url($this->arquivo);
    }

    public function getTamanhoFormatadoAttribute(): ?string
    {
        if (!$this->tamanho) {
            return null;
        }

        $bytes = $this->tamanho;

        $units = ['B', 'KB', 'MB', 'GB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }

    // helpers
    public function isPdf(): bool
    {
        return str_contains($this->mime_type ?? '', 'pdf');
    }

    public function isImage(): bool
    {
        return str_contains($this->mime_type ?? '', 'image');
    }

    // eventos
    protected static function booted(): void
    {
        static::deleting(function ($documento) {

            if ($documento->arquivo) {

                $disk = Storage::disk('public');

                if ($disk->exists($documento->arquivo)) {
                    $disk->delete($documento->arquivo);
                }
            }
        });
    }
}