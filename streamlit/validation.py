"""
Input validation utilities for Streamlit ESG Dashboard
Provides comprehensive validation and sanitization
"""

import re
import html
from typing import Any, Optional, List, Dict
from datetime import datetime
import streamlit as st

class ValidationError(Exception):
    """Custom validation error exception"""
    pass

class InputValidator:
    """
    Comprehensive input validation and sanitization
    """
    
    @staticmethod
    def validate_project_name(name: str) -> str:
        """Validate and sanitize project name"""
        if not name:
            raise ValidationError("Project name is required")
        
        name = str(name).strip()
        
        if len(name) == 0:
            raise ValidationError("Project name cannot be empty")
        
        if len(name) > 255:
            raise ValidationError("Project name cannot exceed 255 characters")
        
        # Allow only safe characters
        if not re.match(r'^[a-zA-Z0-9\s\-_.,()&]+$', name):
            raise ValidationError("Project name contains invalid characters")
        
        # Sanitize HTML
        name = html.escape(name)
        
        return name
    
    @staticmethod
    def validate_description(description: str) -> str:
        """Validate and sanitize project description"""
        if description is None:
            return ""
        
        description = str(description).strip()
        
        if len(description) > 5000:
            raise ValidationError("Description cannot exceed 5000 characters")
        
        # Basic HTML sanitization
        description = html.escape(description)
        
        return description
    
    @staticmethod
    def validate_organisation_id(org_id: str) -> str:
        """Validate organisation ID"""
        if not org_id:
            raise ValidationError("Organisation is required")
        
        org_id = str(org_id).strip()
        
        if len(org_id) < 10:
            raise ValidationError("Invalid organisation ID")
        
        return org_id
    
    @staticmethod
    def validate_project_status(status: str) -> str:
        """Validate project status"""
        valid_statuses = ['draft', 'active', 'completed', 'archived']
        
        if not status:
            return 'draft'
        
        status = str(status).strip().lower()
        
        if status not in valid_statuses:
            raise ValidationError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
        
        return status
    
    @staticmethod
    def validate_year(year: Any) -> int:
        """Validate year input"""
        if year is None:
            raise ValidationError("Year is required")
        
        try:
            year = int(year)
        except (ValueError, TypeError):
            raise ValidationError("Year must be a valid number")
        
        current_year = datetime.now().year
        min_year = 2000
        max_year = current_year + 10
        
        if year < min_year or year > max_year:
            raise ValidationError(f"Year must be between {min_year} and {max_year}")
        
        return year
    
    @staticmethod
    def validate_period(period: str) -> str:
        """Validate reporting period"""
        valid_periods = ['Q1', 'Q2', 'Q3', 'Q4', 'H1', 'H2', 'Annual']
        
        if not period:
            raise ValidationError("Period is required")
        
        period = str(period).strip()
        
        if period not in valid_periods:
            raise ValidationError(f"Invalid period. Must be one of: {', '.join(valid_periods)}")
        
        return period
    
    @staticmethod
    def validate_category(category: str) -> str:
        """Validate ESG category"""
        valid_categories = ['environmental', 'social', 'governance']
        
        if not category:
            raise ValidationError("Category is required")
        
        category = str(category).strip().lower()
        
        if category not in valid_categories:
            raise ValidationError(f"Invalid category. Must be one of: {', '.join(valid_categories)}")
        
        return category
    
    @staticmethod
    def validate_metric_value(value: Any) -> float:
        """Validate metric value"""
        if value is None:
            raise ValidationError("Metric value is required")
        
        try:
            value = float(value)
        except (ValueError, TypeError):
            raise ValidationError("Metric value must be a valid number")
        
        # Reasonable range for ESG metrics
        if abs(value) > 1e15:  # Prevent extremely large numbers
            raise ValidationError("Metric value is out of reasonable range")
        
        return value
    
    @staticmethod
    def validate_metric_unit(unit: str) -> str:
        """Validate metric unit"""
        if not unit:
            return ""
        
        unit = str(unit).strip()
        
        if len(unit) > 50:
            raise ValidationError("Metric unit too long")
        
        # Allow only safe characters
        if not re.match(r'^[a-zA-Z0-9\s%°/³²-]+$', unit):
            raise ValidationError("Metric unit contains invalid characters")
        
        return unit
    
    @staticmethod
    def validate_text_input(text: str, field_name: str, max_length: int = 1000) -> str:
        """Generic text validation"""
        if text is None:
            return ""
        
        text = str(text).strip()
        
        if len(text) > max_length:
            raise ValidationError(f"{field_name} cannot exceed {max_length} characters")
        
        # Basic HTML sanitization
        text = html.escape(text)
        
        return text

