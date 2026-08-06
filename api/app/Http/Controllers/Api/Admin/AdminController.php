<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\StoreAdminRequest;
use App\Http\Requests\Api\Admin\UpdateAdminRequest;
use App\Http\Resources\Api\Admin\AdminResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    public function index(Request $request)
    {
        $administradores = User::query()
            ->where('perfil', 'ADMIN')
            ->orderByRaw('id = ? DESC', [$request->user()->id])
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 20));

        return AdminResource::collection($administradores);
    }

    public function store(StoreAdminRequest $request)
    {
        $data = $request->validated();

        $administrador = User::create([
            'nome' => $data['nome'],
            'email' => strtolower($data['email']),
            'senha' => Hash::make($data['senha']),
            'perfil' => 'ADMIN',
            'ativo' => true,
        ]);

        return response()->json([
            'message' => __('main.admin_user_created_success'),
            'data' => new AdminResource($administrador),
        ], 201);
    }

    public function show(int $id)
    {
        $administrador = User::where('perfil', 'ADMIN')->find($id);

        if (!$administrador) {
            return response()->json(['message' => __('auth.user_not_found')], 404);
        }

        return response()->json(['data' => new AdminResource($administrador)]);
    }

    public function update(UpdateAdminRequest $request, int $id)
    {
        $administrador = User::where('perfil', 'ADMIN')->find($id);

        if (!$administrador) {
            return response()->json(['message' => __('auth.user_not_found')], 404);
        }

        $data = $request->validated();

        $administrador->update([
            'nome' => $data['nome'],
            'email' => strtolower($data['email']),
            'senha' => !empty($data['senha']) ? Hash::make($data['senha']) : $administrador->senha,
            'ativo' => $data['status'],
        ]);

        return response()->json([
            'message' => __('main.admin_user_updated_success'),
            'data' => new AdminResource($administrador->fresh()),
        ]);
    }
}
