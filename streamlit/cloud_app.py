"""
ESG Pathfinder Streamlit Cloud Dashboard
Optimized for Streamlit Cloud deployment with local database mode
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import time
import os
import sqlite3
import hashlib
import re
from typing import Optional, Dict, Any, List

# Configure Streamlit page
st.set_page_config(
    page_title="ESG Pathfinder Dashboard",
    page_icon="🌍",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        color: #1f2937;
        margin-bottom: 1rem;
    }
    .metric-card {
        background-color: #f8fafc;
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 4px solid #10b981;
    }
    .error-message {
        background-color: #fef2f2;
        border: 1px solid #fecaca;
        color: #dc2626;
        padding: 1rem;
        border-radius: 0.5rem;
    }
    .success-message {
        background-color: #f0fdf4;
        border: 1px solid #bbf7d0;
        color: #16a34a;
        padding: 1rem;
        border-radius: 0.5rem;
    }
</style>
""", unsafe_allow_html=True)

# Database setup for Streamlit Cloud
def get_db_connection():
    """Get database connection for Streamlit Cloud"""
    db_path = "esg_pathfinder.db"
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """Initialize database with required tables"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP,
            failed_attempts INTEGER DEFAULT 0,
            locked_until TIMESTAMP
        )
    ''')
    
    # Create organisations table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS organisations (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            industry TEXT,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create projects table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            organisation_id TEXT,
            status TEXT DEFAULT 'draft',
            created_by TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (organisation_id) REFERENCES organisations(id),
            FOREIGN KEY (created_by) REFERENCES users(username)
        )
    ''')
    
    # Create ESG data points table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS esg_data_points (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT,
            category TEXT NOT NULL,
            year INTEGER,
            period TEXT,
            metric_name TEXT NOT NULL,
            value TEXT,
            unit TEXT,
            source TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id)
        )
    ''')
    
    # Create TCFD assessments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tcfd_assessments (
            id TEXT PRIMARY KEY,
            project_id TEXT,
            governance_data TEXT,
            strategy_data TEXT,
            risk_management_data TEXT,
            metrics_targets_data TEXT,
            overall_score REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id)
        )
    ''')
    
    # Create indexes for performance
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_projects_organisation ON projects(organisation_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_esg_project_category ON esg_data_points(project_id, category)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)')
    
    conn.commit()
    conn.close()

# Security functions
def hash_password(password: str) -> str:
    """Hash password with salt"""
    salt = "esg_pathfinder_salt"
    return hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()

def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == password_hash

def validate_input(text: str, max_length: int = 255) -> str:
    """Validate and sanitize input"""
    if not text:
        return ""
    
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Limit length
    if len(text) > max_length:
        text = text[:max_length]
    
    return text.strip()

# Authentication functions
def login_user(username: str, password: str) -> Optional[Dict[str, Any]]:
    """Authenticate user"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM users 
        WHERE username = ? AND (locked_until IS NULL OR locked_until < datetime('now'))
    ''', (username,))
    
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        return None
    
    # Check password
    if not verify_password(password, user['password_hash']):
        # Increment failed attempts
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE users 
            SET failed_attempts = failed_attempts + 1,
                locked_until = CASE 
                    WHEN failed_attempts >= 2 THEN datetime('now', '+15 minutes')
                    ELSE NULL 
                END
            WHERE username = ?
        ''', (username,))
        
        conn.commit()
        conn.close()
        return None
    
    # Reset failed attempts and update last login
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE users 
        SET failed_attempts = 0, 
            locked_until = NULL,
            last_login = datetime('now')
        WHERE username = ?
    ''', (username,))
    
    conn.commit()
    conn.close()
    
    return dict(user)

def create_default_admin():
    """Create default admin user if not exists"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT COUNT(*) as count FROM users WHERE role = "admin"')
    admin_count = cursor.fetchone()['count']
    
    if admin_count == 0:
        # Get admin credentials from secrets or use defaults
        admin_username = st.secrets.get("ADMIN_USERNAME", "admin")
        admin_password = st.secrets.get("ADMIN_PASSWORD", "admin123")
        admin_email = st.secrets.get("ADMIN_EMAIL", "admin@esg-pathfinder.com")
        
        password_hash = hash_password(admin_password)
        
        cursor.execute('''
            INSERT INTO users (username, email, password_hash, role)
            VALUES (?, ?, ?, 'admin')
        ''', (admin_username, admin_email, password_hash))
        
        conn.commit()
        st.success(f"Default admin user created: {admin_username}")
    
    conn.close()

# Data functions
def load_projects() -> List[Dict[str, Any]]:
    """Load all projects"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT p.*, o.name as organisation_name, u.email as created_by_email
        FROM projects p
        LEFT JOIN organisations o ON p.organisation_id = o.id
        LEFT JOIN users u ON p.created_by = u.username
        ORDER BY p.created_at DESC
    ''')
    
    projects = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return projects

