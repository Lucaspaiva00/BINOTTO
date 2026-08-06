<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">

<head>
    <meta charset="utf-8">

    @php
    use App\Helpers\PdfHelper;

    $reparosRaw = $pericia->reparos_necessarios ?? [];
    $reparos = is_string($reparosRaw) ? json_decode($reparosRaw, true) : $reparosRaw;
    $reparos = is_array($reparos) ? $reparos : [];

    $reparosComDano = collect($reparos)
    ->filter(fn($item) => ($item['tipoReparo'] ?? 'SEM_DANO') !== 'SEM_DANO')
    ->values();
    @endphp

    <style>
        @page {
            margin-top: 20mm;
            margin-right: 15mm;
            margin-bottom: 15mm;
            margin-left: 15mm;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 9px;
            color: #121214;
            line-height: 1.3;
        }

        * {
            box-sizing: border-box;
        }

        .header {
            padding: 10px 0;
            margin-bottom: 12px;
        }

        .logo {
            height: 30px;
            margin-bottom: 5px;
        }

        .title {
            font-size: 16px;
            font-weight: bold;
        }

        .subtitle {
            color: #777777;
            font-size: 9px;
        }

        .section {
            margin-bottom: 15px;
        }

        .section-title {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 6px;
            padding-left: 8px;
            border-left: 3px solid #FACC15;
        }

        .info-table {
            width: 100%;
            border-collapse: collapse;
        }

        .info-table td {
            padding: 4px 6px;
            border: 1px solid #E5E7EB;
        }

        .label {
            font-weight: bold;
            width: 140px;
            background: #F9FAFB;
        }

        .photos-table {
            width: 100%;
            border-collapse: collapse;
        }

        .photos-table td {
            width: 33%;
            padding: 4px;
            text-align: center;
            vertical-align: middle;
        }

        .photo {
            width: 100%;
            height: auto;
            max-height: 120px;
            object-fit: contain;
            border: 1px solid #DDD;
        }

        .damage-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
        }

        .damage-table th {
            background: #121214;
            color: white;
            padding: 3px 4px;
            border: 1px solid #000;
        }

        .damage-table td {
            padding: 3px 4px;
            border: 1px solid #DDD;
            word-break: break-word;
            vertical-align: middle;
        }

        .damage-table th:last-child,
        .damage-table td:last-child {
            max-width: 100px;
        }

        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 2px;
            font-size: 8px;
            font-weight: bold;
            color: white;
        }

        .badge-pdr {
            background: #E8A91E;
        }

        .badge-pintura {
            background: #2F8BFF;
        }

        .badge-troca {
            background: #E34C4C;
        }

        .badge-aluminio-pdr {
            background: #2AC0C9;
        }

        .badge-aluminio-pintura {
            background: #7C3AED;
        }

        .badge-sem-dano {
            background: #D7DDE5;
            color: #333;
        }

        .badge-aluminio {
            background: #7C3AED;
        }

        .part-card {
            border: 1px solid #DDD;
            padding: 8px;
            margin-bottom: 12px;
            page-break-inside: avoid;
        }

        .part-title {
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 6px;
        }

        .part-card p {
            margin: 3px 0;
        }

        .footer {
            margin-top: 20px;
            text-align: center;
            color: #777;
            font-size: 8px;
            border-top: 1px solid #DDD;
            padding-top: 6px;
        }

        .page-break {
            page-break-before: always;
        }
    </style>
</head>

