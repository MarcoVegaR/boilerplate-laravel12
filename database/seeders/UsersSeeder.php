<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
    /**
     * Seed the application's default admin user.
     */
    public function run(): void
    {
        $email = 'test@mailinator.com';

        $user = User::query()->where('email', $email)->first();

        if (! $user) {
            $user = User::create([
                'name' => 'Admin',
                'email' => $email,
                // puedes usar el cast 'hashed' o Hash::make; ambos funcionan
                'password' => Hash::make('12345678'),
            ]);
        }

        if (! $user->hasRole('admin')) {
            $user->assignRole('admin');
        }
    }
}
