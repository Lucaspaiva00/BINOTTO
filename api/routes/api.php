<?php

use App\Http\Controllers\Api\Admin\AdminController;
use App\Http\Controllers\Api\Admin\ContaPagarController;
use App\Http\Controllers\Api\Admin\ContaReceberController;
use App\Http\Controllers\Api\Admin\FluxoCaixaController;
use App\Http\Controllers\Api\Admin\LoginController;
use App\Http\Controllers\Api\Admin\PericiaController as AdminPericiaController;
use App\Http\Controllers\Api\Admin\ServicoController as AdminServicoController;
use App\Http\Controllers\Api\Admin\OficinaDocumentoController as AdminOficinaDocumentoController;
use App\Http\Controllers\Api\Admin\SuporteChamadoController as AdminSuporteChamadoController;
use App\Http\Controllers\Api\Admin\UsuarioController as AdminUsuarioController;
use App\Http\Controllers\Api\Mobile\AuthController;
use App\Http\Controllers\Api\Mobile\Oficina\OficinaDocumentoController;
use App\Http\Controllers\Api\Mobile\Oficina\OficinaPerfilController;
use App\Http\Controllers\Api\Mobile\Oficina\OficinaPericiaController;
use App\Http\Controllers\Api\Mobile\Oficina\OficinaServicoController;
use App\Http\Controllers\Api\Mobile\Oficina\OficinaTecnicoBloqueadoController;
use App\Http\Controllers\Api\Mobile\Oficina\OficinaTecnicoPreferidoController;
use App\Http\Controllers\Api\Mobile\OficinaController;
use App\Http\Controllers\Api\Mobile\PasswordController;
use App\Http\Controllers\Api\Mobile\PericiaController;
use App\Http\Controllers\Api\Mobile\SuporteController;
use App\Http\Controllers\Api\Mobile\Tecnico\TecnicoDocumentoController;
use App\Http\Controllers\Api\Mobile\Tecnico\TecnicoPerfilController;
use App\Http\Controllers\Api\Mobile\Tecnico\TecnicoPericiaController;
use App\Http\Controllers\Api\Mobile\Tecnico\TecnicoServicoController;
use App\Http\Controllers\Api\Mobile\UsuarioController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->middleware(['locale'])->group(function () {
    Route::post('/auth/login', [LoginController::class, 'login']);

    Route::middleware(['auth:api', 'permission:admin'])->group(function () {
        Route::prefix('usuarios')->group(function () {
            Route::get('/selecao', [AdminUsuarioController::class, 'listSelecao']);
            Route::get('/', [AdminUsuarioController::class, 'index']);
            Route::post('/', [AdminUsuarioController::class, 'store']);
            Route::get('/{id}', [AdminUsuarioController::class, 'show']);
            Route::put('/{id}', [AdminUsuarioController::class, 'update']);
            Route::patch('/{id}/status', [AdminUsuarioController::class, 'toggleStatus']);
            Route::put('/{id}/senha', [AdminUsuarioController::class, 'updatePassword']);
            Route::delete('/{id}', [AdminUsuarioController::class, 'destroy']);

            Route::get('/{id}/documentos', [AdminOficinaDocumentoController::class, 'index']);
            Route::post('/{id}/documentos', [AdminOficinaDocumentoController::class, 'store']);
            Route::delete('/{id}/documentos/{documentoId}', [AdminOficinaDocumentoController::class, 'destroy']);

            Route::get('/{id}/suporte', [AdminSuporteChamadoController::class, 'index']);
            Route::post('/{id}/suporte', [AdminSuporteChamadoController::class, 'store']);
            Route::post('/{id}/suporte/{chamadoId}/respostas', [AdminSuporteChamadoController::class, 'reply']);
            Route::patch('/{id}/suporte/{chamadoId}/fechar', [AdminSuporteChamadoController::class, 'close']);
        });

        Route::prefix('administradores')->group(function () {
            Route::get('/', [AdminController::class, 'index']);
            Route::post('/', [AdminController::class, 'store']);
            Route::get('/{id}', [AdminController::class, 'show']);
            Route::put('/{id}', [AdminController::class, 'update']);
        });

        Route::prefix('contas-receber')->group(function () {
            Route::get('/', [ContaReceberController::class, 'index']);
            Route::post('/', [ContaReceberController::class, 'store']);
            Route::get('/{id}', [ContaReceberController::class, 'show']);
            Route::put('/{id}', [ContaReceberController::class, 'update']);
            Route::delete('/{id}', [ContaReceberController::class, 'destroy']);
        });

        Route::prefix('contas-pagar')->group(function () {
            Route::get('/', [ContaPagarController::class, 'index']);
            Route::post('/', [ContaPagarController::class, 'store']);
            Route::get('/{id}', [ContaPagarController::class, 'show']);
            Route::put('/{id}', [ContaPagarController::class, 'update']);
            Route::delete('/{id}', [ContaPagarController::class, 'destroy']);
        });

        Route::get('/fluxo-caixa', [FluxoCaixaController::class, 'index']);

        Route::prefix('servicos')->group(function () {
            Route::get('/', [AdminServicoController::class, 'index']);
            Route::get('/{id}', [AdminServicoController::class, 'show']);
        });

        Route::prefix('pericias')->group(function () {
            Route::get('/', [AdminPericiaController::class, 'index']);
            Route::get('/{id}/pdf', [AdminPericiaController::class, 'generatePdf']);
            Route::get('/{id}', [AdminPericiaController::class, 'show']);
        });
    });
});

