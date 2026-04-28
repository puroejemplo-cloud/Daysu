-- ═══════════════════════════════════════════════════════════════
-- SEED PRODUCTOS — Sonido Daysu / DJ Iván Events
-- ═══════════════════════════════════════════════════════════════

-- ── 1. CATEGORÍAS ───────────────────────────────────────────────
INSERT INTO asset_categories (name, description, created_at)
VALUES
  ('Paquetes',           'Paquetes de evento completos — Audio, DJ, Iluminación y Shows', NOW()),
  ('Add-ons',            'Servicios adicionales que se agregan a cualquier paquete',       NOW())
ON CONFLICT DO NOTHING;

-- ── 2. COMPONENTES DE SERVICIO (is_rentable = false) ────────────
-- Estos no aparecen en el catálogo; son las piezas internas de cada paquete.

INSERT INTO assets (category_id, name, sku, description, total_units, daily_rate, is_rentable, is_active, created_at, updated_at)
SELECT c.id, v.name, v.sku, v.description, 1, 0, false, true, NOW(), NOW()
FROM asset_categories c,
(VALUES
  ('Componentes', 'DJ Versátil',                        'COMP-DJ-VERS',    'DJ mezclando en vivo, varios géneros musicales para todo público'),
  ('Componentes', 'Audio básico profesional',           'COMP-AUDIO-BAS',  'Sistema de audio básico profesional, cubre hasta 200 personas'),
  ('Componentes', 'Audio profesional',                  'COMP-AUDIO-PRO',  'Audio profesional con capacidad para hasta 200 invitados'),
  ('Componentes', 'Audio profesional completo',         'COMP-AUDIO-COMP', 'Audio profesional completo, capacidad de 50 a 500 invitados'),
  ('Componentes', 'Cabina DJ Led Pixel',                'COMP-CABINA-LED', 'Cabina de DJ con pantalla led pixel'),
  ('Componentes', 'DJ Booth VIP',                       'COMP-BOOTH-VIP',  'Moderna y elegante cabina VIP para DJ'),
  ('Componentes', 'Iluminación básica',                 'COMP-ILUM-BAS',   'Iluminación básica para eventos de día o pequeños'),
  ('Componentes', 'Iluminación profesional escenario',  'COMP-ILUM-ESC',   'Iluminación de escenario básica'),
  ('Componentes', 'Iluminación profesional completa',   'COMP-ILUM-COMP',  '4 mini robótica, 4 arquitectónica, 2 wash led, 2 beam 7R, máquina de humo, laser, estrobo'),
  ('Componentes', 'Show Robot Led',                     'COMP-ROBOT-LED',  'Show Robot Led — incluye botella de tequila para shots y pirotecnia fría'),
  ('Componentes', 'Souvenirs básico',                   'COMP-SOUV-BAS',   'Souvenirs de animación — globos'),
  ('Componentes', 'Souvenirs premium',                  'COMP-SOUV-PREM',  'Regalos sorpresa — globos, antifaces, sombreros, corbatas'),
  ('Componentes', 'Show Cabezones (1 a elegir)',         'COMP-CABEZ-1',    'Show Cabezones — 1 a elegir: Luis Miguel, Jaime Duende, Abelito, Bad Bunny'),
  ('Componentes', 'Show Cabezones (2 a elegir)',         'COMP-CABEZ-2',    'Show Cabezones — 2 a elegir: Luis Miguel, Jaime Duende, Abelito, Bad Bunny'),
  ('Componentes', 'Maestro de Ceremonias',              'COMP-MC',         'Dirige vals y ameniza el evento'),
  ('Componentes', 'Proyección de Video',                'COMP-VIDEO-PRO',  'Proyección digital'),
  ('Componentes', 'Video Semblanza',                    'COMP-VIDEO-SEM',  'Presentación animada musicalizada con fotografías y videos del festejado (gratis)'),
  ('Componentes', 'Pirotecnia Inalámbrica 4 chisperos', 'COMP-PIROT-4',    '4 chisperos de pirotecnia fría'),
  ('Componentes', 'Pirotecnia Inalámbrica 6 chisperos', 'COMP-PIROT-6',    '6 chisperos de pirotecnia fría'),
  ('Componentes', 'Animadores Caracterizados',          'COMP-ANIM',       'Personal amenizando con botargas: perrito, gorila, caballito, tiburón, luchador, máscaras'),
  ('Componentes', 'Limbo Shot',                         'COMP-LIMBO',      'Juego de limbo con shots incluidos'),
  ('Componentes', 'Carrito 200 Shots',                  'COMP-SHOTS-200',  'Carrito con 200 shots — piña colada, pantera rosa, vampiro'),
  ('Componentes', 'Carrito 250 Shots',                  'COMP-SHOTS-250',  'Carrito con 250 shots — piña colada, pantera rosa, vampiro'),
  ('Componentes', 'Shot Jeringas',                      'COMP-JERINGAS',   'Servicio de shots en jeringas'),
  ('Componentes', 'Tatoo & Glitter',                    'COMP-TATOO',      'Tatuajes temporales personalizados y glitter'),
  ('Componentes', 'Arlequín en Zancos',                 'COMP-ARLEQUIN',   'Arlequín en zancos — media hora de servicio'),
  ('Componentes', 'Vals en las Nubes Doble',            'COMP-VALS-DBL',   'Efecto vals en las nubes doble — humo niebla sobre el piso'),
  ('Componentes', 'Vals en las Nubes Sencillo',         'COMP-VALS-SNC',   'Efecto vals en las nubes sencillo — humo niebla sobre el piso'),
  ('Componentes', 'Cañón de Confeti Metalizado',        'COMP-CANON',      'Cañón de confeti metalizado — 1 disparo')
) AS v(cat_name, name, sku, description)
WHERE c.name = v.cat_name
ON CONFLICT (sku) DO NOTHING;

