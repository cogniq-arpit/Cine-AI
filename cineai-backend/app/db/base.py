# Import all models to ensure Alembic autodetects schemas
from app.db.session import Base
from app.models.user import User, UserPreference
from app.models.chat import ChatHistory
from app.models.voice import VoiceSession
from app.models.recommendation import Recommendation
from app.models.interaction import TrendingInteraction
from app.models.movie_list import Watchlist, RecentlyViewed, SavedMovie