def load_organisations() -> List[Dict[str, Any]]:
    """Load all organisations"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM organisations ORDER BY name')
    orgs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return orgs

def create_project(project_data: Dict[str, Any]) -> str:
    """Create a new project"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    project_id = f"proj_{int(time.time())}"
    
    cursor.execute('''
        INSERT INTO projects (id, name, description, organisation_id, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (project_id, project_data['name'], project_data.get('description', ''), 
          project_data['organisation_id'], project_data.get('status', 'draft'), 
          project_data['created_by']))
    
    conn.commit()
    conn.close()
    return project_id

def create_sample_data():
    """Create sample data for demonstration"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create sample organisation
    cursor.execute('''
        INSERT OR IGNORE INTO organisations (id, name, industry, description)
        VALUES ('org_001', 'TechCorp Inc', 'Technology', 'Sample technology company')
    ''')
    
    # Create sample project
    cursor.execute('''
        INSERT OR IGNORE INTO projects (id, name, description, organisation_id, status, created_by)
        VALUES ('proj_001', 'ESG Assessment 2024', 'Annual ESG compliance assessment', 'org_001', 'active', 'admin')
    ''')
    
    # Create sample ESG data
    sample_data = [
        ('proj_001', 'environmental', 2024, 'Q1', 'Carbon Emissions', '1250', 'tCO2e', 'Internal', 'Scope 1 and 2 emissions'),
        ('proj_001', 'social', 2024, 'Q1', 'Employee Satisfaction', '4.2', 'out of 5', 'Survey', 'Annual employee survey'),
        ('proj_001', 'governance', 2024, 'Q1', 'Board Diversity', '40', '%', 'HR Records', 'Percentage of diverse board members'),
    ]
    
    cursor.executemany('''
        INSERT OR IGNORE INTO esg_data_points 
        (project_id, category, year, period, metric_name, value, unit, source, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', sample_data)
    
    conn.commit()
    conn.close()

# Page functions
def show_login():
    """Show login page"""
    st.markdown('<h1 class="main-header">🌍 ESG Pathfinder</h1>', unsafe_allow_html=True)
    st.markdown('<h2>Secure ESG Compliance Management</h2>', unsafe_allow_html=True)
    
    with st.form("login_form"):
        st.subheader("🔐 Login")
        username = st.text_input("Username", key="login_username")
        password = st.text_input("Password", type="password", key="login_password")
        
        if st.form_submit_button("Login", type="primary"):
            if not username or not password:
                st.error("Please enter both username and password")
                return
            
            user = login_user(username, password)
            if user:
                st.session_state.user = user
                st.session_state.logged_in = True
                st.success(f"Welcome back, {user['username']}!")
                st.rerun()
            else:
                st.error("Invalid username or password")

def show_dashboard():
    """Show main dashboard"""
    st.markdown('<h1 class="main-header">🌍 ESG Pathfinder Dashboard</h1>', unsafe_allow_html=True)
    
    # Load metrics
    projects = load_projects()
    orgs = load_organisations()
    
    # Key metrics
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Total Projects", len(projects))
    
    with col2:
        active_projects = [p for p in projects if p.get('status') == 'active']
        st.metric("Active Projects", len(active_projects))
    
    with col3:
        completed_projects = [p for p in projects if p.get('status') == 'completed']
        st.metric("Completed", len(completed_projects))
    
    with col4:
        st.metric("Organisations", len(orgs))
    
    st.divider()
    
    # Recent projects
    st.subheader("📊 Recent Projects")
    
    if projects:
        # Convert to DataFrame for display
        df = pd.DataFrame(projects)
        
        # Format dates
        if 'created_at' in df.columns:
            df['created_at'] = pd.to_datetime(df['created_at']).dt.strftime('%Y-%m-%d')
        
        # Display table
        st.dataframe(
            df[['name', 'organisation_name', 'status', 'created_by_email', 'created_at']],
            use_container_width=True,
            hide_index=True
        )
        
        # Project status chart
        if len(projects) > 0:
            status_counts = df['status'].value_counts()
            fig = px.pie(
                values=status_counts.values,
                names=status_counts.index,
                title="Project Status Distribution"
            )
            st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("No projects found. Create your first project to get started!")

def show_projects():
    """Show projects management"""
    st.markdown('<h1 class="main-header">📋 Project Management</h1>', unsafe_allow_html=True)
    
    # Sidebar for project actions
    with st.sidebar:
        st.subheader("Project Actions")
        
        if st.button("➕ Create New Project", type="primary"):
            st.session_state.show_create_form = True
            st.session_state.show_edit_form = False
            st.session_state.selected_project = None
        
        if st.button("🔄 Refresh"):
            if 'show_create_form' in st.session_state:
                del st.session_state.show_create_form
            if 'show_edit_form' in st.session_state:
                del st.session_state.show_edit_form
            st.rerun()
    
    # Show create form
    if st.session_state.get('show_create_form'):
        show_create_project_form()
        return
    
    # Show projects list
    projects = load_projects()
    
    if projects:
        for project in projects:
            with st.expander(f"📁 {project['name']} ({project.get('status', 'draft').title()})"):
                col1, col2 = st.columns([3, 1])
                
                with col1:
                    st.write(f"**Organisation:** {project.get('organisation_name', 'N/A')}")
                    st.write(f"**Created by:** {project.get('created_by_email', 'N/A')}")
                    st.write(f"**Created:** {project.get('created_at', 'N/A')}")
                    if project.get('description'):
                        st.write(f"**Description:** {project['description']}")
                
                with col2:
                    if st.button("🗑️ Delete", key=f"delete_{project['id']}"):
                        conn = get_db_connection()
                        cursor = conn.cursor()
                        cursor.execute('DELETE FROM projects WHERE id = ?', (project['id'],))
                        conn.commit()
                        conn.close()
                        st.success("Project deleted successfully!")
                        st.rerun()
    else:
        st.info("No projects found. Click 'Create New Project' to get started!")

def show_create_project_form():
    """Show project creation form"""
    st.subheader("➕ Create New Project")
    
    # Load organisations for dropdown
    organisations = load_organisations()
    
    if not organisations:
        st.error("No organisations found. Please add organisations first.")
        return
    
    # Form fields
    with st.form("create_project_form"):
        project_name = st.text_input("Project Name*", help="Enter a descriptive name for your ESG project")
        project_description = st.text_area("Description", help="Optional description of the project scope and objectives")
        
        org_options = {f"{org['name']} ({org['id']})": org['id'] for org in organisations}
        selected_org = st.selectbox("Organisation*", list(org_options.keys()))
        
        status_options = ['draft', 'active', 'completed', 'archived']
        project_status = st.selectbox("Status", status_options, index=0)
        
        col1, col2 = st.columns(2)
        with col1:
            if st.form_submit_button("Create Project", type="primary"):
                if not project_name:
                    st.error("Project name is required")
                    return
                
                # Validate input
                validated_name = validate_input(project_name, 255)
                validated_description = validate_input(project_description, 1000)
                
                if not validated_name:
                    st.error("Invalid project name")
                    return
                
                project_data = {
                    'name': validated_name,
                    'description': validated_description,
                    'organisation_id': org_options[selected_org],
                    'status': project_status,
                    'created_by': st.session_state.user['username']
                }
                
                try:
                    project_id = create_project(project_data)
                    st.success(f"Project '{validated_name}' created successfully!")
                    
                    # Clear form
                    st.session_state.show_create_form = False
                    st.rerun()
                
                except Exception as e:
                    st.error(f"Failed to create project: {str(e)}")
        
        with col2:
            if st.form_submit_button("Cancel"):
                st.session_state.show_create_form = False
                st.rerun()

def show_esg_frameworks():
    """Show ESG frameworks page"""
    st.markdown('<h1 class="main-header">🏛️ ESG Frameworks</h1>', unsafe_allow_html=True)
    
    st.info("ESG Framework assessments are available. Select a project to begin assessment.")
    
    # Project selection
    projects = load_projects()
    
    if not projects:
        st.warning("No projects found. Please create a project first.")
        return
    
    project_options = {f"{p['name']} ({p['id']})": p['id'] for p in projects}
    selected_project = st.selectbox("Select Project for Assessment", list(project_options.keys()))
    
    if selected_project:
        project_id = project_options[selected_project]
        
        st.subheader("Available Frameworks")
        
        col1, col2 = st.columns(2)
        
        with col1:
            if st.button("🏛️ TCFD Assessment", type="primary"):
                st.session_state.selected_framework = "TCFD"
                st.session_state.selected_project_id = project_id
                st.rerun()
            
            if st.button("🇪🇺 CSRD Assessment", type="primary"):
                st.session_state.selected_framework = "CSRD"
                st.session_state.selected_project_id = project_id
                st.rerun()
        
        with col2:
            if st.button("📈 GRI Assessment", type="primary"):
                st.session_state.selected_framework = "GRI"
                st.session_state.selected_project_id = project_id
                st.rerun()
            
            if st.button("🏢 SASB Assessment", type="primary"):
                st.session_state.selected_framework = "SASB"
                st.session_state.selected_project_id = project_id
                st.rerun()
        
        # Show framework assessment form if selected
        if st.session_state.get('selected_framework'):
            show_framework_assessment()

def show_framework_assessment():
    """Show framework assessment form"""
    framework = st.session_state.get('selected_framework')
    project_id = st.session_state.get('selected_project_id')
    
    if not framework or not project_id:
        return
    
    framework_descriptions = {
        "TCFD": "Task Force on Climate-related Financial Disclosures",
        "CSRD": "Corporate Sustainability Reporting Directive",
        "GRI": "Global Reporting Initiative",
        "SASB": "Sustainability Accounting Standards Board"
    }
    
    st.subheader(f"📋 {framework} Assessment")
    st.write(f"**{framework_descriptions.get(framework, '')}**")
    
    with st.form(f"{framework}_assessment_form"):
        st.write("Please provide the following information for your assessment:")
        
        # Generic assessment fields
        governance = st.text_area("Governance Disclosures*", help="Describe governance processes for climate-related risks and opportunities")
        strategy = st.text_area("Strategy Disclosures*", help="Describe actual and potential impacts of climate-related risks on strategy")
        risk_management = st.text_area("Risk Management Disclosures*", help="Describe processes for identifying and assessing climate-related risks")
        metrics_targets = st.text_area("Metrics and Targets*", help="Provide metrics and targets used to assess climate-related risks")
        
        col1, col2 = st.columns(2)
        
        with col1:
            if st.form_submit_button("Submit Assessment", type="primary"):
                if not all([governance, strategy, risk_management, metrics_targets]):
                    st.error("All fields are required")
                    return
                
                # Save assessment to database
                conn = get_db_connection()
                cursor = conn.cursor()
                
                assessment_id = f"{framework.lower()}_{int(time.time())}"
                
                cursor.execute(f'''
                    INSERT OR REPLACE INTO {framework.lower()}_assessments 
                    (id, project_id, governance_data, strategy_data, risk_management_data, metrics_targets_data)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (assessment_id, project_id, governance, strategy, risk_management, metrics_targets))
                
                conn.commit()
                conn.close()
                
                st.success(f"{framework} assessment saved successfully!")
                
                # Clear framework selection
                del st.session_state.selected_framework
                del st.session_state.selected_project_id
                st.rerun()
        
        with col2:
            if st.form_submit_button("Cancel"):
                del st.session_state.selected_framework
                del st.session_state.selected_project_id
                st.rerun()

def show_analytics():
    """Show analytics page"""
    st.markdown('<h1 class="main-header">📊 ESG Analytics</h1>', unsafe_allow_html=True)
    
    # Load data
    projects = load_projects()
    
    if not projects:
        st.warning("No projects found. Please create a project first.")
        return
    
    # Project selection for analytics
    project_options = {f"{p['name']} ({p['id']})": p['id'] for p in projects}
    selected_project = st.selectbox("Select Project for Analytics", list(project_options.keys()))
    
    if selected_project:
        project_id = project_options[selected_project]
        
        # Load ESG data for the project
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM esg_data_points 
            WHERE project_id = ? 
            ORDER BY year DESC, period DESC
        ''', (project_id,))
        
        esg_data = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        if esg_data:
            df = pd.DataFrame(esg_data)
            
            # ESG Category Chart
            st.subheader("📈 ESG Data Overview")
            
            col1, col2 = st.columns(2)
            
            with col1:
                category_counts = df['category'].value_counts()
                fig = px.pie(
                    values=category_counts.values,
                    names=category_counts.index,
                    title="ESG Data by Category"
                )
                st.plotly_chart(fig, use_container_width=True)
            
            with col2:
                # Yearly trend
                year_counts = df['year'].value_counts().sort_index()
                fig = px.line(
                    x=year_counts.index,
                    y=year_counts.values,
                    title="ESG Data Points by Year",
                    labels={'x': 'Year', 'y': 'Number of Data Points'}
                )
                st.plotly_chart(fig, use_container_width=True)
            
            # Data table
            st.subheader("📋 ESG Data Table")
            st.dataframe(df, use_container_width=True, hide_index=True)
            
            # Export options
            st.subheader("📤 Export Data")
            
            col1, col2, col3 = st.columns(3)
            
            with col1:
                if st.button("📊 Export as CSV"):
                    csv = df.to_csv(index=False)
                    st.download_button(
                        label="Download CSV",
                        data=csv,
                        file_name=f"esg_data_{project_id}.csv",
                        mime="text/csv"
                    )
            
            with col2:
                if st.button("📄 Export as JSON"):
                    json_data = df.to_json(orient='records')
                    st.download_button(
                        label="Download JSON",
                        data=json_data,
                        file_name=f"esg_data_{project_id}.json",
                        mime="application/json"
                    )
            
            with col3:
                st.info("More export options coming soon!")
        else:
            st.info("No ESG data found for this project. Add ESG data points to see analytics.")

def show_settings():
    """Show settings page"""
    st.markdown('<h1 class="main-header">⚙️ Settings</h1>', unsafe_allow_html=True)
    
    user = st.session_state.get('user', {})
    
    st.subheader("👤 User Profile")
    st.write(f"**Username:** {user.get('username', 'N/A')}")
    st.write(f"**Email:** {user.get('email', 'N/A')}")
    st.write(f"**Role:** {user.get('role', 'N/A').title()}")
    st.write(f"**Last Login:** {user.get('last_login', 'N/A')}")
    
    st.divider()
    
    st.subheader("🔧 System Settings")
    st.info("System settings are managed by administrators.")
    
    # Database status
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) as count FROM projects')
        project_count = cursor.fetchone()['count']
        conn.close()
        
        st.success(f"✅ Database connection: Healthy")
        st.info(f"📊 Total projects in database: {project_count}")
        
    except Exception as e:
        st.error(f"❌ Database connection error: {e}")

def logout():
    """Logout user"""
    if 'user' in st.session_state:
        del st.session_state.user
    if 'logged_in' in st.session_state:
        del st.session_state.logged_in
    
    # Clear any other session state
    keys_to_clear = ['show_create_form', 'show_edit_form', 'selected_project', 
                    'selected_framework', 'selected_project_id']
    
    for key in keys_to_clear:
        if key in st.session_state:
            del st.session_state[key]
    
    st.rerun()

# Main app
def main():
    """Main application"""
    # Initialize database
    init_database()
    
    # Create default admin user
    create_default_admin()
    
    # Create sample data if no projects exist
    projects = load_projects()
    if not projects:
        create_sample_data()
    
    # Check if user is logged in
    if not st.session_state.get('logged_in', False):
        show_login()
        return
    
    # Show logout button in sidebar
    with st.sidebar:
        st.write(f"👤 **{st.session_state.user['username']}**")
        st.write(f"Role: {st.session_state.user['role'].title()}")
        
        if st.button("🚪 Logout"):
            logout()
    
    # Navigation
    with st.sidebar:
        st.subheader("🧭 Navigation")
        page = st.selectbox("Select Page", [
            "🏠 Dashboard",
            "📋 Projects", 
            "🏛️ ESG Frameworks",
            "📊 Analytics",
            "⚙️ Settings"
        ])
    
    # Show selected page
    if page == "🏠 Dashboard":
        show_dashboard()
    elif page == "📋 Projects":
        show_projects()
    elif page == "🏛️ ESG Frameworks":
        show_esg_frameworks()
    elif page == "📊 Analytics":
        show_analytics()
    elif page == "⚙️ Settings":
        show_settings()

if __name__ == "__main__":
    main()