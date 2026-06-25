import logging
import os
import sys
from logging.handlers import RotatingFileHandler

def setup_logger(name: str = "nexora_ai") -> logging.Logger:
    """Sets up a structured logger for the application."""
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger

    logger.setLevel(logging.INFO)
    
    # Create logs directory if it doesn't exist
    logs_dir = os.path.join(os.getcwd(), "logs")
    os.makedirs(logs_dir, exist_ok=True)
    
    # Console Handler
    c_handler = logging.StreamHandler(sys.stdout)
    c_handler.setLevel(logging.INFO)
    c_format = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [%(name)s] [%(filename)s:%(lineno)d]: %(message)s"
    )
    c_handler.setFormatter(c_format)
    logger.addHandler(c_handler)
    
    # File Handler
    file_path = os.path.join(logs_dir, "nexora.log")
    f_handler = RotatingFileHandler(file_path, maxBytes=10*1024*1024, backupCount=5)
    f_handler.setLevel(logging.DEBUG)
    f_format = logging.Formatter(
        '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "module": "%(name)s", "file": "%(filename)s", "line": %(lineno)d, "message": "%(message)s"}'
    )
    f_handler.setFormatter(f_format)
    logger.addHandler(f_handler)
    
    return logger

# Shared global logger
logger = setup_logger()
