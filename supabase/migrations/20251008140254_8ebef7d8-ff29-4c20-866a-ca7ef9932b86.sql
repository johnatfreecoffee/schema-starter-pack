-- Add new entity types to related_entity_type enum
ALTER TYPE related_entity_type ADD VALUE IF NOT EXISTS 'appointment';
ALTER TYPE related_entity_type ADD VALUE IF NOT EXISTS 'quote';
ALTER TYPE related_entity_type ADD VALUE IF NOT EXISTS 'invoice';