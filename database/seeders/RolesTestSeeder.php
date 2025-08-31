<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class RolesTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Only seed test roles in local/testing environments
        if (! app()->environment(['local', 'testing'])) {
            return;
        }

        // Create 50 test roles with random permissions
        \Database\Factories\RoleFactory::new()->count(50)->create();

        $this->command->info('Created 50 test roles with random permissions');
    }
}
