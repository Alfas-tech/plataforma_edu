-- Migration: Add topic_comments and comment_responses
-- Crea una tabla con un único comentario por tópico y una tabla de respuestas asociadas

BEGIN;

-- Tabla: topic_comments (un único comentario por topic)
CREATE TABLE topic_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_topic_comment UNIQUE(topic_id)
);

CREATE INDEX idx_topic_comments_topic_id ON topic_comments(topic_id);
CREATE INDEX idx_topic_comments_author_id ON topic_comments(author_id);

-- Tabla: comment_responses (varias respuestas por comentario)
CREATE TABLE comment_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES topic_comments(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comment_responses_comment_id ON comment_responses(comment_id);
CREATE INDEX idx_comment_responses_author_id ON comment_responses(author_id);

-- Reutilizar la función update_updated_at_column definida en la migración inicial

-- Asegurar que solo usuarios con role = 'editor' puedan crear/editar el comentario principal del tópico
CREATE OR REPLACE FUNCTION ensure_comment_author_is_editor()
RETURNS TRIGGER AS $$
DECLARE
    role_val user_role;
BEGIN
    IF NEW.author_id IS NULL THEN
        RAISE EXCEPTION 'author_id must be set and be an editor';
    END IF;

    SELECT role INTO role_val FROM profiles WHERE id = NEW.author_id;
    IF role_val IS NULL THEN
        RAISE EXCEPTION 'author_id % not found in profiles', NEW.author_id;
    END IF;

    IF role_val != 'editor' THEN
        RAISE EXCEPTION 'only users with role ''editor'' can create or update topic comments';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_topic_comment_author_is_editor
    BEFORE INSERT OR UPDATE ON topic_comments
    FOR EACH ROW EXECUTE FUNCTION ensure_comment_author_is_editor();

CREATE TRIGGER update_topic_comments_updated_at BEFORE UPDATE ON topic_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comment_responses_updated_at BEFORE UPDATE ON comment_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
