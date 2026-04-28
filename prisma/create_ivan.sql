INSERT INTO admin_users (username, email, password, full_name, suffix, role, is_active, created_at, updated_at, created_by)
VALUES (
  'ivan',
  'ivan@auraproduciones.com',
  '$2b$12$nOXsjT3lSVV1lMnNLn8PgeIZ9b.IrIo4k8HZZu/xE/xl8ZiO2KBdm',
  'Ivan DJ Events',
  'IVN',
  'admin',
  true,
  NOW(), NOW(),
  1
)
ON CONFLICT (username) DO NOTHING
RETURNING id, username, full_name, suffix, role;
