-- Función para reordenar recursos en batch (atómicamente)
-- Recibe TODOS los recursos con sus NUEVOS índices ya recalculados (1,2,3,4...)
-- y los actualiza en una sola operación para evitar conflictos con unique_resource_order

CREATE OR REPLACE FUNCTION reorder_resources_batch(
  p_topic_id UUID,
  p_resource_ids UUID[],
  p_order_indices INTEGER[]
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validar que ambos arrays tengan la misma longitud
  IF array_length(p_resource_ids, 1) != array_length(p_order_indices, 1) THEN
    RAISE EXCEPTION 'Los arrays de IDs y orden deben tener la misma longitud';
  END IF;

  -- SOLUCIÓN: Usar unnest para crear pares (id, nuevo_index) y actualizar desde ahí
  -- Esto hace un solo UPDATE con todos los valores, evitando conflictos temporales
  UPDATE resources r
  SET order_index = u.new_index,
      updated_at = NOW()
  FROM unnest(p_resource_ids, p_order_indices) AS u(resource_id, new_index)
  WHERE r.id = u.resource_id
    AND r.topic_id = p_topic_id;
END;
$$;
