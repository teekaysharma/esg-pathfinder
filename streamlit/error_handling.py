"""
Error handling and logging utilities for Streamlit ESG Dashboard
Provides structured error handling and comprehensive logging
"""

import logging
import traceback
import sys
from datetime import datetime
from typing import Any, Optional, Dict
import streamlit as st
from functools import wraps

# Configure logging
class ColoredFormatter(logging.Formatter):
    """Custom formatter with colors for console output"""
    
    COLORS = {
        'DEBUG': '\033[36m',    # Cyan
        'INFO': '\033[32m',     # Green
        'WARNING': '\033[33m',  # Yellow
        'ERROR': '\033[31m',    # Red
        'CRITICAL': '\033[35m', # Magenta
        'RESET': '\033[0m'      # Reset
    }
    
    def format(self, record):
        color = self.COLORS.get(record.levelname, self.COLORS['RESET'])
        reset = self.COLORS['RESET']
        
        # Format the message
        formatted = super().format(record)
        return f"{color}[{record.levelname}]{reset} {formatted}"

# Configure root logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('esg_dashboard.log', mode='a')
    ]
)

# Set colored formatter for console handler
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(ColoredFormatter())

# Get logger
logger = logging.getLogger(__name__)

class ESGDashboardError(Exception):
    """Base exception for ESG Dashboard"""
    def __init__(self, message: str, error_code: str = None, context: Dict[str, Any] = None):
        super().__init__(message)
        self.error_code = error_code
        self.context = context or {}
        self.timestamp = datetime.now()

class ValidationError(ESGDashboardError):
    """Validation related errors"""
    def __init__(self, message: str, field: str = None, value: Any = None):
        super().__init__(message, "VALIDATION_ERROR")
        self.field = field
        self.value = value

class DatabaseError(ESGDashboardError):
    """Database related errors"""
    def __init__(self, message: str, query: str = None, params: Dict[str, Any] = None):
        super().__init__(message, "DATABASE_ERROR")
        self.query = query
        self.params = params

class AuthenticationError(ESGDashboardError):
    """Authentication related errors"""
    def __init__(self, message: str, username: str = None):
        super().__init__(message, "AUTH_ERROR")
        self.username = username

class APIError(ESGDashboardError):
    """API related errors"""
    def __init__(self, message: str, status_code: int = None, endpoint: str = None):
        super().__init__(message, "API_ERROR")
        self.status_code = status_code
        self.endpoint = endpoint

def handle_error(error: Exception, context: str = "Unknown") -> Dict[str, Any]:
    """
    Centralized error handling function
    Returns error information for display
    """
    error_info = {
        'type': type(error).__name__,
        'message': str(error),
        'context': context,
        'timestamp': datetime.now().isoformat(),
        'user_friendly': True
    }
    
    # Log the error
    if isinstance(error, ESGDashboardError):
        logger.error(f"ESG Dashboard Error in {context}: {error}", 
                    extra={'error_code': error.error_code, 'context': error.context})
        error_info.update({
            'error_code': error.error_code,
            'additional_context': error.context
        })
    else:
        logger.error(f"Unexpected error in {context}: {error}", exc_info=True)
        error_info['traceback'] = traceback.format_exc()
        error_info['user_friendly'] = False
    
    return error_info

def display_error(error_info: Dict[str, Any]):
    """Display error in Streamlit UI"""
    if error_info['user_friendly']:
        st.error(f"❌ {error_info['message']}")
    else:
        st.error("❌ An unexpected error occurred. Please try again or contact support.")
        
        # Show details in expander for debugging
        with st.expander("Error Details"):
            st.code(f"Error Type: {error_info['type']}")
            st.code(f"Context: {error_info['context']}")
            st.code(f"Message: {error_info['message']}")
            
            if 'traceback' in error_info:
                st.code(f"Traceback:\n{error_info['traceback']}")

def error_handler(func):
    """Decorator for automatic error handling"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            error_info = handle_error(e, f"Function: {func.__name__}")
            display_error(error_info)
            return None
    return wrapper

def safe_execute(func, *args, default=None, context="Unknown", **kwargs):
    """
    Safely execute a function with error handling
    Returns default value if error occurs
    """
    try:
        return func(*args, **kwargs)
    except Exception as e:
        error_info = handle_error(e, context)
        logger.warning(f"Safe execute failed in {context}, returning default: {default}")
        return default

class StreamlitLogger:
    """Streamlit-specific logging utilities"""
    
    @staticmethod
    def log_user_action(action: str, details: Dict[str, Any] = None):
        """Log user actions"""
        user = st.session_state.get('user', {})
        username = user.get('username', 'anonymous')
        
        log_data = {
            'user': username,
            'action': action,
            'timestamp': datetime.now().isoformat(),
            'details': details or {}
        }
        
        logger.info(f"User Action: {action} by {username}", extra=log_data)
    
    @staticmethod
    def log_page_view(page_name: str):
        """Log page views"""
        user = st.session_state.get('user', {})
        username = user.get('username', 'anonymous')
        
        logger.info(f"Page View: {page_name} by {username}", 
                   extra={'user': username, 'page': page_name})
    
    @staticmethod
    def log_error_with_context(error: Exception, context: str, user_data: Dict[str, Any] = None):
        """Log error with user context"""
        user = st.session_state.get('user', {})
        
        log_context = {
            'user': user.get('username', 'anonymous'),
            'context': context,
            'user_data': user_data or {}
        }
        
        logger.error(f"Error in {context}: {error}", 
                    extra=log_context, exc_info=True)

class PerformanceLogger:
    """Performance monitoring utilities"""
    
    @staticmethod
    def log_slow_query(query: str, execution_time: float, params: Dict[str, Any] = None):
        """Log slow database queries"""
        if execution_time > 1.0:  # Log queries taking more than 1 second
            logger.warning(f"Slow query detected ({execution_time:.2f}s): {query[:100]}...",
                          extra={'execution_time': execution_time, 'params': params})
    
    @staticmethod
    def log_page_load_time(page_name: str, load_time: float):
        """Log page load times"""
        if load_time > 3.0:  # Log slow page loads
            logger.warning(f"Slow page load: {page_name} took {load_time:.2f}s")

# Global logger instances
streamlit_logger = StreamlitLogger()
performance_logger = PerformanceLogger()

# Error tracking for session
def track_session_error(error_info: Dict[str, Any]):
    """Track errors in session for debugging"""
    if 'session_errors' not in st.session_state:
        st.session_state.session_errors = []
    
    st.session_state.session_errors.append(error_info)
    
    # Keep only last 10 errors
    if len(st.session_state.session_errors) > 10:
        st.session_state.session_errors = st.session_state.session_errors[-10:]

def get_session_errors() -> List[Dict[str, Any]]:
    """Get all errors from current session"""
    return st.session_state.get('session_errors', [])

def clear_session_errors():
    """Clear session error log"""
    if 'session_errors' in st.session_state:
        del st.session_state.session_errors

def show_error_history():
    """Display error history in admin panel"""
    errors = get_session_errors()
    
    if not errors:
        st.info("No errors in current session")
        return
    
    st.write(f"**Session Error History ({len(errors)} errors)**")
    
    for i, error in enumerate(reversed(errors[-5:]), 1):  # Show last 5 errors
        with st.expander(f"Error {i}: {error['type']} - {error['context']}"):
            st.code(f"Message: {error['message']}")
            st.code(f"Timestamp: {error['timestamp']}")
            if 'traceback' in error:
                st.code(f"Traceback:\n{error['traceback']}")