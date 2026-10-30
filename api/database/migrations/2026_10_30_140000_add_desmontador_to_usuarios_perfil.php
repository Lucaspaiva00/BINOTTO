<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // MySQL ENUM requires an explicit alteration; preserve existing role values.
        DB::statement("ALTER TABLE usuarios MODIFY COLUMN perfil ENUM('TECNICO', 'OFICINA', 'ADMIN', 'DESMONTADOR') NOT NULL");
    }

    public function down(): void
    {
        // Do not silently invalidate existing dismantler accounts on rollback.
        if (DB::table('usuarios')->where('perfil', 'DESMONTADOR')->exists()) {
            throw new \RuntimeException('Não é possível reverter: existem usuários DESMONTADOR.');
        }
        DB::statement("ALTER TABLE usuarios MODIFY COLUMN perfil ENUM('TECNICO', 'OFICINA', 'ADMIN') NOT NULL");
    }
};
