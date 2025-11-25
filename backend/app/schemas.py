"""Pydantic schemas for request/response validation."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# User schemas
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    is_admin: bool = False


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(UserBase):
    id: int
    is_admin: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# Colleague schemas
class ColleagueBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    department: Optional[str] = Field(None, max_length=100)
    position: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    avatar_url: Optional[str] = Field(None, max_length=255)


class ColleagueCreate(ColleagueBase):
    pass


class ColleagueUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    department: Optional[str] = Field(None, max_length=100)
    position: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    avatar_url: Optional[str] = Field(None, max_length=255)


class ColleagueResponse(ColleagueBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Badge schemas
class BadgeBase(BaseModel):
    badge_type: str = Field(..., min_length=1, max_length=50)
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    icon: Optional[str] = Field(None, max_length=50)


class BadgeCreate(BadgeBase):
    colleague_id: int


class BadgeResponse(BadgeBase):
    id: int
    colleague_id: int
    awarded_by: int
    awarded_at: datetime
    month: int
    year: int
    
    class Config:
        from_attributes = True


# Vote schemas
class VoteCreate(BaseModel):
    badge_id: int
    vote_type: str = Field(..., pattern="^(up|down)$")


class VoteResponse(BaseModel):
    id: int
    user_id: int
    badge_id: int
    vote_type: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# Quota schemas
class QuotaResponse(BaseModel):
    id: int
    user_id: int
    month: int
    year: int
    badges_given: int
    max_badges: int
    
    class Config:
        from_attributes = True


# Dashboard response schemas
class BadgeWithVotes(BadgeResponse):
    upvotes: int = 0
    downvotes: int = 0
    user_vote: Optional[str] = None


class ColleagueWithBadges(ColleagueResponse):
    badges: List[BadgeWithVotes] = []


class DashboardStats(BaseModel):
    total_colleagues: int
    total_badges: int
    badges_this_month: int
    remaining_quota: int
