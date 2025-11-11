-- Add plain text resource type to the enum used by course resources
ALTER TYPE resource_type ADD VALUE IF NOT EXISTS 'text';
