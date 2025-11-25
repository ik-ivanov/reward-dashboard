"""API routes for the reward dashboard."""
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from ..database import get_db
from ..models import User, Colleague, Badge, Vote, MonthlyQuota
from ..schemas import (
    UserCreate, UserResponse, UserLogin, Token,
    ColleagueCreate, ColleagueUpdate, ColleagueResponse, ColleagueWithBadges,
    BadgeCreate, BadgeResponse, BadgeWithVotes,
    VoteCreate, VoteResponse,
    QuotaResponse, DashboardStats
)
from ..security import (
    get_password_hash, verify_password, create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user, get_current_admin_user
)

router = APIRouter()


# ============================================================================
# Authentication Routes
# ============================================================================

@router.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if username already exists
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=get_password_hash(user.password),
        is_admin=user.is_admin
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


@router.post("/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login and get access token."""
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/auth/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return current_user


# ============================================================================
# Colleague Routes
# ============================================================================

@router.get("/colleagues", response_model=List[ColleagueResponse])
def list_colleagues(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all colleagues."""
    colleagues = db.query(Colleague).offset(skip).limit(limit).all()
    return colleagues


@router.get("/colleagues/{colleague_id}", response_model=ColleagueWithBadges)
def get_colleague(
    colleague_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific colleague with their badges."""
    colleague = db.query(Colleague).filter(Colleague.id == colleague_id).first()
    if not colleague:
        raise HTTPException(status_code=404, detail="Colleague not found")
    
    # Get badges with vote counts
    badges = []
    for badge in colleague.badges:
        upvotes = db.query(Vote).filter(
            Vote.badge_id == badge.id,
            Vote.vote_type == "up"
        ).count()
        downvotes = db.query(Vote).filter(
            Vote.badge_id == badge.id,
            Vote.vote_type == "down"
        ).count()
        user_vote = db.query(Vote).filter(
            Vote.badge_id == badge.id,
            Vote.user_id == current_user.id
        ).first()
        
        badge_data = BadgeWithVotes(
            id=badge.id,
            colleague_id=badge.colleague_id,
            badge_type=badge.badge_type,
            title=badge.title,
            description=badge.description,
            icon=badge.icon,
            awarded_by=badge.awarded_by,
            awarded_at=badge.awarded_at,
            month=badge.month,
            year=badge.year,
            upvotes=upvotes,
            downvotes=downvotes,
            user_vote=user_vote.vote_type if user_vote else None
        )
        badges.append(badge_data)
    
    return ColleagueWithBadges(
        id=colleague.id,
        name=colleague.name,
        email=colleague.email,
        department=colleague.department,
        position=colleague.position,
        bio=colleague.bio,
        avatar_url=colleague.avatar_url,
        created_at=colleague.created_at,
        updated_at=colleague.updated_at,
        badges=badges
    )


@router.post("/colleagues", response_model=ColleagueResponse, status_code=status.HTTP_201_CREATED)
def create_colleague(
    colleague: ColleagueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Create a new colleague (admin only)."""
    # Check if email already exists
    if db.query(Colleague).filter(Colleague.email == colleague.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    db_colleague = Colleague(**colleague.model_dump())
    db.add(db_colleague)
    db.commit()
    db.refresh(db_colleague)
    
    return db_colleague


@router.put("/colleagues/{colleague_id}", response_model=ColleagueResponse)
def update_colleague(
    colleague_id: int,
    colleague: ColleagueUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update a colleague (admin only)."""
    db_colleague = db.query(Colleague).filter(Colleague.id == colleague_id).first()
    if not db_colleague:
        raise HTTPException(status_code=404, detail="Colleague not found")
    
    # Update only provided fields
    update_data = colleague.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_colleague, field, value)
    
    db_colleague.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_colleague)
    
    return db_colleague


@router.delete("/colleagues/{colleague_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_colleague(
    colleague_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Delete a colleague (admin only)."""
    db_colleague = db.query(Colleague).filter(Colleague.id == colleague_id).first()
    if not db_colleague:
        raise HTTPException(status_code=404, detail="Colleague not found")
    
    db.delete(db_colleague)
    db.commit()
    
    return None


# ============================================================================
# Badge Routes
# ============================================================================

@router.post("/badges", response_model=BadgeResponse, status_code=status.HTTP_201_CREATED)
def create_badge(
    badge: BadgeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new badge for a colleague."""
    # Check if colleague exists
    colleague = db.query(Colleague).filter(Colleague.id == badge.colleague_id).first()
    if not colleague:
        raise HTTPException(status_code=404, detail="Colleague not found")
    
    # Get current month and year
    now = datetime.utcnow()
    month = now.month
    year = now.year
    
    # Check monthly quota
    quota = db.query(MonthlyQuota).filter(
        MonthlyQuota.user_id == current_user.id,
        MonthlyQuota.month == month,
        MonthlyQuota.year == year
    ).first()
    
    if not quota:
        # Create new quota entry
        quota = MonthlyQuota(
            user_id=current_user.id,
            month=month,
            year=year,
            badges_given=0,
            max_badges=5
        )
        db.add(quota)
    
    if quota.badges_given >= quota.max_badges:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Monthly badge quota exceeded ({quota.max_badges} badges per month)"
        )
    
    # Check if badge type already exists for this colleague this month
    existing_badge = db.query(Badge).filter(
        Badge.colleague_id == badge.colleague_id,
        Badge.badge_type == badge.badge_type,
        Badge.month == month,
        Badge.year == year
    ).first()
    
    if existing_badge:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This colleague already has this badge type for this month"
        )
    
    # Create badge
    db_badge = Badge(
        colleague_id=badge.colleague_id,
        badge_type=badge.badge_type,
        title=badge.title,
        description=badge.description,
        icon=badge.icon,
        awarded_by=current_user.id,
        month=month,
        year=year
    )
    db.add(db_badge)
    
    # Update quota
    quota.badges_given += 1
    
    db.commit()
    db.refresh(db_badge)
    
    return db_badge