-- ── 3. PAQUETES RENTABLES ────────────────────────────────────────
INSERT INTO assets (category_id, name, sku, description, total_units, daily_rate, is_rentable, is_active, created_at, updated_at)
SELECT c.id, v.name, v.sku, v.description, 1, v.price, true, true, NOW(), NOW()
FROM asset_categories c,
(VALUES
  ('Paquetes', 'Paquete Básico',      'PKG-BASICO',      'Audio & DJ + Souvenirs. Ideal para eventos de día, bautizos y cumpleaños. Hasta 200 personas, 5 hrs + 1 de recepción.',       4600),
  ('Paquetes', 'Paquete Mediano',     'PKG-MEDIANO',     'Audio & DJ + Iluminación básica + Show Robot Led + Souvenirs. Hasta 200 personas, 5 hrs + 1 de recepción.',                   8000),
  ('Paquetes', 'Paquete Premium',     'PKG-PREMIUM',     'DJ profesional + Audio + Iluminación + Show Cabezones + Robot Led + Maestro de ceremonias + Video. Hasta 200 px.',           14500),
  ('Paquetes', 'Paquete Master VIP',  'PKG-MASTER-VIP',  'Setup completo VIP: Audio 500 px + Iluminación profesional + Shows + Carrito 200 shots + Animadores. 5 hrs + 1 recepción.', 19000),
  ('Paquetes', 'Paquete Snack Tatoo', 'PKG-SNACK-TATOO', 'El más completo: Snack Tatoo + Carrito 250 shots + Vals doble + Arlequín + Cañón confeti + todos los shows.',               24000),
  ('Paquetes', 'Paquete Diamante',    'PKG-DIAMANTE',    'Paquete Diamante: Carrito 250 shots + Vals sencillo + Arlequín + Cañón confeti + todos los shows premium.',                  21500)
) AS v(cat_name, name, sku, description, price)
WHERE c.name = v.cat_name
ON CONFLICT (sku) DO NOTHING;

-- ── 4. ADD-ONS RENTABLES ─────────────────────────────────────────
INSERT INTO assets (category_id, name, sku, description, total_units, daily_rate, is_rentable, is_active, created_at, updated_at)
SELECT c.id, v.name, v.sku, v.description, 1, v.price, true, true, NOW(), NOW()
FROM asset_categories c,
(VALUES
  ('Add-ons', 'Pista de Baile LED Cristal 5×5',     'ADDON-PISTA-LED',  'Pista de baile led cristal infinito 5×5 mts. Se agrega a cualquier paquete.',    8000),
  ('Add-ons', 'Carrito Maruchanfest (50 personas)',  'ADDON-MARUCHAN',   'Carrito maruchanfest para 50 personas. Add-on especial del Paquete Snack Tatoo.', 2000)
) AS v(cat_name, name, sku, description, price)
WHERE c.name = v.cat_name
ON CONFLICT (sku) DO NOTHING;

