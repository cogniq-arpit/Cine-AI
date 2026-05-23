import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class Watchlist(Base):
    __tablename__ = "watchlist"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    imdb_id = Column(String(20), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    poster = Column(String(512), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="watchlist")
    
    __table_args__ = (
        Index("idx_user_watchlist_imdb", "user_id", "imdb_id", unique=True),
    )

class RecentlyViewed(Base):
    __tablename__ = "recently_viewed"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    imdb_id = Column(String(20), nullable=False, index=True)
    viewed_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="recents")

class SavedMovie(Base):
    __tablename__ = "saved_movies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    imdb_id = Column(String(20), nullable=False, index=True)
    saved_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="saved_movies")
    
    __table_args__ = (
        Index("idx_user_saved_imdb", "user_id", "imdb_id", unique=True),
    )
