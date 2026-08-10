<?php

$frontendUrl = rtrim((string) env('FRONTEND_URL', ''), '/');

return [
    'paths' => ['api/*', 'auth/*', 'sanctum/csrf-cookie', 'up', '*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter([
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://binotto-web.onrender.com',
        $frontendUrl !== '' ? $frontendUrl : null,
    ])),

    'allowed_origins_patterns' => [
        '#^https://.*\.onrender\.com$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
