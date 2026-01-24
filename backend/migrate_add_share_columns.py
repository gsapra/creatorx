"""
Migration script to add is_public and share_token columns to content table
Run this once: python migrate_add_share_columns.py
"""
from app.core.database import engine
from sqlalchemy import text

def migrate():
    # Add is_public column
    try:
        with engine.connect() as conn:
            conn.execute(text('ALTER TABLE content ADD COLUMN is_public BOOLEAN DEFAULT FALSE'))
            conn.commit()
            print('✓ Added is_public column')
    except Exception as e:
        if 'already exists' in str(e) or 'duplicate column' in str(e).lower():
            print('✓ is_public column already exists')
        else:
            print(f'❌ Error adding is_public: {e}')
    
    # Add share_token column (separate transaction)
    try:
        with engine.connect() as conn:
            conn.execute(text('ALTER TABLE content ADD COLUMN share_token VARCHAR'))
            conn.commit()
            print('✓ Added share_token column')
    except Exception as e:
        if 'already exists' in str(e) or 'duplicate column' in str(e).lower():
            print('✓ share_token column already exists')
        else:
            print(f'❌ Error adding share_token: {e}')
    
    # Create unique index on share_token (separate transaction)
    try:
        with engine.connect() as conn:
            conn.execute(text('CREATE UNIQUE INDEX IF NOT EXISTS ix_content_share_token ON content(share_token)'))
            conn.commit()
            print('✓ Created unique index on share_token')
    except Exception as e:
        if 'already exists' in str(e):
            print('✓ Index on share_token already exists')
        else:
            print(f'❌ Error creating index: {e}')

    print('\n✅ Database migration completed!')

if __name__ == '__main__':
    migrate()
