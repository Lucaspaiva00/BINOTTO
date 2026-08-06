<?php

namespace App\Enums;

enum ServicoStatusEnum: string
{
    case AGUARDANDO = 'aguardando';
    case AGUARDANDO_APROVACAO = 'aguardando_aprovacao';
    case ACEITO = 'aceito';
    case EM_EXECUCAO = 'em_execucao';
    case EM_BREVE = 'em_breve';
    case RETRABALHO = 'retrabalho';
    case CONCLUIDO = 'concluido';
    case FINALIZADO = 'finalizado';
    case CANCELADO = 'cancelado';

    public function label(): string
    {
        return match ($this) {
            self::AGUARDANDO => 'Aguardando',
            self::AGUARDANDO_APROVACAO => 'Aguardando Aprovacao',
            self::ACEITO => 'Tec. Aceitou',
            self::EM_EXECUCAO => 'Em Execucao',
            self::EM_BREVE => 'Em breve',
            self::RETRABALHO => 'Retrabalho',
            self::CONCLUIDO => 'Concluido',
            self::FINALIZADO => 'Finalizado',
            self::CANCELADO => 'Cancelado',
        };
    }

    public function oficinaLabel(): string
    {
        return match ($this) {
            self::AGUARDANDO => 'Aguardando Tecnico',
            self::AGUARDANDO_APROVACAO => 'Aguardando Aprovacao',
            self::ACEITO => 'Tec. Aceitou',
            self::EM_EXECUCAO => 'Em Execucao',
            self::EM_BREVE => 'Em Breve',
            self::RETRABALHO => 'Retrabalho',
            self::CONCLUIDO => 'Concluido',
            self::FINALIZADO => 'Finalizado',
            self::CANCELADO => 'Cancelado',
        };
    }

    public function tecnicoLabel(): string
    {
        return match ($this) {
            self::AGUARDANDO => 'Disponivel',
            self::AGUARDANDO_APROVACAO => 'Aguardando Aprovacao',
            self::ACEITO => 'Em Execucao',
            self::EM_EXECUCAO => 'Em Execucao',
            self::EM_BREVE => 'Em Breve',
            self::RETRABALHO => 'Retrabalho',
            self::CONCLUIDO => 'Concluido',
            self::FINALIZADO => 'Finalizado',
            self::CANCELADO => 'Cancelado',
        };
    }
}
