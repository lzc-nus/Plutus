"""create transactions table

Revision ID: b2a91f02d4e7
Revises: 34cf3d3bf27c
Create Date: 2026-05-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = "b2a91f02d4e7"
down_revision: Union[str, Sequence[str], None] = "34cf3d3bf27c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "transactions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("occurred_at", sa.DateTime(), nullable=False),
        sa.Column(
            "description",
            sqlmodel.sql.sqltypes.AutoString(length=160),
            nullable=False,
        ),
        sa.Column(
            "category",
            sqlmodel.sql.sqltypes.AutoString(length=80),
            nullable=False,
        ),
        sa.Column(
            "account",
            sqlmodel.sql.sqltypes.AutoString(length=80),
            nullable=False,
        ),
        sa.Column("amount", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column(
            "impact",
            sqlmodel.sql.sqltypes.AutoString(length=160),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_transactions_user_occurred_at",
        "transactions",
        ["user_id", "occurred_at"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_transactions_user_occurred_at", table_name="transactions")
    op.drop_table("transactions")