<body>
    <div class="header">
        <img class="logo" src="{{ public_path('binotto-logo.png') }}" alt="Binotto">
        <div class="title">{{ __('pdf.title') }}</div>
        <div class="subtitle">{{ __('pdf.generated_at') }}: {{ now()->format('d/m/Y H:i') }}</div>
    </div>

    <div class="section">
        <div class="section-title">{{ __('pdf.inspection_data') }}</div>
        <table class="info-table">
            <tr>
                <td class="label">{{ __('pdf.plate') }}</td>
                <td>{{ $pericia->placa }}</td>
                <td class="label">{{ __('pdf.type') }}</td>
                <td>{{ __('pdf.' . $pericia->tipo) }}</td>
            </tr>
            <tr>
                <td class="label">{{ __('pdf.chassis') }}</td>
                <td>{{ $pericia->chassi }}</td>
                <td class="label">{{ __('pdf.vehicle') }}</td>
                <td>{{ $pericia->marca_modelo }}</td>
            </tr>
            <tr>
                <td class="label">{{ __('pdf.technician') }}</td>
                <td>{{ $pericia->tecnico?->nome_completo }}</td>
                <td class="label">{{ __('pdf.workshop') }}</td>
                <td>{{ $pericia->oficina?->nome_fantasia }}</td>
            </tr>
            <tr>
                <td class="label">{{ __('pdf.inspection_date') }}</td>
                <td colspan="3">{{ optional($pericia->created_at)->format('d/m/Y H:i') }}</td>
            </tr>
        </table>
    </div>

    @if(!empty($pericia->fotos_pericia_completa))
        <div class="section">
            <div class="section-title">{{ __('pdf.photos') }}</div>
            <table class="photos-table">
                <tr>
                    @foreach($pericia->fotos_pericia_completa as $foto)
                    <td><img class="photo" src="{{ storage_path('app/public/' . $foto) }}"></td>
                    @endforeach
                </tr>
            </table>
        </div>
    @endif

    @if(!empty($pericia->fotos))
        <div class="section">
            <div class="section-title">{{ __('pdf.general_photos') }}</div>
            <table class="photos-table">
                <tr>
                    @foreach($pericia->fotos as $foto)
                    <td><img class="photo" src="{{ storage_path('app/public/' . $foto) }}"></td>
                    @endforeach
                </tr>
            </table>
        </div>
    @endif

    @if($reparosComDano->isNotEmpty())
    <div class="section">
        <div class="section-title">{{ __('pdf.damages') }}</div>
        <table class="damage-table">
            <thead>
                <tr>
                    <th>{{ __('pdf.part') }}</th>
                    <th>{{ __('pdf.repair_type') }}</th>
                    <th>{{ __('pdf.quantity_impacts_greater25') }}</th>
                    <th>{{ __('pdf.quantity_impacts_less25') }}</th>
                    {{-- <th>{{ __('pdf.qty_dents') }}</th>
                    <th>{{ __('pdf.dent_size') }}</th>
                    <th>{{ __('pdf.coefficient') }}</th> --}}
                    <th>{{ __('pdf.observations') }}</th>
                </tr>
            </thead>
            <tbody>
                @foreach($reparosComDano as $reparo)
                @php
                $tipo = $reparo['tipoReparo'] ?? 'SEM_DANO';
                $badgeClass = 'badge-' . strtolower(str_replace('_', '-', $tipo));
                @endphp
                <tr>
                    <td>{{ PdfHelper::partName($reparo['peca']) }}</td>
                    <td><span class="badge {{ $badgeClass }}">{{ __('pdf.' . $tipo) }}</span></td>
                    {{-- <td>{{ $reparo['quantidadeAmassados'] ?? 0 }}</td>
                    <td>{{ $reparo['tamanhoAmassado'] ?? '-' }}</td>
                    <td>{{ $reparo['coeficiente'] ?? '-' }}</td> --}}
                    <td>{{ $reparo['quantidadeImpactosMaior25'] ?? 0 }}</td>
                    <td>{{ $reparo['quantidadeImpactosMenor25'] ?? 0 }}</td>
                    <td>{{ $reparo['observacoes'] ?? '' }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="page-break"></div>
    <div class="section">
        <div class="section-title">{{ __('pdf.part_details') }}</div>
        @foreach($reparosComDano as $reparo)
        @php
        $tipo = $reparo['tipoReparo'] ?? 'SEM_DANO';
        $badgeClass = 'badge-' . strtolower(str_replace('_', '-', $tipo));
        @endphp
        <div class="part-card">
            <div class="part-title">{{ PdfHelper::partName($reparo['peca']) }}</div>
            <p><strong>{{ __('pdf.repair_type') }}:</strong> <span class="badge {{ $badgeClass }}">{{ __('pdf.' . $tipo) }}</span></p>
            <p><strong>{{ __('pdf.qty_dents') }}:</strong> {{ $reparo['quantidadeAmassados'] ?? 0 }}</p>
            <p><strong>{{ __('pdf.dent_size') }}:</strong> {{ $reparo['tamanhoAmassado'] ?? '-' }}</p>
            <p><strong>{{ __('pdf.coefficient') }}:</strong> {{ $reparo['coeficiente'] ?? '-' }}</p>
            @if(!empty($reparo['observacoes']))
            <p><strong>{{ __('pdf.observations') }}:</strong><br>{{ $reparo['observacoes'] }}</p>
            @endif
            @if(!empty($reparo['fotos']))
            <table class="photos-table">
                @foreach(array_chunk($reparo['fotos'], 2) as $linha)
                <tr>
                    @foreach($linha as $foto)
                    <td><img class="photo" src="{{ storage_path('app/public/' . $foto) }}"></td>
                    @endforeach
                </tr>
                @endforeach
            </table>
            @endif
        </div>
        @endforeach
    </div>
    @endif

    <div class="section">
        <div class="section-title">{{ __('pdf.financial') }}</div>
        <table class="info-table">
            <tr>
                <td class="label">{{ __('pdf.inspection_value') }}</td>
                <td>{{ $pericia->moeda }} {{ number_format($pericia->valor_pericia, 2, ',', '.') }}</td>
            </tr>
            <tr>
                <td class="label">{{ __('pdf.repair_value') }}</td>
                <td>
                    {{ $pericia->moeda }}
                    {{ number_format($pericia->servico->primeiro_veiculo->preco_total ?? $pericia->servico->valor_total ?? 0, 2, ',', '.') }}
                </td>
            </tr>
        </table>
    </div>

    <div class="footer">{{ __('pdf.footer') }}</div>
</body>

</html>