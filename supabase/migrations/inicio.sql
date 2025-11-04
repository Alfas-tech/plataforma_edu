-- =============================================
-- SISTEMA DE GESTIÓN DE CURSOS - BD NUEVA (CORREGIDA)
-- Diseño normalizado con permisos dinámicos por rol
-- =============================================

BEGIN;

-- =============================================
-- ENUMERACIONES Y TIPOS
-- =============================================

CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'editor', 'student');
CREATE TYPE course_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE resource_type AS ENUM ('pdf', 'video', 'audio', 'document', 'link', 'image', 'other');

-- =============================================
-- TABLA: profiles
-- Usuarios del sistema con sus roles
-- =============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLA: courses
-- Curso base con referencia a versión activa
-- =============================================
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    active_version_id UUID,  -- Se establece después con constraint
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLA: course_versions
-- Versiones individuales de un curso
-- =============================================
CREATE TABLE course_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,  -- Contenido general del curso
    status course_status NOT NULL DEFAULT 'draft',
    start_date TIMESTAMPTZ,  -- Fecha inicio de disponibilidad
    end_date TIMESTAMPTZ,    -- Fecha fin de disponibilidad
    published_at TIMESTAMPTZ,
    published_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_course_version UNIQUE(course_id, version_number),
    CONSTRAINT valid_date_range CHECK (end_date IS NULL OR start_date IS NULL OR end_date > start_date),
    CONSTRAINT status_published_check CHECK (
        (status = 'active' AND published_at IS NOT NULL AND published_by IS NOT NULL) OR
        (status != 'active')
    )
);

-- Agregar foreign key de courses a course_versions
ALTER TABLE courses
ADD CONSTRAINT fk_active_version 
FOREIGN KEY (active_version_id) REFERENCES course_versions(id) ON DELETE SET NULL;

-- =============================================
-- TABLA: groups
-- Grupos de estudiantes para versiones activas
-- =============================================
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_version_id UUID NOT NULL REFERENCES course_versions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,  -- ej: "G1", "G2", "G3"
    teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_group_name UNIQUE(course_version_id, name)
);

-- =============================================
-- TABLA: group_students
-- Estudiantes asignados a grupos
-- =============================================
CREATE TABLE group_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_group_student UNIQUE(group_id, student_id)
);

-- =============================================
-- TABLA: topics
-- Tópicos dentro de una versión de curso (orden secuencial)
-- =============================================
CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_version_id UUID NOT NULL REFERENCES course_versions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,  -- Orden secuencial del tópico
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_topic_order UNIQUE(course_version_id, order_index),
    CONSTRAINT positive_order CHECK (order_index > 0)
);

-- =============================================
-- TABLA: resources
-- Recursos asociados a un tópico
-- =============================================
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    resource_type resource_type NOT NULL,
    file_url TEXT,  -- URL del archivo en storage
    file_name TEXT,
    file_size BIGINT,  -- Tamaño en bytes
    mime_type TEXT,
    external_url TEXT,  -- Para recursos tipo 'link'
    order_index INTEGER NOT NULL,  -- Orden dentro del tópico
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_resource_order UNIQUE(topic_id, order_index),
    CONSTRAINT positive_resource_order CHECK (order_index > 0),
    CONSTRAINT resource_location CHECK (
        (resource_type = 'link' AND external_url IS NOT NULL) OR
        (resource_type != 'link' AND file_url IS NOT NULL)
    )
);

-- =============================================
-- TABLA: student_progress
-- Progreso de estudiantes en tópicos
-- =============================================
CREATE TABLE student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_student_topic UNIQUE(student_id, topic_id),
    CONSTRAINT completed_timestamp CHECK (
        (completed = TRUE AND completed_at IS NOT NULL) OR
        (completed = FALSE)
    )
);

-- =============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =============================================

-- Índices para profiles
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Índices para courses
CREATE INDEX idx_courses_created_by ON courses(created_by);
CREATE INDEX idx_courses_active_version ON courses(active_version_id);

-- Índices para course_versions
CREATE INDEX idx_course_versions_course_id ON course_versions(course_id);
CREATE INDEX idx_course_versions_status ON course_versions(status);
CREATE INDEX idx_course_versions_dates ON course_versions(start_date, end_date);
CREATE INDEX idx_course_versions_published ON course_versions(published_at);

-- Índices para groups
CREATE INDEX idx_groups_course_version ON groups(course_version_id);
CREATE INDEX idx_groups_teacher ON groups(teacher_id);

-- Índices para group_students
CREATE INDEX idx_group_students_group ON group_students(group_id);
CREATE INDEX idx_group_students_student ON group_students(student_id);

