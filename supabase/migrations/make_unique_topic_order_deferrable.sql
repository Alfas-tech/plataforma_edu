-- Hacer el constraint unique_topic_order DEFERRABLE
-- Esto permite que PostgreSQL evalúe el constraint al FINAL de la transacción
-- en lugar de después de cada fila individual

-- Primero eliminar el constraint existente
ALTER TABLE topics 
DROP CONSTRAINT IF EXISTS unique_topic_order;

-- Recrearlo como DEFERRABLE INITIALLY DEFERRED
ALTER TABLE topics
ADD CONSTRAINT unique_topic_order 
UNIQUE (course_version_id, order_index)
DEFERRABLE INITIALLY DEFERRED;

-- Ahora cuando actualices múltiples filas en una transacción,
-- PostgreSQL verificará el constraint solo al final (cuando ya todo esté actualizado)
