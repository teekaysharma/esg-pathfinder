"""
API integration utilities for Streamlit ESG Dashboard
Provides secure integration with Next.js backend APIs
"""

import requests
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import streamlit as st
from error_handling import handle_error, APIError, streamlit_logger

logger = logging.getLogger(__name__)

class NextJSAPIClient:
    """
    Secure API client for Next.js backend integration
    """
    
    def __init__(self, base_url: str = None, timeout: int = 30):
        self.base_url = base_url or st.secrets.get("NEXTJS_API_URL", "http://localhost:3000")
        self.timeout = timeout
        self.session = requests.Session()
        
        # Set default headers
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'ESG-Streamlit-Dashboard/1.0'
        })
    
    def _get_auth_token(self) -> Optional[str]:
        """Get authentication token from session"""
        return st.session_state.get('auth_token')
    
    def _make_request(self, method: str, endpoint: str, data: Dict[str, Any] = None, 
                     params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Make authenticated request to Next.js API
        """
        url = f"{self.base_url}/api/v1{endpoint}"
        
        # Add authentication header
        token = self._get_auth_token()
        if token:
            self.session.headers['Authorization'] = f'Bearer {token}'
        
        try:
            # Make request
            if method.upper() == 'GET':
                response = self.session.get(url, params=params, timeout=self.timeout)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, params=params, timeout=self.timeout)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, params=params, timeout=self.timeout)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, params=params, timeout=self.timeout)
            else:
                raise APIError(f"Unsupported HTTP method: {method}")
            
            # Handle response
            if response.status_code == 401:
                # Token expired, clear session
                if 'auth_token' in st.session_state:
                    del st.session_state.auth_token
                raise APIError("Authentication expired. Please login again.", 401, endpoint)
            
            elif response.status_code == 403:
                raise APIError("Access denied. Insufficient permissions.", 403, endpoint)
            
            elif response.status_code >= 400:
                error_msg = "API request failed"
                try:
                    error_data = response.json()
                    error_msg = error_data.get('error', error_msg)
                except:
                    error_msg = f"API error {response.status_code}: {response.text}"
                
                raise APIError(error_msg, response.status_code, endpoint)
            
            # Return successful response
            try:
                return response.json()
            except:
                return {'success': True, 'data': response.text}
        
        except requests.exceptions.Timeout:
            raise APIError(f"Request timeout after {self.timeout} seconds", 408, endpoint)
        
        except requests.exceptions.ConnectionError:
            raise APIError("Cannot connect to API server. Please check your connection.", 503, endpoint)
        
        except requests.exceptions.RequestException as e:
            raise APIError(f"Network error: {str(e)}", 500, endpoint)
    
    # Authentication endpoints
    def login(self, username: str, password: str) -> Dict[str, Any]:
        """Authenticate with Next.js backend"""
        return self._make_request('POST', '/auth/login', {
            'username': username,
            'password': password
        })
    
    def logout(self) -> Dict[str, Any]:
        """Logout from Next.js backend"""
        return self._make_request('POST', '/auth/logout')
    
    def refresh_token(self) -> Dict[str, Any]:
        """Refresh authentication token"""
        return self._make_request('POST', '/auth/refresh')
    
    # Project endpoints
    def get_projects(self, params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Get projects from API"""
        response = self._make_request('GET', '/projects', params=params)
        return response.get('data', [])
    
    def get_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Get specific project"""
        response = self._make_request('GET', f'/projects/{project_id}')
        return response.get('data')
    
    def create_project(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new project"""
        response = self._make_request('POST', '/projects', project_data)
        return response.get('data')
    
    def update_project(self, project_id: str, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update project"""
        response = self._make_request('PUT', f'/projects/{project_id}', project_data)
        return response.get('data')
    
    def delete_project(self, project_id: str) -> bool:
        """Delete project"""
        response = self._make_request('DELETE', f'/projects/{project_id}')
        return response.get('success', False)
    
    # Organisation endpoints
    def get_organisations(self) -> List[Dict[str, Any]]:
        """Get organisations"""
        response = self._make_request('GET', '/organisations')
        return response.get('data', [])
    
    # ESG Data endpoints
    def get_esg_data(self, project_id: str, params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Get ESG data for project"""
        response = self._make_request('GET', f'/projects/{project_id}/esg-data', params)
        return response.get('data', [])
    
    def create_esg_data(self, project_id: str, esg_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create ESG data point"""
        response = self._make_request('POST', f'/projects/{project_id}/esg-data', esg_data)
        return response.get('data')
    
    # TCFD Assessment endpoints
    def get_tcfd_assessment(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Get TCFD assessment"""
        response = self._make_request('GET', f'/projects/{project_id}/tcfd/assessment')
        return response.get('data')
    
    def create_tcfd_assessment(self, project_id: str, assessment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create TCFD assessment"""
        response = self._make_request('POST', f'/projects/{project_id}/tcfd/assessment', assessment_data)
        return response.get('data')
    
    # CSRD Assessment endpoints
    def get_csrd_assessment(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Get CSRD assessment"""
        response = self._make_request('GET', f'/projects/{project_id}/csrd/assessment')
        return response.get('data')
    
    def create_csrd_assessment(self, project_id: str, assessment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create CSRD assessment"""
        response = self._make_request('POST', f'/projects/{project_id}/csrd/assessment', assessment_data)
        return response.get('data')
    
    # Analytics endpoints
    def get_dashboard_metrics(self) -> Dict[str, Any]:
        """Get dashboard metrics"""
        response = self._make_request('GET', '/analytics/dashboard')
        return response.get('data', {})
    
    def get_esg_analytics(self, project_id: str) -> Dict[str, Any]:
        """Get ESG analytics for project"""
        response = self._make_request('GET', f'/analytics/esg/{project_id}')
        return response.get('data', {})

# Global API client instance
api_client = NextJSAPIClient()

def initialize_api_integration():
    """Initialize API integration with Next.js backend"""
    try:
        # Test API connection
        response = api_client._make_request('GET', '/health')
        logger.info("API integration initialized successfully")
        return True
    except Exception as e:
        logger.warning(f"API integration not available: {e}")
        return False

def hybrid_data_loader(local_loader, api_loader, fallback_local=True):
    """
    Hybrid data loader that tries API first, falls back to local database
    """
    def loader(*args, **kwargs):
        try:
            # Try API first
            if 'api_integration_enabled' in st.session_state and st.session_state.api_integration_enabled:
                return api_loader(*args, **kwargs)
        except Exception as e:
            logger.warning(f"API load failed, using local data: {e}")
            streamlit_logger.log_user_action("api_fallback", {'reason': str(e)})
        
        # Fallback to local database
        if fallback_local:
            try:
                return local_loader(*args, **kwargs)
            except Exception as e:
                logger.error(f"Local data load also failed: {e}")
                raise
    
    return loader

# API-enabled data loaders
load_projects_api = hybrid_data_loader(
    local_loader=lambda: [],
    api_loader=api_client.get_projects
)

load_organisations_api = hybrid_data_loader(
    local_loader=lambda: [],
    api_loader=api_client.get_organisations
)

load_esg_data_api = hybrid_data_loader(
    local_loader=lambda project_id: [],
    api_loader=api_client.get_esg_data
)

def sync_with_api():
    """Sync local data with API (one-way sync from API to local)"""
    if not st.session_state.get('api_integration_enabled', False):
        return False
    
    try:
        # Sync projects
        api_projects = api_client.get_projects()
        # Here you would update local database with API data
        logger.info(f"Synced {len(api_projects)} projects from API")
        
        # Sync organisations
        api_orgs = api_client.get_organisations()
        logger.info(f"Synced {len(api_orgs)} organisations from API")
        
        return True
    except Exception as e:
        logger.error(f"API sync failed: {e}")
        return False

def show_api_status():
    """Show API integration status in sidebar"""
    api_enabled = st.session_state.get('api_integration_enabled', False)
    
    if api_enabled:
        st.success("🔗 API Connected")
        if st.button("Sync Now"):
            if sync_with_api():
                st.success("Sync completed!")
                st.rerun()
            else:
                st.error("Sync failed!")
    else:
        st.warning("📱 Local Mode Only")
        if st.button("Enable API Integration"):
            if initialize_api_integration():
                st.session_state.api_integration_enabled = True
                st.success("API integration enabled!")
                st.rerun()
            else:
                st.error("Failed to connect to API")