-- ── 5. BOM — COMPONENTES POR PAQUETE ────────────────────────────
-- Función auxiliar para insertar con lookup por SKU
INSERT INTO asset_components (parent_asset_id, child_asset_id, quantity, is_required)
SELECT p.id, c.id, 1, true
FROM assets p, assets c
WHERE (p.sku, c.sku) IN (
  -- PAQUETE BÁSICO
  ('PKG-BASICO', 'COMP-DJ-VERS'),
  ('PKG-BASICO', 'COMP-AUDIO-BAS'),
  ('PKG-BASICO', 'COMP-CABINA-LED'),
  ('PKG-BASICO', 'COMP-SOUV-BAS'),
  -- PAQUETE MEDIANO
  ('PKG-MEDIANO', 'COMP-DJ-VERS'),
  ('PKG-MEDIANO', 'COMP-AUDIO-BAS'),
  ('PKG-MEDIANO', 'COMP-CABINA-LED'),
  ('PKG-MEDIANO', 'COMP-ILUM-BAS'),
  ('PKG-MEDIANO', 'COMP-SOUV-BAS'),
  ('PKG-MEDIANO', 'COMP-ROBOT-LED'),
  -- PAQUETE PREMIUM
  ('PKG-PREMIUM', 'COMP-DJ-VERS'),
  ('PKG-PREMIUM', 'COMP-AUDIO-PRO'),
  ('PKG-PREMIUM', 'COMP-CABINA-LED'),
  ('PKG-PREMIUM', 'COMP-ILUM-ESC'),
  ('PKG-PREMIUM', 'COMP-CABEZ-1'),
  ('PKG-PREMIUM', 'COMP-SOUV-PREM'),
  ('PKG-PREMIUM', 'COMP-ROBOT-LED'),
  ('PKG-PREMIUM', 'COMP-MC'),
  ('PKG-PREMIUM', 'COMP-VIDEO-PRO'),
  ('PKG-PREMIUM', 'COMP-VIDEO-SEM'),
  ('PKG-PREMIUM', 'COMP-PIROT-4'),
  -- PAQUETE MASTER VIP
  ('PKG-MASTER-VIP', 'COMP-DJ-VERS'),
  ('PKG-MASTER-VIP', 'COMP-AUDIO-COMP'),
  ('PKG-MASTER-VIP', 'COMP-BOOTH-VIP'),
  ('PKG-MASTER-VIP', 'COMP-ILUM-COMP'),
  ('PKG-MASTER-VIP', 'COMP-SOUV-PREM'),
  ('PKG-MASTER-VIP', 'COMP-CABEZ-2'),
  ('PKG-MASTER-VIP', 'COMP-ROBOT-LED'),
  ('PKG-MASTER-VIP', 'COMP-MC'),
  ('PKG-MASTER-VIP', 'COMP-VIDEO-PRO'),
  ('PKG-MASTER-VIP', 'COMP-VIDEO-SEM'),
  ('PKG-MASTER-VIP', 'COMP-PIROT-6'),
  ('PKG-MASTER-VIP', 'COMP-ANIM'),
  ('PKG-MASTER-VIP', 'COMP-LIMBO'),
  ('PKG-MASTER-VIP', 'COMP-SHOTS-200'),
  -- PAQUETE SNACK TATOO
  ('PKG-SNACK-TATOO', 'COMP-DJ-VERS'),
  ('PKG-SNACK-TATOO', 'COMP-AUDIO-COMP'),
  ('PKG-SNACK-TATOO', 'COMP-BOOTH-VIP'),
  ('PKG-SNACK-TATOO', 'COMP-ILUM-COMP'),
  ('PKG-SNACK-TATOO', 'COMP-SOUV-PREM'),
  ('PKG-SNACK-TATOO', 'COMP-CABEZ-2'),
  ('PKG-SNACK-TATOO', 'COMP-LIMBO'),
  ('PKG-SNACK-TATOO', 'COMP-JERINGAS'),
  ('PKG-SNACK-TATOO', 'COMP-TATOO'),
  ('PKG-SNACK-TATOO', 'COMP-ROBOT-LED'),
  ('PKG-SNACK-TATOO', 'COMP-MC'),
  ('PKG-SNACK-TATOO', 'COMP-VIDEO-PRO'),
  ('PKG-SNACK-TATOO', 'COMP-VIDEO-SEM'),
  ('PKG-SNACK-TATOO', 'COMP-PIROT-6'),
  ('PKG-SNACK-TATOO', 'COMP-ANIM'),
  ('PKG-SNACK-TATOO', 'COMP-ARLEQUIN'),
  ('PKG-SNACK-TATOO', 'COMP-VALS-DBL'),
  ('PKG-SNACK-TATOO', 'COMP-CANON'),
  ('PKG-SNACK-TATOO', 'COMP-SHOTS-250'),
  -- PAQUETE DIAMANTE
  ('PKG-DIAMANTE', 'COMP-DJ-VERS'),
  ('PKG-DIAMANTE', 'COMP-AUDIO-COMP'),
  ('PKG-DIAMANTE', 'COMP-BOOTH-VIP'),
  ('PKG-DIAMANTE', 'COMP-ILUM-COMP'),
  ('PKG-DIAMANTE', 'COMP-SOUV-PREM'),
  ('PKG-DIAMANTE', 'COMP-CABEZ-2'),
  ('PKG-DIAMANTE', 'COMP-LIMBO'),
  ('PKG-DIAMANTE', 'COMP-JERINGAS'),
  ('PKG-DIAMANTE', 'COMP-ROBOT-LED'),
  ('PKG-DIAMANTE', 'COMP-MC'),
  ('PKG-DIAMANTE', 'COMP-VIDEO-PRO'),
  ('PKG-DIAMANTE', 'COMP-VIDEO-SEM'),
  ('PKG-DIAMANTE', 'COMP-PIROT-6'),
  ('PKG-DIAMANTE', 'COMP-ANIM'),
  ('PKG-DIAMANTE', 'COMP-ARLEQUIN'),
  ('PKG-DIAMANTE', 'COMP-VALS-SNC'),
  ('PKG-DIAMANTE', 'COMP-CANON'),
  ('PKG-DIAMANTE', 'COMP-SHOTS-250')
)
ON CONFLICT (parent_asset_id, child_asset_id) DO NOTHING;

