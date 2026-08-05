<?php

namespace App\Helpers;

class PdfHelper
{
    public static function partName(?string $part): string
    {
        return __("pdf.parts.{$part}");
    }

    public static function repairType(?string $repairType): string
    {
        return __("pdf.{$repairType}");
    }
}