-- Índices para topics
CREATE INDEX idx_topics_course_version ON topics(course_version_id);
CREATE INDEX idx_topics_order ON topics(course_version_id, order_index);

-- Índices para resources
CREATE INDEX idx_resources_topic ON resources(topic_id);
CREATE INDEX idx_resources_order ON resources(topic_id, order_index);
CREATE INDEX idx_resources_type ON resources(resource_type);

-- Índices para student_progress
CREATE INDEX idx_progress_student ON student_progress(student_id);
CREATE INDEX idx_progress_topic ON student_progress(topic_id);
CREATE INDEX idx_progress_completed ON student_progress(completed);

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_versions_updated_at BEFORE UPDATE ON course_versions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCIÓN: Cambiar rol de usuario
-- =============================================
CREATE OR REPLACE FUNCTION change_user_role(
    p_user_id UUID,
    p_new_role user_role,
    p_admin_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_admin_role user_role;
BEGIN
    -- Verificar que quien ejecuta es admin
    SELECT role INTO v_admin_role FROM profiles WHERE id = p_admin_id;
    
    IF v_admin_role != 'admin' THEN
        RAISE EXCEPTION 'Solo administradores pueden cambiar roles';
    END IF;
    
    -- Actualizar el rol
    UPDATE profiles SET role = p_new_role WHERE id = p_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Crear nuevo curso con versión borrador
-- =============================================
CREATE OR REPLACE FUNCTION create_course_with_draft(
    p_name TEXT,
    p_description TEXT,
    p_title TEXT,
    p_content TEXT,
    p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
    v_course_id UUID;
    v_version_id UUID;
    v_creator_role user_role;
BEGIN
    -- Verificar que el creador es admin
    SELECT role INTO v_creator_role FROM profiles WHERE id = p_created_by;
    
    IF v_creator_role != 'admin' THEN
        RAISE EXCEPTION 'Solo administradores pueden crear cursos';
    END IF;
    
    -- Crear el curso
    INSERT INTO courses (name, description, created_by)
    VALUES (p_name, p_description, p_created_by)
    RETURNING id INTO v_course_id;
    
    -- Crear la versión borrador
    INSERT INTO course_versions (
        course_id,
        version_number,
        title,
        description,
        content,
        status
    ) VALUES (
        v_course_id,
        1,
        p_title,
        p_description,
        p_content,
        'draft'
    ) RETURNING id INTO v_version_id;
    
    -- NO asignamos editores específicos - todos los editores pueden editar por su rol
    
    RETURN v_course_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Publicar versión borrador
-- =============================================
CREATE OR REPLACE FUNCTION publish_course_version(
    p_version_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_published_by UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_course_id UUID;
    v_current_status course_status;
    v_publisher_role user_role;
    v_previous_active_id UUID;
BEGIN
    -- Verificar que quien publica es admin
    SELECT role INTO v_publisher_role FROM profiles WHERE id = p_published_by;
    
    IF v_publisher_role != 'admin' THEN
        RAISE EXCEPTION 'Solo administradores pueden publicar versiones';
    END IF;
    
    -- Obtener información de la versión
    SELECT course_id, status INTO v_course_id, v_current_status
    FROM course_versions WHERE id = p_version_id;
    
    IF v_current_status != 'draft' THEN
        RAISE EXCEPTION 'Solo se pueden publicar versiones en estado borrador';
    END IF;
    
    -- Archivar la versión activa anterior si existe
    SELECT active_version_id INTO v_previous_active_id
    FROM courses WHERE id = v_course_id;
    
    IF v_previous_active_id IS NOT NULL THEN
        UPDATE course_versions
        SET status = 'archived'
        WHERE id = v_previous_active_id;
    END IF;
    
    -- Publicar la nueva versión
    UPDATE course_versions
    SET 
        status = 'active',
        start_date = p_start_date,
        end_date = p_end_date,
        published_at = NOW(),
        published_by = p_published_by
    WHERE id = p_version_id;
    
    -- Actualizar la versión activa del curso
    UPDATE courses
    SET active_version_id = p_version_id
    WHERE id = v_course_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Crear grupo para versión activa
-- =============================================
CREATE OR REPLACE FUNCTION create_group(
    p_course_version_id UUID,
    p_group_name TEXT,
    p_teacher_id UUID,
    p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
    v_group_id UUID;
    v_version_status course_status;
    v_creator_role user_role;
    v_teacher_role user_role;
BEGIN
    -- Verificar que quien crea es admin
    SELECT role INTO v_creator_role FROM profiles WHERE id = p_created_by;
    
    IF v_creator_role != 'admin' THEN
        RAISE EXCEPTION 'Solo administradores pueden crear grupos';
    END IF;
    
    -- Verificar que la versión está activa
    SELECT status INTO v_version_status
    FROM course_versions WHERE id = p_course_version_id;
    
    IF v_version_status != 'active' THEN
        RAISE EXCEPTION 'Solo se pueden crear grupos en versiones activas';
    END IF;
    
    -- Verificar que el teacher tiene el rol correcto
    IF p_teacher_id IS NOT NULL THEN
        SELECT role INTO v_teacher_role FROM profiles WHERE id = p_teacher_id;
        
        IF v_teacher_role != 'teacher' THEN
            RAISE EXCEPTION 'Solo usuarios con rol teacher pueden ser asignados a grupos';
        END IF;
    END IF;
    
    -- Crear el grupo
    INSERT INTO groups (course_version_id, name, teacher_id)
    VALUES (p_course_version_id, p_group_name, p_teacher_id)
    RETURNING id INTO v_group_id;
    
    RETURN v_group_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Asignar docente a grupo
-- =============================================
CREATE OR REPLACE FUNCTION assign_teacher_to_group(
    p_group_id UUID,
    p_teacher_id UUID,
    p_assigned_by UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_teacher_role user_role;
    v_assigner_role user_role;
BEGIN
    -- Verificar que quien asigna es admin
    SELECT role INTO v_assigner_role FROM profiles WHERE id = p_assigned_by;
    
    IF v_assigner_role != 'admin' THEN
        RAISE EXCEPTION 'Solo administradores pueden asignar docentes';
    END IF;
    
    -- Verificar que el usuario es teacher
    SELECT role INTO v_teacher_role FROM profiles WHERE id = p_teacher_id;
    
    IF v_teacher_role != 'teacher' THEN
        RAISE EXCEPTION 'Solo usuarios con rol teacher pueden ser asignados';
    END IF;
    
    -- Asignar el docente
    UPDATE groups SET teacher_id = p_teacher_id WHERE id = p_group_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Agregar estudiante a grupo
-- =============================================
CREATE OR REPLACE FUNCTION add_student_to_group(
    p_group_id UUID,
    p_student_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_enrollment_id UUID;
    v_student_role user_role;
BEGIN
    -- Verificar que el usuario es estudiante
    SELECT role INTO v_student_role FROM profiles WHERE id = p_student_id;
    
    IF v_student_role != 'student' THEN
        RAISE EXCEPTION 'Solo usuarios con rol student pueden ser agregados a grupos';
    END IF;
    
    -- Agregar al grupo
    INSERT INTO group_students (group_id, student_id)
    VALUES (p_group_id, p_student_id)
    RETURNING id INTO v_enrollment_id;
    
    RETURN v_enrollment_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Verificar si usuario puede editar borrador
-- =============================================
CREATE OR REPLACE FUNCTION can_edit_draft(
    p_user_id UUID,
    p_course_version_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_role user_role;
    v_version_status course_status;
BEGIN
    -- Obtener rol del usuario
    SELECT role INTO v_user_role FROM profiles WHERE id = p_user_id;
    
    -- Obtener estado de la versión
    SELECT status INTO v_version_status FROM course_versions WHERE id = p_course_version_id;
    
    -- Solo borradores pueden ser editados
    IF v_version_status != 'draft' THEN
        RETURN FALSE;
    END IF;
    
    -- Admins y editores pueden editar cualquier borrador
    IF v_user_role IN ('admin', 'editor') THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Crear tópico en versión borrador
-- =============================================
CREATE OR REPLACE FUNCTION create_topic(
    p_course_version_id UUID,
    p_title TEXT,
    p_description TEXT,
    p_order_index INTEGER,
    p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
    v_topic_id UUID;
BEGIN
    -- Verificar permisos usando la función auxiliar
    IF NOT can_edit_draft(p_created_by, p_course_version_id) THEN
        RAISE EXCEPTION 'No tiene permisos para crear tópicos en esta versión';
    END IF;
    
    -- Crear el tópico
    INSERT INTO topics (course_version_id, title, description, order_index)
    VALUES (p_course_version_id, p_title, p_description, p_order_index)
    RETURNING id INTO v_topic_id;
    
    RETURN v_topic_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Agregar recurso a tópico
-- =============================================
CREATE OR REPLACE FUNCTION add_resource_to_topic(
    p_topic_id UUID,
    p_title TEXT,
    p_description TEXT,
    p_resource_type resource_type,
    p_file_url TEXT,
    p_file_name TEXT,
    p_file_size BIGINT,
    p_mime_type TEXT,
    p_external_url TEXT,
    p_order_index INTEGER,
    p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
    v_resource_id UUID;
    v_version_id UUID;
BEGIN
    -- Obtener la versión del tópico
    SELECT course_version_id INTO v_version_id
    FROM topics WHERE id = p_topic_id;
    
    -- Verificar permisos usando la función auxiliar
    IF NOT can_edit_draft(p_created_by, v_version_id) THEN
        RAISE EXCEPTION 'No tiene permisos para agregar recursos en esta versión';
    END IF;
    
    -- Agregar el recurso
    INSERT INTO resources (
        topic_id,
        title,
        description,
        resource_type,
        file_url,
        file_name,
        file_size,
        mime_type,
        external_url,
        order_index
    ) VALUES (
        p_topic_id,
        p_title,
        p_description,
        p_resource_type,
        p_file_url,
        p_file_name,
        p_file_size,
        p_mime_type,
        p_external_url,
        p_order_index
    ) RETURNING id INTO v_resource_id;
    
    RETURN v_resource_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Marcar tópico como completado
-- =============================================
CREATE OR REPLACE FUNCTION mark_topic_completed(
    p_student_id UUID,
    p_topic_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO student_progress (student_id, topic_id, completed, completed_at)
    VALUES (p_student_id, p_topic_id, TRUE, NOW())
    ON CONFLICT (student_id, topic_id)
    DO UPDATE SET
        completed = TRUE,
        completed_at = NOW(),
        last_accessed_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VISTAS ÚTILES
-- =============================================

-- Vista: Cursos con información de versión activa
CREATE VIEW v_courses_with_active_version AS
SELECT 
    c.id as course_id,
    c.name as course_name,
    c.description as course_description,
    cv.id as version_id,
    cv.version_number,
    cv.title as version_title,
    cv.status,
    cv.start_date,
    cv.end_date,
    cv.published_at,
    p.full_name as published_by_name
FROM courses c
LEFT JOIN course_versions cv ON c.active_version_id = cv.id
LEFT JOIN profiles p ON cv.published_by = p.id;

-- Vista: Tópicos con conteo de recursos
CREATE VIEW v_topics_with_resources AS
SELECT 
    t.id as topic_id,
    t.course_version_id,
    t.title,
    t.description,
    t.order_index,
    COUNT(r.id) as resource_count
FROM topics t
LEFT JOIN resources r ON t.id = r.topic_id
GROUP BY t.id, t.course_version_id, t.title, t.description, t.order_index;

-- Vista: Grupos con información de docente
CREATE VIEW v_groups_with_teacher AS
SELECT 
    g.id as group_id,
    g.course_version_id,
    g.name as group_name,
    g.teacher_id,
    p.full_name as teacher_name,
    p.email as teacher_email,
    COUNT(gs.id) as student_count
FROM groups g
LEFT JOIN profiles p ON g.teacher_id = p.id
LEFT JOIN group_students gs ON g.id = gs.group_id
GROUP BY g.id, g.course_version_id, g.name, g.teacher_id, p.full_name, p.email;

-- Vista: Progreso de estudiantes por curso
CREATE VIEW v_student_course_progress AS
SELECT 
    gs.student_id,
    p.full_name as student_name,
    g.course_version_id,
    cv.title as course_title,
    g.id as group_id,
    g.name as group_name,
    COUNT(DISTINCT t.id) as total_topics,
    COUNT(DISTINCT CASE WHEN sp.completed THEN sp.topic_id END) as completed_topics,
    CASE 
        WHEN COUNT(DISTINCT t.id) > 0 
        THEN ROUND((COUNT(DISTINCT CASE WHEN sp.completed THEN sp.topic_id END)::NUMERIC / COUNT(DISTINCT t.id)) * 100, 2)
        ELSE 0
    END as progress_percentage
FROM group_students gs
INNER JOIN groups g ON gs.group_id = g.id
INNER JOIN course_versions cv ON g.course_version_id = cv.id
INNER JOIN profiles p ON gs.student_id = p.id
LEFT JOIN topics t ON t.course_version_id = cv.id
LEFT JOIN student_progress sp ON sp.topic_id = t.id AND sp.student_id = gs.student_id
GROUP BY gs.student_id, p.full_name, g.course_version_id, cv.title, g.id, g.name;

-- Vista: Todos los borradores editables
CREATE VIEW v_editable_drafts AS
SELECT 
    cv.id as version_id,
    cv.course_id,
    c.name as course_name,
    cv.version_number,
    cv.title,
    cv.description,
    cv.status,
    cv.created_at,
    cv.updated_at
FROM course_versions cv
INNER JOIN courses c ON cv.course_id = c.id
WHERE cv.status = 'draft';

COMMIT;
