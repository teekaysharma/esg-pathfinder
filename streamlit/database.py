"""
Secure database utilities for Streamlit ESG Dashboard
Provides secure database access with connection pooling and validation
"""

import os
import logging
from typing import Optional, List, Dict, Any
from contextlib import contextmanager
from sqlalchemy import create_engine, text, exc
from sqlalchemy.pool import StaticPool
import streamlit as st

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SecureDatabase:
    """
    Secure database connection manager with connection pooling
    """
    
    def __init__(self):
        self.engine = None
        self._initialize_engine()
    
    def _initialize_engine(self):
        """Initialize database engine with secure settings"""
        try:
            database_url = os.getenv('DATABASE_URL', 'sqlite:///esg_pathfinder.db')
            
            # SQLite configuration with security settings
            if database_url.startswith('sqlite'):
                self.engine = create_engine(
                    database_url,
                    poolclass=StaticPool,
                    connect_args={
                        'check_same_thread': False,
                        'timeout': 20
                    },
                    echo=False,  # Disable SQL logging in production
                    pool_pre_ping=True
                )
            else:
                # PostgreSQL configuration for production
                self.engine = create_engine(
                    database_url,
                    pool_pre_ping=True,
                    pool_recycle=300,
                    pool_size=5,
                    max_overflow=10
                )
            
            logger.info("Database engine initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize database engine: {e}")
            raise
    
    @contextmanager
    def get_connection(self):
        """Get database connection with automatic cleanup"""
        conn = None
        try:
            conn = self.engine.connect()
            yield conn
        except Exception as e:
            logger.error(f"Database connection error: {e}")
            if conn:
                conn.rollback()
            raise
        finally:
            if conn:
                conn.close()
    
    def execute_query(self, query: str, params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Execute a secure parameterized query
        """
        try:
            with self.get_connection() as conn:
                result = conn.execute(text(query), params or {})
                columns = result.keys()
                return [dict(zip(columns, row)) for row in result.fetchall()]
        except exc.SQLAlchemyError as e:
            logger.error(f"SQL error in execute_query: {e}")
            raise DatabaseError(f"Database query failed: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in execute_query: {e}")
            raise DatabaseError(f"Unexpected database error: {str(e)}")
    
    def execute_non_query(self, query: str, params: Dict[str, Any] = None) -> int:
        """
        Execute a non-query SQL statement (INSERT, UPDATE, DELETE)
        Returns the number of affected rows
        """
        try:
            with self.get_connection() as conn:
                result = conn.execute(text(query), params or {})
                conn.commit()
                return result.rowcount
        except exc.SQLAlchemyError as e:
            logger.error(f"SQL error in execute_non_query: {e}")
            raise DatabaseError(f"Database operation failed: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in execute_non_query: {e}")
            raise DatabaseError(f"Unexpected database error: {str(e)}")
    
    def test_connection(self) -> bool:
        """Test database connection"""
        try:
            self.execute_query("SELECT 1")
            return True
        except Exception as e:
            logger.error(f"Database connection test failed: {e}")
            return False

class DatabaseError(Exception):
    """Custom database error exception"""
    pass

# Global database instance
db = SecureDatabase()

# Secure query functions
def load_projects() -> List[Dict[str, Any]]:
    """Load projects with security validation"""
    query = """
    SELECT p.*, o.name as organisation_name, u.name as created_by_name
    FROM projects p
    LEFT JOIN organisations o ON p.organisation_id = o.id
    LEFT JOIN users u ON p.created_by = u.id
    ORDER BY p.created_at DESC
    """
    return db.execute_query(query)

def load_project_by_id(project_id: str) -> Optional[Dict[str, Any]]:
    """Load a specific project by ID with validation"""
    if not project_id or len(project_id) < 10:
        raise ValueError("Invalid project ID")
    
    query = """
    SELECT p.*, o.name as organisation_name, u.name as created_by_name
    FROM projects p
    LEFT JOIN organisations o ON p.organisation_id = o.id
    LEFT JOIN users u ON p.created_by = u.id
    WHERE p.id = :project_id
    """
    
    results = db.execute_query(query, {'project_id': project_id})
    return results[0] if results else None

def create_project(project_data: Dict[str, Any]) -> str:
    """Create a new project with validation"""
    # Validate required fields
    required_fields = ['name', 'organisation_id']
    for field in required_fields:
        if not project_data.get(field):
            raise ValueError(f"Missing required field: {field}")
    
    # Validate project name
    name = project_data['name'].strip()
    if len(name) > 255:
        raise ValueError("Project name too long")
    if len(name) < 1:
        raise ValueError("Project name cannot be empty")
    
    query = """
    INSERT INTO projects (name, description, organisation_id, created_by, status, created_at, updated_at)
    VALUES (:name, :description, :organisation_id, :created_by, :status, datetime('now'), datetime('now'))
    """
    
    params = {
        'name': name,
        'description': project_data.get('description', ''),
        'organisation_id': project_data['organisation_id'],
        'created_by': project_data.get('created_by'),
        'status': project_data.get('status', 'draft')
    }
    
    db.execute_non_query(query, params)
    
    # Get the created project ID (SQLite specific)
    result = db.execute_query("SELECT last_insert_rowid() as id")
    return result[0]['id']

def update_project(project_id: str, project_data: Dict[str, Any]) -> bool:
    """Update an existing project with validation"""
    if not project_id or len(project_id) < 10:
        raise ValueError("Invalid project ID")
    
    # Validate project name if provided
    if 'name' in project_data:
        name = project_data['name'].strip()
        if len(name) > 255:
            raise ValueError("Project name too long")
        if len(name) < 1:
            raise ValueError("Project name cannot be empty")
        project_data['name'] = name
    
    # Build dynamic update query
    set_clauses = []
    params = {'project_id': project_id}
    
    for key, value in project_data.items():
        if key in ['name', 'description', 'status']:
            set_clauses.append(f"{key} = :{key}")
            params[key] = value
    
    if not set_clauses:
        raise ValueError("No valid fields to update")
    
    set_clauses.append("updated_at = datetime('now')")
    
    query = f"""
    UPDATE projects 
    SET {', '.join(set_clauses)}
    WHERE id = :project_id
    """
    
    affected_rows = db.execute_non_query(query, params)
    return affected_rows > 0

def delete_project(project_id: str) -> bool:
    """Delete a project with validation"""
    if not project_id or len(project_id) < 10:
        raise ValueError("Invalid project ID")
    
    # Check if project exists
    project = load_project_by_id(project_id)
    if not project:
        raise ValueError("Project not found")
    
    query = "DELETE FROM projects WHERE id = :project_id"
    affected_rows = db.execute_non_query(query, {'project_id': project_id})
    return affected_rows > 0

def load_organisations() -> List[Dict[str, Any]]:
    """Load organisations for dropdown"""
    query = "SELECT id, name FROM organisations ORDER BY name"
    return db.execute_query(query)

def load_esg_data(project_id: str) -> List[Dict[str, Any]]:
    """Load ESG data for a project"""
    if not project_id or len(project_id) < 10:
        raise ValueError("Invalid project ID")
    
    query = """
    SELECT * FROM esg_data_points 
    WHERE project_id = :project_id 
    ORDER BY category, year DESC, period DESC
    """
    return db.execute_query(query, {'project_id': project_id})