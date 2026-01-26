"""
Authentication utilities for Streamlit ESG Dashboard
Provides secure authentication using built-in Streamlit features
"""

import hashlib
import hmac
import streamlit as st
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import json
import os

class SimpleAuthenticator:
    """
    Simple authentication system for Streamlit using built-in features
    """
    
    def __init__(self):
        self.session_timeout = timedelta(hours=2)
        self.max_login_attempts = 3
        self.lockout_duration = timedelta(minutes=15)
    
    def hash_password(self, password: str, salt: str = None) -> tuple[str, str]:
        """Hash password with salt"""
        if salt is None:
            salt = os.urandom(32).hex()
        
        password_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        ).hex()
        
        return password_hash, salt
    
    def verify_password(self, password: str, stored_hash: str, salt: str) -> bool:
        """Verify password against stored hash"""
        password_hash, _ = self.hash_password(password, salt)
        return hmac.compare_digest(password_hash, stored_hash)
    
    def get_users(self) -> Dict[str, Dict[str, Any]]:
        """Get user credentials from environment variables or config"""
        users = {}
        
        # Default admin user from environment variables
        admin_username = os.getenv('ADMIN_USERNAME', 'admin')
        admin_password = os.getenv('ADMIN_PASSWORD', 'admin123')  # Change in production
        admin_email = os.getenv('ADMIN_EMAIL', 'admin@esg-pathfinder.com')
        
        password_hash, salt = self.hash_password(admin_password)
        
        users[admin_username] = {
            'email': admin_email,
            'name': 'Administrator',
            'password_hash': password_hash,
            'salt': salt,
            'role': 'admin',
            'failed_attempts': 0,
            'locked_until': None
        }
        
        return users
    
    def is_account_locked(self, username: str) -> bool:
        """Check if account is locked due to failed attempts"""
        users = self.get_users()
        user = users.get(username)
        
        if not user or not user.get('locked_until'):
            return False
        
        return datetime.now() < datetime.fromisoformat(user['locked_until'])
    
    def record_failed_attempt(self, username: str):
        """Record failed login attempt"""
        users = self.get_users()
        user = users.get(username)
        
        if user:
            user['failed_attempts'] = user.get('failed_attempts', 0) + 1
            
            if user['failed_attempts'] >= self.max_login_attempts:
                lockout_time = datetime.now() + self.lockout_duration
                user['locked_until'] = lockout_time.isoformat()
    
    def reset_failed_attempts(self, username: str):
        """Reset failed login attempts"""
        users = self.get_users()
        user = users.get(username)
        
        if user:
            user['failed_attempts'] = 0
            user['locked_until'] = None
    
    def authenticate(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate user credentials"""
        users = self.get_users()
        user = users.get(username)
        
        if not user:
            return None
        
        # Check if account is locked
        if self.is_account_locked(username):
            return None
        
        # Verify password
        if self.verify_password(password, user['password_hash'], user['salt']):
            self.reset_failed_attempts(username)
            return {
                'username': username,
                'email': user['email'],
                'name': user['name'],
                'role': user['role']
            }
        else:
            self.record_failed_attempt(username)
            return None
    
    def check_session_timeout(self):
        """Check if session has timed out"""
        if 'login_time' not in st.session_state:
            return False
        
        login_time = st.session_state.login_time
        if isinstance(login_time, str):
            login_time = datetime.fromisoformat(login_time)
        
        return datetime.now() - login_time < self.session_timeout
    
    def login_form(self):
        """Display login form"""
        st.title("🔐 ESG Pathfinder Login")
        
        with st.form("login_form"):
            username = st.text_input("Username", key="login_username")
            password = st.text_input("Password", type="password", key="login_password")
            submit_button = st.form_submit_button("Login")
            
            if submit_button:
                if not username or not password:
                    st.error("Please enter both username and password")
                    return False
                
                user = self.authenticate(username, password)
                
                if user:
                    st.session_state.update({
                        'authenticated': True,
                        'user': user,
                        'login_time': datetime.now()
                    })
                    st.success(f"Welcome back, {user['name']}!")
                    st.rerun()
                    return True
                else:
                    users = self.get_users()
                    user_data = users.get(username)
                    
                    if user_data and self.is_account_locked(username):
                        st.error("Account locked due to too many failed attempts. Please try again later.")
                    else:
                        st.error("Invalid username or password")
                    
                    return False
        
        return False
    
    def logout(self):
        """Logout user"""
        keys_to_clear = ['authenticated', 'user', 'login_time']
        for key in keys_to_clear:
            if key in st.session_state:
                del st.session_state[key]
        st.success("Logged out successfully")
        st.rerun()
    
    def require_auth(self):
        """Require authentication to access page"""
        if not st.session_state.get('authenticated', False):
            self.login_form()
            st.stop()
        
        # Check session timeout
        if not self.check_session_timeout():
            self.logout()
            st.error("Session expired. Please login again.")
            return
        
        # Show user info and logout button
        user = st.session_state.get('user', {})
        col1, col2 = st.columns([6, 1])
        
        with col1:
            st.markdown(f"👤 **{user.get('name', 'User')}** ({user.get('role', 'user')})")
        
        with col2:
            if st.button("Logout", key="logout_button"):
                self.logout()
        
        st.divider()

# Global authenticator instance
auth = SimpleAuthenticator()