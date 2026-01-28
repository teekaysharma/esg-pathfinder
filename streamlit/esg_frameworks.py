"""
ESG Framework implementations for Streamlit Dashboard
Support for TCFD, CSRD, GRI, SASB, and IFRS standards
"""

import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import pandas as pd

from validation import ESGDataValidator, InputValidator
from database import db, load_project_by_id
from api_integration import api_client
from error_handling import error_handler, streamlit_logger

class TCFDAssessment:
    """
    Task Force on Climate-related Financial Disclosures (TCFD) implementation
    """
    
    @staticmethod
    @error_handler
    show_assessment_form(project_id: str):
        """Show TCFD assessment form"""
        st.markdown("### 🏛️ TCFD Assessment")
        st.markdown("*Task Force on Climate-related Financial Disclosures*")
        
        # Load existing assessment if available
        existing_assessment = None
        try:
            if st.session_state.get('api_integration_enabled', False):
                existing_assessment = api_client.get_tcfd_assessment(project_id)
        except:
            pass
        
        with st.form("tcfd_assessment_form"):
            st.subheader("1. Governance")
            governance = st.text_area(
                "Describe the board's oversight of climate-related risks and opportunities",
                value=existing_assessment.get('governance', '') if existing_assessment else '',
                height=150,
                key="tcfd_governance",
                help="Include board structure, committees, and reporting processes"
            )
            
            st.subheader("2. Strategy")
            strategy = st.text_area(
                "Describe the actual and potential impacts of climate-related risks and opportunities",
                value=existing_assessment.get('strategy', '') if existing_assessment else '',
                height=150,
                key="tcfd_strategy",
                help="Include transition risks, physical risks, and opportunities"
            )
            
            st.subheader("3. Risk Management")
            risk_management = st.text_area(
                "Describe the organization's processes for identifying and managing climate-related risks",
                value=existing_assessment.get('risk_management', '') if existing_assessment else '',
                height=150,
                key="tcfd_risk_management",
                help="Include risk identification, assessment, and integration processes"
            )
            
            st.subheader("4. Metrics and Targets")
            metrics_targets = st.text_area(
                "Describe the metrics and targets used to assess and manage climate-related risks",
                value=existing_assessment.get('metrics_targets', '') if existing_assessment else '',
                height=150,
                key="tcfd_metrics_targets",
                help="Include Scope 1-3 emissions, climate-related metrics, and targets"
            )
            
            col1, col2 = st.columns(2)
            with col1:
                if st.form_submit_button("Save TCFD Assessment", type="primary"):
                    assessment_data = {
                        'governance': governance,
                        'strategy': strategy,
                        'risk_management': risk_management,
                        'metrics_targets': metrics_targets
                    }
                    
                    # Validate assessment
                    validator = ESGDataValidator()
                    try:
                        validated_data = validator.validate_tcfd_assessment(assessment_data)
                        
                        # Save via API if available
                        if st.session_state.get('api_integration_enabled', False):
                            result = api_client.create_tcfd_assessment(project_id, validated_data)
                            st.success("TCFD assessment saved via API!")
                        else:
                            # Save to local database
                            save_tcfd_assessment_local(project_id, validated_data)
                            st.success("TCFD assessment saved locally!")
                        
                        streamlit_logger.log_user_action("save_tcfd_assessment", 
                                                        {'project_id': project_id})
                        st.rerun()
                    
                    except Exception as e:
                        st.error(f"Validation error: {e}")
            
            with col2:
                if st.form_submit_button("Clear Form"):
                    # Clear form fields
                    for key in ['tcfd_governance', 'tcfd_strategy', 'tcfd_risk_management', 'tcfd_metrics_targets']:
                        if key in st.session_state:
                            del st.session_state[key]
                    st.rerun()
    
    @staticmethod
    def show_assessment_report(project_id: str):
        """Show TCFD assessment report"""
        st.markdown("### 📊 TCFD Assessment Report")
        
        # Load assessment data
        assessment = None
        try:
            if st.session_state.get('api_integration_enabled', False):
                assessment = api_client.get_tcfd_assessment(project_id)
        except:
            assessment = load_tcfd_assessment_local(project_id)
        
        if not assessment:
            st.info("No TCFD assessment found. Please complete the assessment first.")
            return
        
        # Display assessment sections
        sections = [
            ("Governance", assessment.get('governance', ''), "🏛️"),
            ("Strategy", assessment.get('strategy', ''), "🎯"),
            ("Risk Management", assessment.get('risk_management', ''), "⚠️"),
            ("Metrics and Targets", assessment.get('metrics_targets', ''), "📈")
        ]
        
        for title, content, icon in sections:
            with st.expander(f"{icon} {title}"):
                if content:
                    st.write(content)
                else:
                    st.warning("No content provided for this section.")
        
        # TCFD compliance score
        score = calculate_tcfd_compliance_score(assessment)
        st.subheader("📊 TCFD Compliance Score")
        
        fig = go.Figure(go.Indicator(
            mode = "gauge+number+delta",
            value = score,
            domain = {'x': [0, 1], 'y': [0, 1]},
            title = {'text': "TCFD Compliance"},
            delta = {'reference': 80},
            gauge = {
                'axis': {'range': [None, 100]},
                'bar': {'color': "darkblue"},
                'steps': [
                    {'range': [0, 50], 'color': "lightgray"},
                    {'range': [50, 80], 'color': "yellow"},
                    {'range': [80, 100], 'color': "lightgreen"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 90
                }
            }
        ))
        
        st.plotly_chart(fig, use_container_width=True)

class CSRDAssessment:
    """
    Corporate Sustainability Reporting Directive (CSRD) implementation
    """
    
    @staticmethod
    @error_handler
    show_assessment_form(project_id: str):
        """Show CSRD assessment form"""
        st.markdown("### 🇪🇺 CSRD Assessment")
        st.markdown("*Corporate Sustainability Reporting Directive*")
        
        with st.form("csrd_assessment_form"):
            st.subheader("Double Materiality Assessment")
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.write("**Environmental Impact**")
                env_impact = st.text_area(
                    "Environmental materiality assessment",
                    height=100,
                    key="csrd_env_impact",
                    help="Impact on climate, pollution, biodiversity, etc."
                )
                
                env_financial = st.text_area(
                    "Financial impact from environmental factors",
                    height=100,
                    key="csrd_env_financial",
                    help="Financial risks and opportunities from environmental issues"
                )
            
            with col2:
                st.write("**Social Impact**")
                social_impact = st.text_area(
                    "Social materiality assessment",
                    height=100,
                    key="csrd_social_impact",
                    help="Impact on employees, customers, communities, etc."
                )
                
                social_financial = st.text_area(
                    "Financial impact from social factors",
                    height=100,
                    key="csrd_social_financial",
                    help="Financial risks and opportunities from social issues"
                )
            
            st.subheader("ESRS Standards Compliance")
            
            esrs_compliance = {}
            esrs_standards = [
                "E1 - Climate Change",
                "E2 - Pollution", 
                "E3 - Water & Marine Resources",
                "E4 - Biodiversity & Ecosystems",
                "E5 - Resource Use & Circular Economy",
                "S1 - Own Workforce",
                "S2 - Workers in Value Chain",
                "S3 - Affected Communities",
                "S4 - Consumers & End Users",
                "G1 - Business Conduct"
            ]
            
            for standard in esrs_standards:
                col1, col2 = st.columns([3, 1])
                with col1:
                    esrs_compliance[standard] = st.text_area(
                        standard,
                        height=50,
                        key=f"esrs_{standard.replace(' ', '_').replace('-', '_')}"
                    )
                with col2:
                    st.write("")
            
            if st.form_submit_button("Save CSRD Assessment", type="primary"):
                assessment_data = {
                    'env_impact': env_impact,
                    'env_financial': env_financial,
                    'social_impact': social_impact,
                    'social_financial': social_financial,
                    'esrs_compliance': esrs_compliance
                }
                
                # Save assessment
                if st.session_state.get('api_integration_enabled', False):
                    result = api_client.create_csrd_assessment(project_id, assessment_data)
                    st.success("CSRD assessment saved via API!")
                else:
                    save_csrd_assessment_local(project_id, assessment_data)
                    st.success("CSRD assessment saved locally!")
                
                streamlit_logger.log_user_action("save_csrd_assessment", 
                                                {'project_id': project_id})
                st.rerun()

class GRIAssessment:
    """
    Global Reporting Initiative (GRI) implementation
    """
    
    @staticmethod
    @error_handler
    show_assessment_form(project_id: str):
        """Show GRI assessment form"""
        st.markdown("### 📈 GRI Assessment")
        st.markdown("*Global Reporting Initiative Standards*")
        
        with st.form("gri_assessment_form"):
            st.subheader("GRI Standards Coverage")
            
            gri_standards = {
                "Universal Standards": [
                    "GRI 1 - Foundation",
                    "GRI 2 - General Disclosures",
                    "GRI 3 - Material Topics"
                ],
                "Sector Standards": [
                    "GRI 11 - Oil & Gas",
                    "GRI 12 - Coal",
                    # Add more sector standards as needed
                ],
                "Topic Standards": [
                    "GRI 200 - Economic",
                    "GRI 300 - Environmental",
                    "GRI 400 - Social"
                ]
            }
            
            assessment_data = {}
            
            for category, standards in gri_standards.items():
                st.write(f"**{category}**")
                
                for standard in standards:
                    key = standard.replace(' ', '_').replace('-', '_').lower()
                    compliance_level = st.selectbox(
                        standard,
                        ["Not Applicable", "In Progress", "Compliant", "Exceeds Requirements"],
                        key=f"gri_{key}",
                        help="Select the compliance level for this standard"
                    )
                    notes = st.text_area(
                        "Notes and Evidence",
                        height=50,
                        key=f"gri_{key}_notes"
                    )
                    
                    assessment_data[key] = {
                        'compliance': compliance_level,
                        'notes': notes
                    }
                    
                    st.write("---")
            
            if st.form_submit_button("Save GRI Assessment", type="primary"):
                # Save assessment
                save_gri_assessment_local(project_id, assessment_data)
                st.success("GRI assessment saved!")
                
                streamlit_logger.log_user_action("save_gri_assessment", 
                                                {'project_id': project_id})
                st.rerun()

class SASBAssessment:
    """
    Sustainability Accounting Standards Board (SASB) implementation
    """
    
    @staticmethod
    @error_handler
    show_assessment_form(project_id: str):
        """Show SASB assessment form"""
        st.markdown("### 🏢 SASB Assessment")
        st.markdown("*Sustainability Accounting Standards Board*")
        
        # Industry selection
        industries = {
            "Technology & Communications": [
                "Software & IT Services",
                "Semiconductors",
                "Telecommunications"
            ],
            "Financials": [
                "Banking",
                "Insurance",
                "Investment Management"
            ],
            "Healthcare": [
                "Biotechnology",
                "Pharmaceuticals",
                "Health Care Delivery"
            ],
            "Consumer Goods": [
                "Food & Beverage",
                "Apparel & Accessories",
                "Home Durables"
            ]
        }
        
        selected_industry = st.selectbox(
            "Select Industry",
            list(industries.keys()),
            key="sasb_industry"
        )
        
        if selected_industry:
            st.write(f"**SASB Standards for {selected_industry}**")
            
            with st.form("sasb_assessment_form"):
                assessment_data = {}
                
                for sub_industry in industries[selected_industry]:
                    st.write(f"**{sub_industry}**")
                    
                    # Example SASB metrics for each industry
                    metrics = get_sasb_metrics_for_industry(sub_industry)
                    
                    for metric in metrics:
                        col1, col2, col3 = st.columns([2, 1, 1])
                        
                        with col1:
                            st.write(metric['name'])
                            st.caption(metric['description'])
                        
                        with col2:
                            value = st.text_input(
                                "Value",
                                key=f"sasb_{metric['code']}_value"
                            )
                        
                        with col3:
                            unit = st.text_input(
                                "Unit",
                                key=f"sasb_{metric['code']}_unit",
                                value=metric.get('unit', '')
                            )
                        
                        notes = st.text_area(
                            "Notes",
                            height=30,
                            key=f"sasb_{metric['code']}_notes"
                        )
                        
                        assessment_data[metric['code']] = {
                            'value': value,
                            'unit': unit,
                            'notes': notes
                        }
                        
                        st.write("---")
                
                if st.form_submit_button("Save SASB Assessment", type="primary"):
                    # Save assessment
                    save_sasb_assessment_local(project_id, {
                        'industry': selected_industry,
                        'metrics': assessment_data
                    })
                    st.success("SASB assessment saved!")
                    
                    streamlit_logger.log_user_action("save_sasb_assessment", 
                                                    {'project_id': project_id})
                    st.rerun()

# Helper functions
def calculate_tcfd_compliance_score(assessment: Dict[str, Any]) -> float:
    """Calculate TCFD compliance score"""
    sections = ['governance', 'strategy', 'risk_management', 'metrics_targets']
    scores = []
    
    for section in sections:
        content = assessment.get(section, '').strip()
        if len(content) > 500:  # Substantial content
            scores.append(100)
        elif len(content) > 200:  # Moderate content
            scores.append(75)
        elif len(content) > 0:   # Minimal content
            scores.append(50)
        else:                    # No content
            scores.append(0)
    
    return sum(scores) / len(scores)

def get_sasb_metrics_for_industry(industry: str) -> List[Dict[str, Any]]:
    """Get SASB metrics for specific industry"""
    metrics_map = {
        "Software & IT Services": [
            {"code": "TC_DATA_SECURITY", "name": "Data Security", "description": "Number of data breaches", "unit": "count"},
            {"code": "TC_ENERGY_USE", "name": "Energy Consumption", "description": "Total energy consumption", "unit": "MWh"},
            {"code": "TC_EMPLOYEE_TURNOVER", "name": "Employee Turnover", "description": "Employee turnover rate", "unit": "%"}
        ],
        "Banking": [
            {"code": "FN_CLIMATE_RISK", "name": "Climate Risk", "description": "Exposure to climate-related risks", "unit": "$ millions"},
            {"code": "FN_FINANCIAL_INCLUSION", "name": "Financial Inclusion", "description": "Percentage of unbanked population served", "unit": "%"},
            {"code": "FN_DIVERSE_LENDING", "name": "Diverse Lending", "description": "Loans to diverse-owned businesses", "unit": "%"}
        ],
        "Pharmaceuticals": [
            {"code": "HC_DRUG_PRICING", "name": "Drug Pricing", "description": "Average price increase percentage", "unit": "%"},
            {"code": "HC_CLINICAL_TRIALS", "name": "Clinical Trials", "description": "Diversity in clinical trials", "unit": "%"},
            {"code": "HC_DRUG_ACCESS", "name": "Drug Access", "description": "Patients in access programs", "unit": "count"}
        ]
    }
    
    return metrics_map.get(industry, [])

# Local database functions (fallback when API is not available)
def save_tcfd_assessment_local(project_id: str, assessment_data: Dict[str, Any]):
    """Save TCFD assessment to local database"""
    query = """
    INSERT OR REPLACE INTO tcfd_assessments 
    (project_id, governance, strategy, risk_management, metrics_targets, created_at, updated_at)
    VALUES (:project_id, :governance, :strategy, :risk_management, :metrics_targets, datetime('now'), datetime('now'))
    """
    
    db.execute_non_query(query, {
        'project_id': project_id,
        **assessment_data
    })

def load_tcfd_assessment_local(project_id: str) -> Optional[Dict[str, Any]]:
    """Load TCFD assessment from local database"""
    query = "SELECT * FROM tcfd_assessments WHERE project_id = :project_id"
    results = db.execute_query(query, {'project_id': project_id})
    return results[0] if results else None

def save_csrd_assessment_local(project_id: str, assessment_data: Dict[str, Any]):
    """Save CSRD assessment to local database"""
    query = """
    INSERT OR REPLACE INTO csrd_assessments 
    (project_id, env_impact, env_financial, social_impact, social_financial, esrs_compliance, created_at, updated_at)
    VALUES (:project_id, :env_impact, :env_financial, :social_impact, :social_financial, :esrs_compliance, datetime('now'), datetime('now'))
    """
    
    db.execute_non_query(query, {
        'project_id': project_id,
        'esrs_compliance': str(assessment_data.get('esrs_compliance', {})),
        **{k: v for k, v in assessment_data.items() if k != 'esrs_compliance'}
    })

def save_gri_assessment_local(project_id: str, assessment_data: Dict[str, Any]):
    """Save GRI assessment to local database"""
    query = """
    INSERT OR REPLACE INTO gri_assessments 
    (project_id, assessment_data, created_at, updated_at)
    VALUES (:project_id, :assessment_data, datetime('now'), datetime('now'))
    """
    
    db.execute_non_query(query, {
        'project_id': project_id,
        'assessment_data': str(assessment_data)
    })

def save_sasb_assessment_local(project_id: str, assessment_data: Dict[str, Any]):
    """Save SASB assessment to local database"""
    query = """
    INSERT OR REPLACE INTO sasb_assessments 
    (project_id, industry, metrics_data, created_at, updated_at)
    VALUES (:project_id, :industry, :metrics_data, datetime('now'), datetime('now'))
    """
    
    db.execute_non_query(query, {
        'project_id': project_id,
        'industry': assessment_data.get('industry'),
        'metrics_data': str(assessment_data.get('metrics', {}))
    })