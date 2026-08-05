<!DOCTYPE html>
<html lang="{{ $locale ?? 'pt' }}">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperação de senha - Binotto PDR</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: #000000;
            color: #f0f0f0;
            line-height: 1.5;
            padding: 2rem 0;
        }

        .container {
            max-width: 560px;
            margin: 0 auto;
            background-color: #0a0a0a;
            border-radius: 2rem;
            border: 1px solid #1f1f1f;
            overflow: hidden;
            box-shadow: 0 20px 35px -12px rgba(0, 0, 0, 0.5);
        }

        .header {
            background: linear-gradient(135deg, #111111 0%, #000000 100%);
            padding: 2rem 2rem 1.2rem;
            text-align: center;
            border-bottom: 1px solid rgba(249, 184, 0, 0.3);
        }

        .logo {
            font-size: 1.8rem;
            font-weight: 800;
            letter-spacing: -0.5px;
            background: linear-gradient(135deg, #ffffff 30%, #f9b800 80%);
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            margin-bottom: 0.25rem;
        }

        .logo-sub {
            font-size: 0.7rem;
            opacity: 0.7;
            letter-spacing: 1px;
        }

        .content {
            padding: 2rem;
        }

        .code-box {
            background: #000000;
            border: 1px solid #2a2a2a;
            border-radius: 1.5rem;
            padding: 1.2rem;
            text-align: center;
            margin: 1.8rem 0;
        }

        .code-label {
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #f9b800;
            font-weight: 600;
        }

        .code {
            font-size: 2.8rem;
            font-weight: 800;
            letter-spacing: 6px;
            color: #f9b800;
            background: #0c0c0c;
            display: inline-block;
            padding: 0.5rem 1.2rem;
            border-radius: 1rem;
            font-family: monospace;
            margin-top: 0.6rem;
        }

        .expiry {
            font-size: 0.75rem;
            color: #aaaaaa;
            text-align: center;
            margin-top: 1rem;
        }

        .footer {
            background-color: #030303;
            padding: 1.5rem;
            text-align: center;
            font-size: 0.7rem;
            color: #777;
            border-top: 1px solid #1c1c1c;
        }

        hr {
            border-color: #222;
            margin: 1rem 0;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <div class="logo">BINOTTO PDR</div>
            <div class="logo-sub">automotive expertise · paintless dent repair</div>
        </div>

        <div class="content">
            @php
            // Traduções disponíveis
            $translations = [
            'pt' => [
            'title' => '🔐 Código de verificação',
            'expiry_message' => '⏱️ Este código expira em 10 minutos.',
            'ignore_message' => 'Se você não solicitou a recuperação de senha, ignore este e-mail. Nenhuma alteração será feita na sua conta.',
            'footer_text' => 'Gestão de Perícias Automotivas'
            ],
            'it' => [
            'title' => '🔐 Codice di verifica',
            'expiry_message' => '⏱️ Questo codice scade tra 10 minuti.',
            'ignore_message' => 'Se non hai richiesto il reset della password, ignora questa email. Nessuna modifica sarà apportata al tuo account.',
            'footer_text' => 'Gestione Perizie Automobilistiche'
            ],
            'fr' => [
            'title' => '🔐 Code de vérification',
            'expiry_message' => '⏱️ Ce code expire dans 10 minutes.',
            'ignore_message' => 'Si vous n\'avez pas demandé la réinitialisation du mot de passe, ignorez cet e-mail. Aucune modification ne sera apportée à votre compte.',
            'footer_text' => 'Gestion d\'Expertises Automobiles'
            ]
            ];
            $locale = $locale ?? 'pt';
            $text = $translations[$locale] ?? $translations['pt'];
            @endphp

            <div class="code-box">
                <div class="code-label">{{ $text['title'] }}</div>
                <div class="code">{{ $codigo }}</div>
                <div class="expiry">{{ $text['expiry_message'] }}</div>
            </div>

            <p style="font-size: 0.85rem; opacity: 0.8; text-align: center;">{{ $text['ignore_message'] }}</p>
        </div>

        <div class="footer">
            <p>© 2025 Binotto PDR · {{ $text['footer_text'] }}</p>
            <p style="margin-top: 6px;">
                <i class="fas fa-envelope"></i> admin@jbinotto.com &nbsp;|&nbsp;
                <i class="fas fa-phone-alt"></i> +39 348 421 7201
            </p>
            <p style="margin-top: 10px; font-size: 0.65rem;">Via provinciale, 47 · 15010 Prasco (AL) Italy</p>
        </div>
    </div>
</body>

</html>