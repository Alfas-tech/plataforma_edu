-- Hacer el constraint unique_resource_order DEFERRABLE
-- Esto permite que PostgreSQL evalúe el constraint al FINAL de la transacción
-- en lugar de después de cada fila individual

-- Primero eliminar el constraint existente
ALTER TABLE resources 
DROP CONSTRAINT IF EXISTS unique_resource_order;

-- Recrearlo como DEFERRABLE INITIALLY DEFERRED
ALTER TABLE resources
ADD CONSTRAINT unique_resource_order 
UNIQUE (topic_id, order_index)
DEFERRABLE INITIALLY DEFERRED;

-- Ahora cuando actualices múltiples recursos en una transacción,
-- PostgreSQL verificará el constraint solo al final (cuando ya todo esté actualizado)
