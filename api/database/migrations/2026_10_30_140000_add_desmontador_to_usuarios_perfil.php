<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // PostgreSQL uses a CHECK constraint for Laravel enum columns.
        // Replace only constraints that restrict usuarios.perfil, preserving unrelated checks.
        $checks = DB::select(<<<'SQL'
            SELECT c.conname
            FROM pg_constraint c
            JOIN pg_class t ON t.oid = c.conrelid
            JOIN pg_namespace n ON n.oid = t.relnamespace
            WHERE t.relname = 'usuarios'
              AND n.nspname = current_schema()
              AND c.contype = 'c'
              AND pg_get_constraintdef(c.oid) LIKE '%perfil%'
        SQL);

        foreach ($checks as $check) {
            $name = str_replace('"', '""', $check->conname);
            DB::statement('ALTER TABLE usuarios DROP CONSTRAINT "' . $name . '"');
        }

        DB::statement("ALTER TABLE usuarios ADD CONSTRAINT usuarios_perfil_check CHECK (perfil IN ('TECNICO', 'OFICINA', 'ADMIN', 'DESMONTADOR'))");
    }

    public function down(): void
    {
        if (DB::table('usuarios')->where('perfil', 'DESMONTADOR')->exists()) {
            throw new \RuntimeException('Não é possível reverter: existem usuários DESMONTADOR.');
        }

        DB::statement('ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_perfil_check');
        DB::statement("ALTER TABLE usuarios ADD CONSTRAINT usuarios_perfil_check CHECK (perfil IN ('TECNICO', 'OFICINA', 'ADMIN'))");
    }
};
