"""final_schema

Revision ID: c21ce021c225
Revises: 
Create Date: 2026-05-26 19:03:33.815039

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c21ce021c225'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=120), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('username')
    )
    
    op.create_table('clients',
        sa.Column('client_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('full_name', sa.String(length=150), nullable=False),
        sa.Column('gender', sa.String(length=10), nullable=True),
        sa.Column('birth_date', sa.Date(), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('monthly_income', sa.Float(), nullable=True),
        sa.Column('credit_score', sa.Integer(), nullable=True),
        sa.Column('segment', sa.String(length=50), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=True),
        sa.Column('registration_date', sa.Date(), nullable=True),
        sa.PrimaryKeyConstraint('client_id')
    )
    op.create_index(op.f('ix_clients_client_id'), 'clients', ['client_id'], unique=False)
    
    op.create_table('addresses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=True),
        sa.Column('country', sa.String(length=60), nullable=True),
        sa.Column('region', sa.String(length=100), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('street', sa.String(length=150), nullable=True),
        sa.Column('house', sa.String(length=20), nullable=True),
        sa.Column('postal_code', sa.String(length=20), nullable=True),
        sa.ForeignKeyConstraint(['client_id'], ['clients.client_id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('client_id')
    )
    
    op.create_table('contacts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=True),
        sa.Column('email', sa.String(length=120), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('telegram', sa.String(length=50), nullable=True),
        sa.Column('preferred_contact', sa.String(length=20), nullable=True),
        sa.ForeignKeyConstraint(['client_id'], ['clients.client_id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('client_id'),
        sa.UniqueConstraint('email')
    )
    
    op.create_table('documents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=True),
        sa.Column('passport_number', sa.String(length=20), nullable=True),
        sa.Column('inn', sa.String(length=12), nullable=True),
        sa.Column('snils', sa.String(length=14), nullable=True),
        sa.Column('document_verified', sa.Boolean(), nullable=True),
        sa.Column('verification_date', sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(['client_id'], ['clients.client_id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('client_id'),
        sa.UniqueConstraint('inn'),
        sa.UniqueConstraint('passport_number')
    )
    
    op.create_table('risk_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=True),
        sa.Column('risk_level', sa.String(length=20), nullable=True),
        sa.Column('fraud_flags', sa.Integer(), nullable=True),
        sa.Column('overdue_days', sa.Integer(), nullable=True),
        sa.Column('open_loans', sa.Integer(), nullable=True),
        sa.Column('recommended_limit', sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(['client_id'], ['clients.client_id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('client_id')
    )
    
    op.create_table('products',
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=True),
        sa.Column('product_type', sa.String(length=50), nullable=True),
        sa.Column('amount', sa.Float(), nullable=True),
        sa.Column('interest_rate', sa.Float(), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(['client_id'], ['clients.client_id'], ),
        sa.PrimaryKeyConstraint('product_id')
    )
    
    op.create_table('transactions',
        sa.Column('transaction_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('client_id', sa.Integer(), nullable=True),
        sa.Column('amount', sa.Float(), nullable=True),
        sa.Column('currency', sa.String(length=3), nullable=True),
        sa.Column('transaction_type', sa.String(length=30), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.Column('device', sa.String(length=50), nullable=True),
        sa.Column('country', sa.String(length=60), nullable=True),
        sa.Column('is_fraud', sa.Boolean(), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=True),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(['client_id'], ['clients.client_id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('transaction_id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('transactions')
    op.drop_table('products')
    op.drop_table('risk_profiles')
    op.drop_table('documents')
    op.drop_table('contacts')
    op.drop_table('addresses')
    op.drop_index(op.f('ix_clients_client_id'), table_name='clients')
    op.drop_table('clients')
    op.drop_table('users')
