-- Función para reordenar tópicos en batch (atómicamente)
-- Recibe TODOS los tópicos con sus NUEVOS índices ya recalculados (1,2,3,4...)
-- y los actualiza en una sola operación para evitar conflictos con unique_topic_order

CREATE OR REPLACE FUNCTION reorder_topics_batch(
  p_course_version_id UUID,
  p_topic_ids UUID[],
  p_order_indices INTEGER[]
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validar que ambos arrays tengan la misma longitud
  IF array_length(p_topic_ids, 1) != array_length(p_order_indices, 1) THEN
    RAISE EXCEPTION 'Los arrays de IDs y orden deben tener la misma longitud';
  END IF;

  -- SOLUCIÓN: Usar unnest para crear pares (id, nuevo_index) y actualizar desde ahí
  -- Esto hace un solo UPDATE con todos los valores, evitando conflictos temporales
  UPDATE topics t
  SET order_index = u.new_index
  FROM unnest(p_topic_ids, p_order_indices) AS u(topic_id, new_index)
  WHERE t.id = u.topic_id
    AND t.course_version_id = p_course_version_id;
END;
$$;

