"""
ESG Pathfinder Streamlit Dashboard
Secure ESG compliance management dashboard with authentication and validation
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import time

# Import our security modules
from auth import auth
from database import (db, load_projects, load_project_by_id, create_project, 
                      update_project, delete_project, load_organisations, load_esg_data)
from validation import (validate_project_form_data, validate_esg_form_data, 
                       InputValidator, show_validation_errors)
from error_handling import (handle_error, display_error, error_handler, 
                           streamlit_logger, performance_logger)
from api_integration import api_client, show_api_status, initialize_api_integration
from esg_frameworks import TCFDAssessment, CSRDAssessment, GRIAssessment, SASBAssessment
from visualizations import (show_esg_analytics_dashboard, show_project_comparison, 
                           ESGVisualizer, export_esg_data)

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

@error_handler
def show_dashboard():
    """Main dashboard view"""
    streamlit_logger.log_page_view("Dashboard")
    
    st.markdown('<h1 class="main-header">🌍 ESG Pathfinder Dashboard</h1>', unsafe_allow_html=True)
    
    # Load metrics
    start_time = time.time()
    projects = load_projects()
    load_time = time.time() - start_time
    performance_logger.log_page_load_time("Dashboard", load_time)
    
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
        orgs = load_organisations()
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
            df[['name', 'organisation_name', 'status', 'created_by_name', 'created_at']],
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

@error_handler
def show_projects():
    """Projects management view"""
    streamlit_logger.log_page_view("Projects")
    
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
    
    # Show edit form
    if st.session_state.get('show_edit_form'):
        show_edit_project_form()
        return
    
    # Show projects list
    projects = load_projects()
    
    if projects:
        for project in projects:
            with st.expander(f"📁 {project['name']} ({project.get('status', 'draft').title()})"):
                col1, col2 = st.columns([3, 1])
                
                with col1:
                    st.write(f"**Organisation:** {project.get('organisation_name', 'N/A')}")
                    st.write(f"**Created by:** {project.get('created_by_name', 'N/A')}")
                    st.write(f"**Created:** {project.get('created_at', 'N/A')}")
                    if project.get('description'):
                        st.write(f"**Description:** {project['description']}")
                
                with col2:
                    if st.button("✏️ Edit", key=f"edit_{project['id']}"):
                        st.session_state.show_edit_form = True
                        st.session_state.selected_project = project
                        st.rerun()
                    
                    if st.button("🗑️ Delete", key=f"delete_{project['id']}"):
                        if delete_project(project['id']):
                            st.success("Project deleted successfully!")
                            streamlit_logger.log_user_action("delete_project", 
                                                            {'project_id': project['id']})
                            st.rerun()
                        else:
                            st.error("Failed to delete project")
    else:
        st.info("No projects found. Click 'Create New Project' to get started!")

@error_handler
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
        st.text_input("Project Name*", key="project_name", 
                     help="Enter a descriptive name for your ESG project")
        
        st.text_area("Description", key="project_description", 
                    help="Optional description of the project scope and objectives")
        
        org_options = {f"{org['name']} ({org['id']})": org['id'] for org in organisations}
        selected_org = st.selectbox("Organisation*", list(org_options.keys()), 
                                   key="organisation")
        
        status_options = ['draft', 'active', 'completed', 'archived']
        st.selectbox("Status", status_options, key="project_status", index=0)
        
        col1, col2 = st.columns(2)
        with col1:
            if st.form_submit_button("Create Project", type="primary"):
                validated_data = validate_project_form_data()
                
                if validated_data:
                    validated_data['organisation_id'] = org_options[selected_org]
                    validated_data['created_by'] = st.session_state.get('user', {}).get('username')
                    
                    try:
                        project_id = create_project(validated_data)
                        st.success(f"Project '{validated_data['name']}' created successfully!")
                        streamlit_logger.log_user_action("create_project", 
                                                        {'project_id': project_id, 
                                                         'project_name': validated_data['name']})
                        
                        # Clear form
                        for key in ['project_name', 'project_description', 'organisation', 'project_status']:
                            if key in st.session_state:
                                del st.session_state[key]
                        
                        st.session_state.show_create_form = False
                        st.rerun()
                    
                    except Exception as e:
                        error_info = handle_error(e, "Create Project")
                        display_error(error_info)
        
        with col2:
            if st.form_submit_button("Cancel"):
                st.session_state.show_create_form = False
                st.rerun()

@error_handler
def show_edit_project_form():
    """Show project edit form"""
    project = st.session_state.get('selected_project')
    
    if not project:
        st.error("No project selected for editing")
        return
    
    st.subheader(f"✏️ Edit Project: {project['name']}")
    
    with st.form("edit_project_form"):
        # Pre-fill form with existing data
        st.text_input("Project Name*", value=project['name'], key="edit_project_name")
        
        description = project.get('description', '')
        st.text_area("Description", value=description, key="edit_project_description")
        
        # Status
        status_options = ['draft', 'active', 'completed', 'archived']
        current_status = project.get('status', 'draft')
        st.selectbox("Status", status_options, key="edit_project_status", 
                    index=status_options.index(current_status))
        
        col1, col2 = st.columns(2)
        with col1:
            if st.form_submit_button("Update Project", type="primary"):
                # Validate form data
                validator = InputValidator()
                
                try:
                    updated_data = {
                        'name': validator.validate_project_name(st.session_state.edit_project_name),
                        'description': validator.validate_description(st.session_state.edit_project_description),
                        'status': validator.validate_project_status(st.session_state.edit_project_status)
                    }
                    
                    if update_project(project['id'], updated_data):
                        st.success(f"Project '{updated_data['name']}' updated successfully!")
                        streamlit_logger.log_user_action("update_project", 
                                                        {'project_id': project['id'], 
                                                         'project_name': updated_data['name']})
                        
                        # Clear form state
                        st.session_state.show_edit_form = False
                        st.session_state.selected_project = None
                        st.rerun()
                    else:
                        st.error("Failed to update project")
                
                except Exception as e:
                    error_info = handle_error(e, "Update Project")
                    display_error(error_info)
        
        with col2:
            if st.form_submit_button("Cancel"):
                st.session_state.show_edit_form = False
                st.session_state.selected_project = None
                st.rerun()

@error_handler
def show_esg_data():
    """ESG data management view"""
    streamlit_logger.log_page_view("ESG Data")
    
    st.markdown('<h1 class="main-header">📊 ESG Data Management</h1>', unsafe_allow_html=True)
    
    # Project selection
    projects = load_projects()
    
    if not projects:
        st.warning("No projects found. Please create a project first.")
        return
    
    project_options = {f"{p['name']} ({p['id']})": p['id'] for p in projects}
    selected_project = st.selectbox("Select Project", list(project_options.keys()))
    
    if selected_project:
        project_id = project_options[selected_project]
        st.session_state.current_project_id = project_id
        
        # Show ESG data for selected project
        esg_data = load_esg_data(project_id)
        
        col1, col2 = st.columns([2, 1])
        
        with col1:
            st.subheader("📈 ESG Metrics")
            
            if esg_data:
                df = pd.DataFrame(esg_data)
                st.dataframe(df, use_container_width=True, hide_index=True)
                
                # ESG Category Chart
                if len(esg_data) > 0:
                    category_counts = df['category'].value_counts()
                    fig = px.bar(
                        x=category_counts.index,
                        y=category_counts.values,
                        title="ESG Data by Category",
                        labels={'x': 'Category', 'y': 'Number of Metrics'}
                    )
                    st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No ESG data found for this project.")
        
        with col2:
            st.subheader("➕ Add ESG Data")
            
            with st.form("add_esg_data"):
                st.selectbox("Category", ['environmental', 'social', 'governance'], 
                           key="esg_category")
                
                st.number_input("Year", min_value=2000, max_value=2030, 
                              value=datetime.now().year, key="esg_year")
                
                st.selectbox("Period", ['Q1', 'Q2', 'Q3', 'Q4', 'H1', 'H2', 'Annual'], 
                           key="esg_period")
                
                st.text_input("Metric Name*", key="metric_name")
                st.text_input("Value*", key="metric_value")
                st.text_input("Unit", key="metric_unit")
                st.text_input("Source", key="metric_source")
                st.text_area("Notes", key="metric_notes")
                
                if st.form_submit_button("Add ESG Data", type="primary"):
                    validated_data = validate_esg_form_data()
                    
                    if validated_data:
                        st.success("ESG data added successfully!")
                        streamlit_logger.log_user_action("add_esg_data", 
                                                        {'project_id': project_id, 
                                                         'category': validated_data['category']})
                        st.rerun()

@error_handler
def show_admin():
    """Admin panel view"""
    user = st.session_state.get('user', {})
    
    if user.get('role') != 'admin':
        st.error("Access denied. Admin role required.")
        return
    
    streamlit_logger.log_page_view("Admin")
    
    st.markdown('<h1 class="main-header">⚙️ Admin Panel</h1>', unsafe_allow_html=True)
    
    # Database status
    st.subheader("🗄️ Database Status")
    
    try:
        is_connected = db.test_connection()
        if is_connected:
            st.success("✅ Database connection: Healthy")
        else:
            st.error("❌ Database connection: Failed")
    except Exception as e:
        st.error(f"❌ Database connection error: {e}")
    
    # System metrics
    st.subheader("📊 System Metrics")
    
    projects = load_projects()
    orgs = load_organisations()
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Total Projects", len(projects))
    with col2:
        st.metric("Organisations", len(orgs))
    with col3:
        st.metric("Database Status", "Healthy" if db.test_connection() else "Error")
    
    # Error history
    st.subheader("🐛 Error History")
    show_error_history()

@error_handler
def show_esg_frameworks():
    """ESG frameworks assessment view"""
    streamlit_logger.log_page_view("ESG Frameworks")
    
    st.markdown('<h1 class="main-header">🏛️ ESG Frameworks</h1>', unsafe_allow_html=True)
    
    # Project selection
    projects = load_projects()
    
    if not projects:
        st.warning("No projects found. Please create a project first.")
        return
    
    project_options = {f"{p['name']} ({p['id']})": p['id'] for p in projects}
    selected_project = st.selectbox("Select Project for Assessment", list(project_options.keys()))
    
    if selected_project:
        project_id = project_options[selected_project]
        st.session_state.current_project_id = project_id
        
        # Framework selection tabs
        framework_tabs = st.tabs(["🏛️ TCFD", "🇪🇺 CSRD", "📈 GRI", "🏢 SASB"])
        
        with framework_tabs[0]:
            TCFDAssessment.show_assessment_form(project_id)
            st.divider()
            TCFDAssessment.show_assessment_report(project_id)
        
        with framework_tabs[1]:
            CSRDAssessment.show_assessment_form(project_id)
        
        with framework_tabs[2]:
            GRIAssessment.show_assessment_form(project_id)
        
        with framework_tabs[3]:
            SASBAssessment.show_assessment_form(project_id)

@error_handler
def show_analytics():
    """Advanced analytics view"""
    streamlit_logger.log_page_view("Analytics")
    
    st.markdown('<h1 class="main-header">📊 ESG Analytics</h1>', unsafe_allow_html=True)
    
    # Analytics tabs
    analytics_tabs = st.tabs(["📈 Dashboard Analytics", "🔄 Project Comparison", "📋 Data Export"])
    
    with analytics_tabs[0]:
        show_esg_analytics_dashboard()
    
    with analytics_tabs[1]:
        show_project_comparison()
    
    with analytics_tabs[2]:
        show_data_export()

@error_handler
def show_data_export():
    """Data export functionality"""
    st.subheader("📤 Export ESG Data")
    
    projects = load_projects()
    
    if not projects:
        st.warning("No projects found for export.")
        return
    
    # Project selection
    project_options = {f"{p['name']} ({p['id']})": p['id'] for p in projects}
    selected_project = st.selectbox("Select Project to Export", list(project_options.keys()))
    
    if selected_project:
        project_id = project_options[selected_project]
        
        # Load ESG data
        esg_data = load_esg_data(project_id)
        
        if not esg_data:
            st.warning("No ESG data found for this project.")
            return
        
        # Export format selection
        export_format = st.selectbox(
            "Export Format",
            ["CSV", "JSON", "Excel"],
            key="export_format"
        )
        
        if st.button("📤 Export Data", type="primary"):
            try:
                exported_data = export_esg_data(esg_data, export_format.lower())
                
                # Provide download
                st.download_button(
                    label=f"Download {export_format} file",
                    data=exported_data,
                    file_name=f"esg_data_{project_id}_{datetime.now().strftime('%Y%m%d')}.{export_format.lower()}",
                    mime="text/csv" if export_format == "CSV" else "application/json"
                )
                
                st.success(f"Data exported successfully in {export_format} format!")
                streamlit_logger.log_user_action("export_data", 
                                                {'project_id': project_id, 
                                                 'format': export_format})
            
            except Exception as e:
                error_info = handle_error(e, "Data Export")
                display_error(error_info)

def main():
    """Main application entry point"""
    # Require authentication
    auth.require_auth()
    
    # Sidebar navigation
    with st.sidebar:
        st.title("🌍 ESG Pathfinder")
        
        # Navigation
        page = st.selectbox(
            "Navigate to:",
            ["Dashboard", "Projects", "ESG Data", "ESG Frameworks", "Analytics", "Admin Panel"],
            key="navigation"
        )
        
        st.divider()
        
        # API Integration Status
        show_api_status()
        
        st.divider()
        
        # User info (already shown in require_auth, but additional info here)
        user = st.session_state.get('user', {})
        st.write(f"**Role:** {user.get('role', 'user').title()}")
        
        # Quick stats
        if page == "Dashboard":
            projects = load_projects()
            st.write(f"**Projects:** {len(projects)}")
    
    # Route to appropriate page
    if page == "Dashboard":
        show_dashboard()
    elif page == "Projects":
        show_projects()
    elif page == "ESG Data":
        show_esg_data()
    elif page == "ESG Frameworks":
        show_esg_frameworks()
    elif page == "Analytics":
        show_analytics()
    elif page == "Admin Panel":
        show_admin()

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        error_info = handle_error(e, "Main Application")
        display_error(error_info)