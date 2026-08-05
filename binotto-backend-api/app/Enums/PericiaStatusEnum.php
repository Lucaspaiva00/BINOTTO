<?php

namespace App\Enums;

enum PericiaStatusEnum: string
{
    case ABERTA = 'aberta';
    case EM_EXECUCAO = 'em_execucao';
    case CONCLUIDA = 'concluida';

    public function label(): string
    {
        return match ($this) {
            self::ABERTA => 'Aberta',
            self::EM_EXECUCAO => 'Em Execucao',
            self::CONCLUIDA => 'Concluida'
        };
    }
}
