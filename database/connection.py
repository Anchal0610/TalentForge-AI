from models.schemas import init_user_table
from utils.logger import logger


def init_db():
    try:
        init_user_table()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise
