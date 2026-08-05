<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return [
        'api' => 'Binotto API',
        'date' => date('Y-m-d H:i:s'),
        'api-version' => '0.0.1',
    ];
});