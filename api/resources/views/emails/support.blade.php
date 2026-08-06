<!DOCTYPE html>
<html lang="pt">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solicitação de Suporte - Binotto PDR</title>

    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet">

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Inter, sans-serif;
            background: #000;
            color: #f5f5f5;
            line-height: 1.6;
            padding: 32px 0;
        }

        .container {
            max-width: 620px;
            margin: auto;
            background: #0a0a0a;
            border: 1px solid #1f1f1f;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 35px rgba(0,0,0,.45);
        }

        .header {
            background: linear-gradient(135deg,#111,#000);
            padding: 32px;
            text-align: center;
            border-bottom: 1px solid rgba(249,184,0,.3);
        }

        .logo {
            font-size: 30px;
            font-weight: 800;
            letter-spacing: -.5px;
            background: linear-gradient(135deg,#fff 30%,#f9b800 80%);
            color: #000;
        }

        .logo-sub {
            margin-top: 6px;
            color: #999;
            font-size: 12px;
            letter-spacing: 1px;
        }

        .content {
            padding: 32px;
        }

        .title {
            color: #f9b800;
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 24px;
        }

        .card {
            background: #111;
            border: 1px solid #232323;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 24px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        td {
            padding: 12px 0;
            border-bottom: 1px solid #242424;
            vertical-align: top;
            font-size: 14px;
            color: white;
        }

        td:first-child {
            width: 180px;
            color: white;
            font-weight: 600;
        }

        td:last-child {
            color: #fff;
        }

        .label {
            color: #999;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 10px;
        }

        .message {
            background: #050505;
            border: 1px solid #232323;
            border-radius: 16px;
            padding: 16px;
            white-space: pre-wrap;
            color: #eee;
            font-size: 15px;
        }

        .footer {
            background: #030303;
            border-top: 1px solid #1c1c1c;
            padding: 24px;
            text-align: center;
            color: #777;
            font-size: 12px;
        }

        .badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 999px;
            background: rgba(249,184,0,.15);
            border: 1px solid rgba(249,184,0,.4);
            color: #f9b800;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 18px;
        }

        a {
            color: #f9b800;
            text-decoration: none;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <div class="logo">BINOTTO PDR</div>
            <div class="logo-sub">
                automotive expertise · paintless dent repair
            </div>
        </div>

        <div class="content">
            <div class="title">
                📩 Nova solicitação de suporte
            </div>

            <div class="card">
                <table>
                    <tr>
                        <td>Assunto</td>
                        <td>{{ $subject }}</td>
                    </tr>

                    <tr>
                        <td>Nome</td>
                        <td>{{ $name ?? '-' }}</td>
                    </tr>

                    <tr>
                        <td>E-mail</td>
                        <td>
                            <span style="color:#f9b800;">{{ $user?->email ?? '-' }}</span>
                        </td>
                    </tr>

                    <tr>
                        <td>ID do usuário</td>
                        <td>{{ $user?->id ?? '-' }}</td>
                    </tr>

                    <tr>
                        <td>Data</td>
                        <td>{{ now()->format('d/m/Y H:i:s') }}</td>
                    </tr>

                    <tr>
                        <td>IP</td>
                        <td>{{ request()->ip() }}</td>
                    </tr>

                    <tr>
                        <td>User Agent</td>
                        <td style="font-size:12px">
                            {{ request()->userAgent() }}
                        </td>
                    </tr>
                </table>
            </div>

            <div class="label">
                Mensagem enviada
            </div>

            <div class="message">
                {{ $content }}
            </div>
        </div>

        <div class="footer">
            <p><strong>Binotto PDR</strong></p>

            <p style="margin-top:8px">
                admin@jbinotto.com &nbsp;|&nbsp; +39 348 421 7201
            </p>

            <p style="margin-top:10px">
                Via Provinciale, 47 · 15010 Prasco (AL) · Italy
            </p>
        </div>
    </div>
</body>

</html>
