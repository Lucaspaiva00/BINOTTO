<?php

$key = $_GET['k'] ?? null;
if (is_null($key))
    $key = $argv[1] ?? null;

if ($key == '098a80dc9dfcdd4b8d4b6803320cb274') {

    if (php_sapi_name() != "cli") {
        header('Content-Type:text/plain');
    }

    echo 'Iniciando deploy' . PHP_EOL;
    echo '=======' . PHP_EOL;

    echo 'Atualizando o repositório' . PHP_EOL;
    passthru('git pull');
    echo 'OK' . PHP_EOL;
    echo '=======' . PHP_EOL;

    echo 'Otimizando laravel' . PHP_EOL;
    echo passthru('/usr/bin/php8.2 ../artisan optimize:clear');
    echo 'OK' . PHP_EOL;
    echo '=======' . PHP_EOL;
}

echo 'Deploy finalizado!' . PHP_EOL;