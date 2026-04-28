-- 1. Crear admin Daysu (si no existe)
INSERT INTO admin_users (username, email, password, full_name, suffix, role, is_active, created_at, updated_at, created_by)
VALUES (
  'daysu',
  'daysu@auraproduciones.com',
  '$2b$12$tULZVAmacSirdtVF7pdOLOE0l2REEE1tBS92RDx.T0XuLH7NyvOSm',
  'Daysu Hernandez',
  'DAY',
  'admin',
  true,
  NOW(), NOW(),
  1
)
ON CONFLICT (username) DO NOTHING;

-- 2. Obtener el ID del admin Daysu y asignar todos los activos existentes
UPDATE assets
SET
  owner_admin_id = (SELECT id FROM admin_users WHERE suffix = 'DAY'),
  owner_suffix   = 'DAY'
WHERE owner_admin_id IS NULL;

-- Verificar
SELECT
  (SELECT id FROM admin_users WHERE suffix = 'DAY') AS daysu_id,
  COUNT(*) AS activos_asignados
FROM assets
WHERE owner_suffix = 'DAY';
