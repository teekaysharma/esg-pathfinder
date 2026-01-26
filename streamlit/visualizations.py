"""
Advanced ESG data visualizations for Streamlit Dashboard
Provides comprehensive charts and analytics for ESG metrics
"""

import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import math

from database import load_esg_data, load_projects
from api_integration import api_client
from error_handling import error_handler, streamlit_logger, performance_logger

class ESGVisualizer:
    """
    Advanced ESG data visualization components
    """
    
    @staticmethod
    @error_handler
    create_esg_radar_chart(esg_data: List[Dict[str, Any]]) -> go.Figure:
        """Create ESG radar chart showing scores across categories"""
        
        # Aggregate data by category
        category_scores = {'environmental': 0, 'social': 0, 'governance': 0}
        category_counts = {'environmental': 0, 'social': 0, 'governance': 0}
        
        for data_point in esg_data:
            category = data_point.get('category', '').lower()
            if category in category_scores:
                # Normalize metric values (simple scoring)
                value = float(data_point.get('metric_value', 0))
                # Simple normalization - in real implementation, use proper scoring
                normalized_score = min(100, max(0, value * 10))  # Simple scaling
                category_scores[category] += normalized_score
                category_counts[category] += 1
        
        # Calculate average scores
        final_scores = []
        for category in ['environmental', 'social', 'governance']:
            if category_counts[category] > 0:
                avg_score = category_scores[category] / category_counts[category]
                final_scores.append(min(100, avg_score))
            else:
                final_scores.append(0)
        
        # Create radar chart
        fig = go.Figure()
        
        fig.add_trace(go.Scatterpolar(
            r=final_scores,
            theta=['Environmental', 'Social', 'Governance'],
            fill='toself',
            name='ESG Score',
            line_color='rgb(67, 67, 67)',
            fillcolor='rgba(67, 67, 67, 0.25)'
        ))
        
        # Add target zones
        fig.add_trace(go.Scatterpolar(
            r=[80, 80, 80],
            theta=['Environmental', 'Social', 'Governance'],
            fill='toself',
            name='Target Zone',
            line_color='green',
            fillcolor='rgba(0, 255, 0, 0.1)',
            line_dash='dash'
        ))
        
        fig.update_layout(
            polar=dict(
                radialaxis=dict(
                    visible=True,
                    range=[0, 100]
                )
            ),
            title="ESG Performance Radar",
            showlegend=True
        )
        
        return fig
    
    @staticmethod
    @error_handler
    create_esg_trend_chart(esg_data: List[Dict[str, Any]]) -> go.Figure:
        """Create ESG trend chart over time"""
        
        if not esg_data:
            return go.Figure()
        
        # Convert to DataFrame
        df = pd.DataFrame(esg_data)
        
        # Ensure proper data types
        df['year'] = pd.to_numeric(df['year'], errors='coerce')
        df['metric_value'] = pd.to_numeric(df['metric_value'], errors='coerce')
        
        # Group by year and category
        trend_data = df.groupby(['year', 'category'])['metric_value'].mean().reset_index()
        
        # Create trend chart
        fig = px.line(
            trend_data,
            x='year',
            y='metric_value',
            color='category',
            title="ESG Metrics Trend Over Time",
            labels={
                'metric_value': 'Average Metric Value',
                'year': 'Year',
                'category': 'ESG Category'
            },
            markers=True
        )
        
        fig.update_layout(
            xaxis_title="Year",
            yaxis_title="Metric Value",
            legend_title="ESG Category",
            hovermode='x unified'
        )
        
        return fig
    
    @staticmethod
    @error_handler
    create_esg_heatmap(esg_data: List[Dict[str, Any]]) -> go.Figure:
        """Create ESG heatmap showing metric intensity"""
        
        if not esg_data:
            return go.Figure()
        
        # Convert to DataFrame
        df = pd.DataFrame(esg_data)
        
        # Create pivot table for heatmap
        pivot_data = df.pivot_table(
            values='metric_value',
            index='category',
            columns='year',
            aggfunc='mean',
            fill_value=0
        )
        
        # Create heatmap
        fig = px.imshow(
            pivot_data,
            title="ESG Metrics Heatmap by Category and Year",
            labels=dict(x="Year", y="Category", color="Metric Value"),
            color_continuous_scale="RdYlGn",
            aspect="auto"
        )
        
        return fig
    
    @staticmethod
    @error_handler
    create_esg_sunburst(esg_data: List[Dict[str, Any]]) -> go.Figure:
        """Create ESG sunburst chart showing data distribution"""
        
        if not esg_data:
            return go.Figure()
        
        # Prepare data for sunburst
        df = pd.DataFrame(esg_data)
        
        # Create hierarchy
        sunburst_data = []
        for _, row in df.iterrows():
            sunburst_data.append([
                "ESG Data",
                row.get('category', 'Unknown'),
                row.get('metric_name', 'Unknown'),
                abs(float(row.get('metric_value', 0)))
            ])
        
        # Convert to DataFrame
        sunburst_df = pd.DataFrame(sunburst_data, columns=['level1', 'level2', 'level3', 'value'])
        
        # Create sunburst
        fig = px.sunburst(
            sunburst_df,
            path=['level1', 'level2', 'level3'],
            values='value',
            title="ESG Data Distribution"
        )
        
        return fig
    
    @staticmethod
    @error_handler
    create_esg_gauge_chart(score: float, title: str = "ESG Score") -> go.Figure:
        """Create ESG gauge chart"""
        
        fig = go.Figure(go.Indicator(
            mode = "gauge+number+delta",
            value = score,
            domain = {'x': [0, 1], 'y': [0, 1]},
            title = {'text': title},
            delta = {'reference': 75},
            gauge = {
                'axis': {'range': [None, 100]},
                'bar': {'color': "darkblue"},
                'steps': [
                    {'range': [0, 50], 'color': "lightcoral"},
                    {'range': [50, 75], 'color': "lightyellow"},
                    {'range': [75, 90], 'color': "lightgreen"},
                    {'range': [90, 100], 'color': "darkgreen"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 95
                }
            }
        ))
        
        return fig
    
    @staticmethod
    @error_handler
    create_esg_comparison_chart(projects_data: Dict[str, List[Dict[str, Any]]]) -> go.Figure:
        """Create ESG comparison chart across multiple projects"""
        
        comparison_data = []
        
        for project_name, esg_data in projects_data.items():
            if not esg_data:
                continue
            
            # Calculate average scores for each category
            category_scores = {'environmental': [], 'social': [], 'governance': []}
            
            for data_point in esg_data:
                category = data_point.get('category', '').lower()
                if category in category_scores:
                    value = float(data_point.get('metric_value', 0))
                    category_scores[category].append(value)
            
            # Calculate averages
            for category, values in category_scores.items():
                if values:
                    avg_score = np.mean(values)
                    comparison_data.append({
                        'project': project_name,
                        'category': category.title(),
                        'score': avg_score
                    })
        
        if not comparison_data:
            return go.Figure()
        
        df = pd.DataFrame(comparison_data)
        
        # Create grouped bar chart
        fig = px.bar(
            df,
            x='project',
            y='score',
            color='category',
            title="ESG Score Comparison Across Projects",
            barmode='group',
            labels={
                'score': 'Average Score',
                'project': 'Project',
                'category': 'ESG Category'
            }
        )
        
        return fig
    
    @staticmethod
    @error_handler
    create_esg_scatter_plot(esg_data: List[Dict[str, Any]]) -> go.Figure:
        """Create ESG scatter plot for correlation analysis"""
        
        if not esg_data:
            return go.Figure()
        
        df = pd.DataFrame(esg_data)
        
        # For demo purposes, create correlation between environmental and social metrics
        env_data = df[df['category'] == 'environmental'].copy()
        social_data = df[df['category'] == 'social'].copy()
        
        if env_data.empty or social_data.empty:
            return go.Figure()
        
        # Aggregate by year for correlation
        env_yearly = env_data.groupby('year')['metric_value'].mean().reset_index()
        social_yearly = social_data.groupby('year')['metric_value'].mean().reset_index()
        
        # Merge data
        merged = pd.merge(env_yearly, social_yearly, on='year', suffixes=('_env', '_social'))
        
        if len(merged) < 2:
            return go.Figure()
        
        # Create scatter plot
        fig = px.scatter(
            merged,
            x='metric_value_env',
            y='metric_value_social',
            size='year',
            title="Environmental vs Social Metrics Correlation",
            labels={
                'metric_value_env': 'Environmental Score',
                'metric_value_social': 'Social Score',
                'year': 'Year'
            },
            hover_data=['year']
        )
        
        # Add trend line
        fig.add_traces(px.scatter(
            merged,
            x='metric_value_env',
            y='metric_value_social',
            trendline="ols"
        ).data)
        
        return fig

@error_handler
def show_esg_analytics_dashboard():
    """Show comprehensive ESG analytics dashboard"""
    st.markdown("## 📊 Advanced ESG Analytics")
    
    # Load data
    projects = load_projects()
    
    if not projects:
        st.warning("No projects found for analytics.")
        return
    
    # Project selection for detailed analysis
    project_options = {f"{p['name']} ({p['id']})": p['id'] for p in projects}
    selected_project = st.selectbox("Select Project for Analysis", list(project_options.keys()))
    
    if selected_project:
        project_id = project_options[selected_project]
        
        # Load ESG data
        start_time = datetime.now()
        esg_data = load_esg_data(project_id)
        load_time = (datetime.now() - start_time).total_seconds()
        performance_logger.log_slow_query("load_esg_data", load_time)
        
        if not esg_data:
            st.info("No ESG data available for this project.")
            return
        
        # Key metrics
        st.subheader("📈 Key ESG Metrics")
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            total_metrics = len(esg_data)
            st.metric("Total Metrics", total_metrics)
        
        with col2:
            categories = len(set(d['category'] for d in esg_data))
            st.metric("Categories", categories)
        
        with col3:
            years = len(set(d['year'] for d in esg_data))
            st.metric("Years Covered", years)
        
        with col4:
            # Calculate overall ESG score
            overall_score = calculate_overall_esg_score(esg_data)
            st.metric("Overall ESG Score", f"{overall_score:.1f}")
        
        # Visualizations
        st.subheader("📊 ESG Visualizations")
        
        # Create tabs for different visualizations
        viz_tabs = st.tabs(["Radar Chart", "Trends", "Heatmap", "Distribution", "Correlations"])
        
        with viz_tabs[0]:
            fig = ESGVisualizer.create_esg_radar_chart(esg_data)
            st.plotly_chart(fig, use_container_width=True)
        
        with viz_tabs[1]:
            fig = ESGVisualizer.create_esg_trend_chart(esg_data)
            st.plotly_chart(fig, use_container_width=True)
        
        with viz_tabs[2]:
            fig = ESGVisualizer.create_esg_heatmap(esg_data)
            st.plotly_chart(fig, use_container_width=True)
        
        with viz_tabs[3]:
            fig = ESGVisualizer.create_esg_sunburst(esg_data)
            st.plotly_chart(fig, use_container_width=True)
        
        with viz_tabs[4]:
            fig = ESGVisualizer.create_esg_scatter_plot(esg_data)
            st.plotly_chart(fig, use_container_width=True)
        
        # Category breakdown
        st.subheader("📋 Category Breakdown")
        
        category_data = {}
        for data_point in esg_data:
            category = data_point.get('category', 'Unknown')
            if category not in category_data:
                category_data[category] = []
            category_data[category].append(data_point)
        
        for category, data in category_data.items():
            with st.expander(f"📁 {category.title()} ({len(data)} metrics)"):
                
                # Category score gauge
                category_score = calculate_category_score(data)
                fig = ESGVisualizer.create_esg_gauge_chart(category_score, f"{category.title()} Score")
                st.plotly_chart(fig, use_container_width=True)
                
                # Data table
                df = pd.DataFrame(data)
                st.dataframe(
                    df[['metric_name', 'metric_value', 'metric_unit', 'year', 'period']],
                    use_container_width=True,
                    hide_index=True
                )

@error_handler
def show_project_comparison():
    """Show project comparison analytics"""
    st.markdown("## 🔄 Project Comparison")
    
    projects = load_projects()
    
    if len(projects) < 2:
        st.info("Need at least 2 projects for comparison.")
        return
    
    # Project selection
    selected_projects = st.multiselect(
        "Select Projects to Compare",
        options=[f"{p['name']} ({p['id']})" for p in projects],
        default=[f"{p['name']} ({p['id']})" for p in projects[:3]]
    )
    
    if len(selected_projects) < 2:
        st.warning("Please select at least 2 projects for comparison.")
        return
    
    # Load data for selected projects
    projects_data = {}
    for project_selection in selected_projects:
        project_id = project_selection.split('(')[-1].strip(')')
        project_name = project_selection.split('(')[0].strip()
        
        esg_data = load_esg_data(project_id)
        projects_data[project_name] = esg_data
    
    # Comparison chart
    fig = ESGVisualizer.create_esg_comparison_chart(projects_data)
    st.plotly_chart(fig, use_container_width=True)
    
    # Detailed comparison table
    st.subheader("📊 Detailed Comparison")
    
    comparison_metrics = []
    for project_name, esg_data in projects_data.items():
        category_scores = calculate_category_scores(esg_data)
        comparison_metrics.append({
            'Project': project_name,
            'Environmental': category_scores.get('environmental', 0),
            'Social': category_scores.get('social', 0),
            'Governance': category_scores.get('governance', 0),
            'Overall': calculate_overall_esg_score(esg_data)
        })
    
    df_comparison = pd.DataFrame(comparison_metrics)
    st.dataframe(df_comparison, use_container_width=True, hide_index=True)

# Helper functions
def calculate_overall_esg_score(esg_data: List[Dict[str, Any]]) -> float:
    """Calculate overall ESG score"""
    if not esg_data:
        return 0.0
    
    category_scores = calculate_category_scores(esg_data)
    valid_scores = [score for score in category_scores.values() if score > 0]
    
    if not valid_scores:
        return 0.0
    
    return sum(valid_scores) / len(valid_scores)

def calculate_category_score(category_data: List[Dict[str, Any]]) -> float:
    """Calculate score for a specific category"""
    if not category_data:
        return 0.0
    
    values = []
    for data_point in category_data:
        try:
            value = float(data_point.get('metric_value', 0))
            values.append(value)
        except:
            continue
    
    if not values:
        return 0.0
    
    # Simple scoring - normalize to 0-100 scale
    avg_value = sum(values) / len(values)
    return min(100, max(0, avg_value * 10))  # Simple scaling

def calculate_category_scores(esg_data: List[Dict[str, Any]]) -> Dict[str, float]:
    """Calculate scores for all ESG categories"""
    category_data = {'environmental': [], 'social': [], 'governance': []}
    
    for data_point in esg_data:
        category = data_point.get('category', '').lower()
        if category in category_data:
            category_data[category].append(data_point)
    
    scores = {}
    for category, data in category_data.items():
        scores[category] = calculate_category_score(data)
    
    return scores

def export_esg_data(esg_data: List[Dict[str, Any]], format: str = "csv") -> str:
    """Export ESG data in various formats"""
    df = pd.DataFrame(esg_data)
    
    if format.lower() == "csv":
        return df.to_csv(index=False)
    elif format.lower() == "json":
        return df.to_json(orient='records', indent=2)
    elif format.lower() == "excel":
        return df.to_excel(index=False)
    else:
        raise ValueError(f"Unsupported export format: {format}")