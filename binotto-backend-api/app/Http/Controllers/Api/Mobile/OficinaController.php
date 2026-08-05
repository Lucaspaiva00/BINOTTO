<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Models\Oficina;
use Illuminate\Http\Request;

class OficinaController extends Controller
{
    public function listOficinas(Request $request)
    {
        $oficinas = Oficina::all();

        return response()->json([
            'success' => true,
            'data' => $oficinas,
        ]);
    }
}