@router.get("/badges", response_model=List[BadgeResponse])
def list_badges(
    skip: int = 0,
    limit: int = 100,
    colleague_id: Optional[int] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List badges with optional filters."""
    query = db.query(Badge)
    
    if colleague_id:
        query = query.filter(Badge.colleague_id == colleague_id)
    if month:
        query = query.filter(Badge.month == month)
    if year:
        query = query.filter(Badge.year == year)
    
    badges = query.offset(skip).limit(limit).all()
    return badges


# ============================================================================
# Vote Routes
# ============================================================================

@router.post("/votes", response_model=VoteResponse, status_code=status.HTTP_201_CREATED)
def create_vote(
    vote: VoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Vote on a badge."""
    # Check if badge exists
    badge = db.query(Badge).filter(Badge.id == vote.badge_id).first()
    if not badge:
        raise HTTPException(status_code=404, detail="Badge not found")
    
    # Check if user already voted
    existing_vote = db.query(Vote).filter(
        Vote.user_id == current_user.id,
        Vote.badge_id == vote.badge_id
    ).first()
    
    if existing_vote:
        # Update existing vote
        existing_vote.vote_type = vote.vote_type
        db.commit()
        db.refresh(existing_vote)
        return existing_vote
    
    # Create new vote
    db_vote = Vote(
        user_id=current_user.id,
        badge_id=vote.badge_id,
        vote_type=vote.vote_type
    )
    db.add(db_vote)
    db.commit()
    db.refresh(db_vote)
    
    return db_vote


@router.delete("/votes/{badge_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vote(
    badge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a vote from a badge."""
    vote = db.query(Vote).filter(
        Vote.user_id == current_user.id,
        Vote.badge_id == badge_id
    ).first()
    
    if not vote:
        raise HTTPException(status_code=404, detail="Vote not found")
    
    db.delete(vote)
    db.commit()
    
    return None


# ============================================================================
# Quota Routes
# ============================================================================

@router.get("/quota/current", response_model=QuotaResponse)
def get_current_quota(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's monthly quota."""
    now = datetime.utcnow()
    month = now.month
    year = now.year
    
    quota = db.query(MonthlyQuota).filter(
        MonthlyQuota.user_id == current_user.id,
        MonthlyQuota.month == month,
        MonthlyQuota.year == year
    ).first()
    
    if not quota:
        # Create new quota entry
        quota = MonthlyQuota(
            user_id=current_user.id,
            month=month,
            year=year,
            badges_given=0,
            max_badges=5
        )
        db.add(quota)
        db.commit()
        db.refresh(quota)
    
    return quota


# ============================================================================
# Dashboard Stats
# ============================================================================

@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard statistics."""
    now = datetime.utcnow()
    month = now.month
    year = now.year
    
    total_colleagues = db.query(func.count(Colleague.id)).scalar()
    total_badges = db.query(func.count(Badge.id)).scalar()
    badges_this_month = db.query(func.count(Badge.id)).filter(
        Badge.month == month,
        Badge.year == year
    ).scalar()
    
    # Get current quota
    quota = db.query(MonthlyQuota).filter(
        MonthlyQuota.user_id == current_user.id,
        MonthlyQuota.month == month,
        MonthlyQuota.year == year
    ).first()
    
    if not quota:
        remaining_quota = 5
    else:
        remaining_quota = quota.max_badges - quota.badges_given
    
    return DashboardStats(
        total_colleagues=total_colleagues or 0,
        total_badges=total_badges or 0,
        badges_this_month=badges_this_month or 0,
        remaining_quota=remaining_quota
    )