Route::prefix('mobile')->middleware(['locale'])->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/login/social', [AuthController::class, 'loginSocial']);
    Route::post('/auth/register/finalizar', [AuthController::class, 'completeRegistrationAndLogin']);
    Route::post('/auth/register/finalizar-social', [AuthController::class, 'completeRegistrationSocialAndLogin']);
    Route::post('/auth/register/tecnico', [UsuarioController::class, 'registerTecnico']);
    Route::post('/auth/register/oficina', [UsuarioController::class, 'registerOficina']);
    Route::post('/auth/register/social', [UsuarioController::class, 'registerSocial']);
    Route::post('/auth/password/recuperacao', [PasswordController::class, 'sendRecoveryCode']);
    Route::post('/auth/password/confirmar-codigo', [PasswordController::class, 'confirmRecoveryCode']);
    Route::post('/auth/password/resetar', [PasswordController::class, 'resetPassword']);

    Route::middleware(['auth:api'])->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::delete('/me', [UsuarioController::class, 'deleteAccount']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
        Route::put('/mudar-idioma', [AuthController::class, 'changeIdioma']);
        Route::post('/password/trocar-senha', [PasswordController::class, 'changePassword']);
        Route::post('/suporte/email', [SuporteController::class, 'sendEmailSupport']);

        Route::middleware(['permission:oficina'])->prefix('oficina')->group(function () {
            Route::prefix('perfil')->group(function () {
                Route::get('/', [OficinaPerfilController::class, 'index']);
                Route::get('/{id}', [OficinaPerfilController::class, 'show']);
                Route::put('/update', [OficinaPerfilController::class, 'update']);
            });

            Route::prefix('documentos')->group(function () {
                Route::get('/', [OficinaDocumentoController::class, 'index']);
                Route::get('/{id}', [OficinaDocumentoController::class, 'show']);
                Route::post('/store', [OficinaDocumentoController::class, 'store']);
                Route::delete('/{id}', [OficinaDocumentoController::class, 'destroy']);
            });

            Route::prefix('servicos')->group(function () {
                Route::get('/agenda', [OficinaServicoController::class, 'agendaCalendar']);
                Route::get('/pendentes', [OficinaServicoController::class, 'listPendentes']);
                Route::get('/historico', [OficinaServicoController::class, 'listHistorico']);
                Route::get('/', [OficinaServicoController::class, 'index']);
                Route::post('/', [OficinaServicoController::class, 'create']);
                Route::get('/{id}', [OficinaServicoController::class, 'show']);
                Route::post('/{id}', [OficinaServicoController::class, 'update']);
                Route::patch('/{id}/confirmar', [OficinaServicoController::class, 'confirm']);
                Route::patch('/{id}/rejeitar', [OficinaServicoController::class, 'reject']);
                Route::patch('/{id}/cancelar', [OficinaServicoController::class, 'cancel']);
                Route::get('/{id}/pdf', [OficinaServicoController::class, 'generatePdf']);
            });

            Route::prefix('tecnicos-preferidos')->group(function () {
                Route::get('/', [OficinaTecnicoPreferidoController::class, 'index']);
                Route::post('/adicionar', [OficinaTecnicoPreferidoController::class, 'addTecnico']);
                Route::delete('/{id}', [OficinaTecnicoPreferidoController::class, 'destroy']);
                Route::post('/pre-registro', [OficinaTecnicoPreferidoController::class, 'preRegisterTecnico']);
                Route::post('/verificar', [OficinaTecnicoPreferidoController::class, 'checkTechnician']);
            });

            Route::prefix('tecnicos-bloqueados')->group(function () {
                Route::get('/', [OficinaTecnicoBloqueadoController::class, 'index']);
                Route::post('/verificar', [OficinaTecnicoBloqueadoController::class, 'checkTechnician']);
                Route::post('/adicionar', [OficinaTecnicoBloqueadoController::class, 'addTecnico']);
                Route::delete('/{id}', [OficinaTecnicoBloqueadoController::class, 'destroy']);
            });

            Route::prefix('pericias')->group(function () {
                Route::get('/', [PericiaController::class, 'index']);
                Route::post('/', [OficinaPericiaController::class, 'store']);
                Route::post('/simples', [OficinaPericiaController::class, 'storeSimple']);
                Route::get('/{id}', [PericiaController::class, 'show']);
                Route::post('/{id}', [OficinaPericiaController::class, 'update']);
                Route::get('/{id}/pdf', [PericiaController::class, 'generatePdf']);
            });
        });

        Route::middleware(['permission:tecnico'])->prefix('tecnico')->group(function () {
            Route::prefix('perfil')->group(function () {
                Route::get('/', [TecnicoPerfilController::class, 'index']);
                Route::get('/{id}', [TecnicoPerfilController::class, 'show']);
                Route::put('/update', [TecnicoPerfilController::class, 'update']);
            });

            Route::prefix('documentos')->group(function () {
                Route::get('/', [TecnicoDocumentoController::class, 'index']);
                Route::get('/{id}', [TecnicoDocumentoController::class, 'show']);
                Route::post('/store', [TecnicoDocumentoController::class, 'store']);
                Route::delete('/{id}', [TecnicoDocumentoController::class, 'destroy']);
            });

            Route::prefix('servicos')->group(function () {
                Route::get('/agenda', [TecnicoServicoController::class, 'agendaCalendar']);
                Route::get('/concluidos', [TecnicoServicoController::class, 'listConcluidos']);
                Route::get('/', [TecnicoServicoController::class, 'index']);
                Route::patch('/{id}/aceitar', [TecnicoServicoController::class, 'accept']);
                Route::patch('/{id}/cancelar-aceitacao', [TecnicoServicoController::class, 'cancelAccept']);
                Route::patch('/{id}/recusar', [TecnicoServicoController::class, 'refuse']);
                Route::get('/{id}', [TecnicoServicoController::class, 'show']);
                Route::get('/{oficinaId}/simultaneos', [TecnicoServicoController::class, 'getSimultaneousServices']);
                Route::post('/iniciar', [TecnicoServicoController::class, 'startCar']);
                Route::post('/{periciaId}/iniciar-via-pericia', [TecnicoServicoController::class, 'startCarFromInspection']);
                Route::post('/{id}/salvar-execucao', [TecnicoServicoController::class, 'saveExecution']);
                Route::post('/{id}/finaliza-execucao', [TecnicoServicoController::class, 'onlyFinishExecution']);
                Route::get('/{id}/pdf', [TecnicoServicoController::class, 'generatePdf']);
            });

            Route::prefix('oficinas')->group(function () {
                Route::get('/', [OficinaController::class, 'listOficinas']);
            });

            Route::prefix('pericias')->group(function () {
                Route::get('/', [PericiaController::class, 'index']);
                Route::post('/', [TecnicoPericiaController::class, 'store']);
                Route::post('/simples', [TecnicoPericiaController::class, 'storeSimple']);
                Route::get('/buscar-por-placa', [TecnicoPericiaController::class, 'searchByPlate']);
                Route::get('/{id}', [PericiaController::class, 'show']);
                Route::post('/{id}', [TecnicoPericiaController::class, 'update']);
                Route::get('/placa/{placa}', [TecnicoPericiaController::class, 'showByPlate']);
                Route::get('/{id}/pdf', [PericiaController::class, 'generatePdf']);
            });
        });
    });
});

// ROTA DEV
Route::post('/dev/setup-database', function (Request $request) {
    $password = $request->input('password');

    if ($password !== 'Z4*n0BL2_9') {
        return response()->json([
            'message' => 'Unauthorized',
        ], 403);
    }

    // limpa cache/otimizações
    Artisan::call('optimize:clear');

    // roda migrations e seeders
    // Artisan::call('migrate:fresh', [
    //     '--seed' => true,
    //     '--force' => true,
    // ]);

    // roda migrations
    Artisan::call('migrate');

    return response()->json([
        'message' => 'Database migrated and seeded successfully',
        'migrate_output' => Artisan::output(),
    ]);
});
