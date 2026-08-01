from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import logging
from app.config import settings

logger = logging.getLogger(__name__)

# Base class for SQLAlchemy models
Base = declarative_base()

# Configure engine with fallback capability
try:
    if settings.USE_SQLITE_FALLBACK:
        # SQLite fallback for easy local dev/test setup
        engine = create_engine(
            settings.SQLITE_URL,
            connect_args={"check_same_thread": False}
        )
    else:
        engine = create_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20
        )
except Exception as e:
    logger.warning(f"Could not connect to Postgres ({e}), using SQLite fallback.")
    engine = create_engine(
        settings.SQLITE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependency to provide DB session per HTTP request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Creates all database tables defined in models."""
    from app.models import models # Ensure models are imported
    Base.metadata.create_all(bind=engine)