-- ── 6. REGLAS DE UPSELLING ───────────────────────────────────────
-- Todos los paquetes → sugerir Pista de Baile LED
INSERT INTO upsell_rules (source_asset_id, suggested_asset_id, discount_percent, label, is_active, created_at)
SELECT p.id, addon.id, 0, '🪩 ¡Hazlo memorable! Agrega la Pista de Baile LED Cristal 5×5 mts.', true, NOW()
FROM assets p, assets addon
WHERE p.sku IN ('PKG-BASICO','PKG-MEDIANO','PKG-PREMIUM','PKG-MASTER-VIP','PKG-SNACK-TATOO','PKG-DIAMANTE')
  AND addon.sku = 'ADDON-PISTA-LED'
ON CONFLICT (source_asset_id, suggested_asset_id) DO NOTHING;

-- Paquete Snack Tatoo → sugerir Maruchanfest
INSERT INTO upsell_rules (source_asset_id, suggested_asset_id, discount_percent, label, is_active, created_at)
SELECT p.id, addon.id, 0, '🍜 Agrega el Carrito Maruchanfest para 50 personas a tu Snack Tatoo.', true, NOW()
FROM assets p, assets addon
WHERE p.sku = 'PKG-SNACK-TATOO'
  AND addon.sku = 'ADDON-MARUCHAN'
ON CONFLICT (source_asset_id, suggested_asset_id) DO NOTHING;

-- Paquetes básico/mediano → sugerir upgrade Premium
INSERT INTO upsell_rules (source_asset_id, suggested_asset_id, discount_percent, label, is_active, created_at)
SELECT p.id, sug.id, 0, '⭐ ¡Dale más a tu evento! El Paquete Premium incluye Show Robot Led y Maestro de Ceremonias.', true, NOW()
FROM assets p, assets sug
WHERE p.sku = 'PKG-BASICO' AND sug.sku = 'PKG-MEDIANO'
ON CONFLICT (source_asset_id, suggested_asset_id) DO NOTHING;

-- Verificación final
SELECT
  (SELECT COUNT(*) FROM assets WHERE is_rentable = true)  AS paquetes_y_addons,
  (SELECT COUNT(*) FROM assets WHERE is_rentable = false) AS componentes,
  (SELECT COUNT(*) FROM asset_components)                  AS relaciones_bom,
  (SELECT COUNT(*) FROM upsell_rules)                      AS reglas_upsell;
