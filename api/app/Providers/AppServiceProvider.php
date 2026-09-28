<?php

namespace App\Providers;

use Illuminate\Routing\UrlGenerator;
use App\Models\Pericia;
use App\Models\Servico;
use App\Observers\ServicoStatusObserver;
use App\Observers\PericiaStatusObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(UrlGenerator $url): void
    {
        Servico::observe(ServicoStatusObserver::class);
        Pericia::observe(PericiaStatusObserver::class);
        if (in_array(env('APP_ENV'), ['production', 'homolog'], true)) {
            $url->forceScheme('https');
        }
    }
}
