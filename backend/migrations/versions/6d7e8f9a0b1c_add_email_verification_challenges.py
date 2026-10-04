"""add email verification challenges

Revision ID: 6d7e8f9a0b1c
Revises: d30c1f8a2b64
Create Date: 2026-10-04 02:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "6d7e8f9a0b1c"
down_revision: Union[str, Sequence[str], None] = "d30c1f8a2b64"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "email_verification_challenges",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("code_digest", sa.String(length=64), nullable=False),
        sa.Column("failed_attempts", sa.Integer(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_sent_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_email_verification_challenges_user_id",
        "email_verification_challenges",
        ["user_id"],
        unique=True,
    )

    # Accounts created before this flow had no opportunity to verify an email.
    # Grandfather active accounts so the release cannot lock out existing users.
    op.execute(
        sa.text(
            "UPDATE users SET is_verified = true "
            "WHERE is_active = true AND is_deleted = false"
        )
    )


def downgrade() -> None:
    op.drop_index(
        "ix_email_verification_challenges_user_id",
        table_name="email_verification_challenges",
    )
    op.drop_table("email_verification_challenges")
