"""SQLAlchemy models for the reward dashboard."""
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    """Base class for all models."""
    pass


class User(Base):
    """User model for authentication and authorization."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    votes = relationship("Vote", back_populates="user", cascade="all, delete-orphan")


class Colleague(Base):
    """Colleague model representing team members who can receive badges."""
    __tablename__ = "colleagues"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    department = Column(String(100))
    position = Column(String(100))
    bio = Column(String(500))
    avatar_url = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    badges = relationship("Badge", back_populates="colleague", cascade="all, delete-orphan")


class Badge(Base):
    """Badge model representing achievements or recognitions."""
    __tablename__ = "badges"
    
    id = Column(Integer, primary_key=True, index=True)
    colleague_id = Column(Integer, ForeignKey("colleagues.id"), nullable=False)
    badge_type = Column(String(50), nullable=False)  # e.g., "teamwork", "innovation", "leadership"
    title = Column(String(100), nullable=False)
    description = Column(String(500))
    icon = Column(String(50))  # emoji or icon name
    awarded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    awarded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    month = Column(Integer, nullable=False)  # 1-12
    year = Column(Integer, nullable=False)
    
    # Relationships
    colleague = relationship("Colleague", back_populates="badges")
    votes = relationship("Vote", back_populates="badge", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('colleague_id', 'badge_type', 'month', 'year', name='uq_colleague_badge_month'),
    )


class Vote(Base):
    """Vote model for tracking user votes on badges."""
    __tablename__ = "votes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    badge_id = Column(Integer, ForeignKey("badges.id"), nullable=False)
    vote_type = Column(String(10), nullable=False)  # "up" or "down"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="votes")
    badge = relationship("Badge", back_populates="votes")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'badge_id', name='uq_user_badge_vote'),
    )


class MonthlyQuota(Base):
    """Track monthly badge quotas per user."""
    __tablename__ = "monthly_quotas"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    month = Column(Integer, nullable=False)  # 1-12
    year = Column(Integer, nullable=False)
    badges_given = Column(Integer, default=0, nullable=False)
    max_badges = Column(Integer, default=5, nullable=False)  # Default quota
    
    __table_args__ = (
        UniqueConstraint('user_id', 'month', 'year', name='uq_user_month_year'),
    )