class ESGDataValidator:
    """
    Validator for ESG-specific data
    """
    
    @staticmethod
    def validate_esg_datapoint(data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate ESG data point"""
        validator = InputValidator()
        
        validated_data = {
            'project_id': validator.validate_organisation_id(data.get('project_id', '')),
            'category': validator.validate_category(data.get('category', '')),
            'year': validator.validate_year(data.get('year')),
            'period': validator.validate_period(data.get('period', '')),
            'metric_name': validator.validate_text_input(
                data.get('metric_name', ''), 'Metric name', 255
            ),
            'metric_value': validator.validate_metric_value(data.get('metric_value')),
            'metric_unit': validator.validate_metric_unit(data.get('metric_unit', '')),
            'source': validator.validate_text_input(
                data.get('source', ''), 'Source', 500
            ),
            'notes': validator.validate_text_input(
                data.get('notes', ''), 'Notes', 2000
            )
        }
        
        return validated_data
    
    @staticmethod
    def validate_tcfd_assessment(data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate TCFD assessment data"""
        validator = InputValidator()
        
        validated_data = {
            'governance': validator.validate_text_input(
                data.get('governance', ''), 'Governance disclosures', 10000
            ),
            'strategy': validator.validate_text_input(
                data.get('strategy', ''), 'Strategy disclosures', 10000
            ),
            'risk_management': validator.validate_text_input(
                data.get('risk_management', ''), 'Risk management disclosures', 10000
            ),
            'metrics_targets': validator.validate_text_input(
                data.get('metrics_targets', ''), 'Metrics and targets', 10000
            )
        }
        
        # Check that at least one section has content
        has_content = any(
            len(value.strip()) > 0 for value in validated_data.values()
        )
        
        if not has_content:
            raise ValidationError("At least one TCFD section must contain content")
        
        return validated_data

def validate_project_form_data() -> Dict[str, Any]:
    """Validate project form data from Streamlit"""
    validator = InputValidator()
    
    try:
        project_data = {
            'name': validator.validate_project_name(st.session_state.get('project_name', '')),
            'description': validator.validate_description(st.session_state.get('project_description', '')),
            'organisation_id': validator.validate_organisation_id(st.session_state.get('organisation', '')),
            'status': validator.validate_project_status(st.session_state.get('project_status', 'draft'))
        }
        
        return project_data
    
    except ValidationError as e:
        st.error(f"Validation error: {e}")
        return None
    except Exception as e:
        st.error(f"Unexpected validation error: {e}")
        return None

def validate_esg_form_data() -> Dict[str, Any]:
    """Validate ESG data form from Streamlit"""
    validator = ESGDataValidator()
    
    try:
        esg_data = {
            'project_id': st.session_state.get('current_project_id', ''),
            'category': st.session_state.get('esg_category', ''),
            'year': st.session_state.get('esg_year', datetime.now().year),
            'period': st.session_state.get('esg_period', 'Annual'),
            'metric_name': st.session_state.get('metric_name', ''),
            'metric_value': st.session_state.get('metric_value', ''),
            'metric_unit': st.session_state.get('metric_unit', ''),
            'source': st.session_state.get('metric_source', ''),
            'notes': st.session_state.get('metric_notes', '')
        }
        
        return validator.validate_esg_datapoint(esg_data)
    
    except ValidationError as e:
        st.error(f"ESG data validation error: {e}")
        return None
    except Exception as e:
        st.error(f"Unexpected ESG validation error: {e}")
        return None

def show_validation_errors(errors: List[str]):
    """Display validation errors in Streamlit"""
    if errors:
        st.error("Validation Errors:")
        for error in errors:
            st.error(f"• {error}")
        return True
    return False