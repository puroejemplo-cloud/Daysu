INSERT INTO admin_users (username, email, password, full_name, suffix, role, is_active, created_at, updated_at, created_by)
VALUES (
  'AuraEs',
  'auraes@auraproduciones.com',
  '$2b$12$JdOV/sxLQlFoQ8tmKcX07.163/aPgmkJA37gTtwuoEs6uFrXJuD7O',
  'Aura Es',
  'AUR',
  'admin',
  true,
  NOW(), NOW(),
  1
)
ON CONFLICT (username) DO NOTHING
RETURNING id, username, full_name, suffix, role;
