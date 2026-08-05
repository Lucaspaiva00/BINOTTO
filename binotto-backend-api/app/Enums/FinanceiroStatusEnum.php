<?php

namespace App\Enums;

enum FinanceiroStatusEnum: string
{
    case PENDENTE = 'pendente';
    case CONFIRMADO = 'confirmado';
    case EM_ABERTO = 'em_aberto';
    case RECEBIDO = 'recebido';
    case VENCIDO = 'vencido';
    case CANCELADO = 'cancelado';
    case PAGO = 'pago';

    public function label(): string
    {
        return match ($this) {
            self::PENDENTE => 'Pendente',
            self::CONFIRMADO => 'Confirmado',
            self::EM_ABERTO => 'Em Aberto',
            self::RECEBIDO => 'Recebido',
            self::VENCIDO => 'Vencido',
            self::CANCELADO => 'Cancelado',
            self::PAGO => 'Pago',
        };
    }
}
