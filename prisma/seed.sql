-- Configuración del sistema
INSERT INTO system_settings (key, value, updated_at)
VALUES ('payment_hold_hours', '48', NOW())
ON CONFLICT (key) DO NOTHING;

-- Categorías base de activos
INSERT INTO asset_categories (name, description, created_at)
VALUES
  ('Sonido',           'Equipos de audio, bocinas, micrófonos y accesorios', NOW()),
  ('Cabinas',          'Cabinas DJ, iluminación y periféricos',               NOW()),
  ('Carritos de Comida','Carritos, stands gastronómicos y accesorios',        NOW()),
  ('Mobiliario',       'Mesas, sillas, carpas y decoración',                  NOW()),
  ('Componentes',      'Cables, bases y accesorios internos (no rentables directamente)', NOW())
ON CONFLICT DO NOTHING;

SELECT 'Seed completado' AS status;
