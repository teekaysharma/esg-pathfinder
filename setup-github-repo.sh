#!/bin/bash

# GitHub Repository Setup Script for ESG Pathfinder
# This script helps you set up the complete GitHub repository with all branches

set -e

echo "🚀 Setting up ESG Pathfinder GitHub Repository"
echo "============================================="

# Configuration
GITHUB_USERNAME=${1:-"your-username"}
REPO_NAME=${2:-"esg-pathfinder"}
GITHUB_TOKEN=${3:-""}

echo "GitHub Username: $GITHUB_USERNAME"
echo "Repository Name: $REPO_NAME"
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI is not installed. Please install it first:"
    echo "   macOS: brew install gh"
    echo "   Ubuntu: sudo apt install gh"
    echo "   Other: https://cli.github.com/manual/installation"
    exit 1
fi

# Check if user is logged in to GitHub
if ! gh auth status &> /dev/null; then
    echo "❌ Please login to GitHub first:"
    echo "   gh auth login"
    exit 1
fi

# Create GitHub repository
echo "📦 Creating GitHub repository..."
gh repo create "$GITHUB_USERNAME/$REPO_NAME" \
  --public \
  --description "Comprehensive ESG compliance platform supporting TCFD, CSRD, GRI, SASB, and IFRS standards" \
  --source=. \
  --push \
  --remote=origin

echo "✅ Repository created successfully!"
echo ""

# Push all branches to remote
echo "🌿 Pushing all branches to remote..."

branches=("master" "deployment/vercel" "deployment/netlify" "deployment/railway" "deployment/docker" "deployment/aws" "deployment/azure")

for branch in "${branches[@]}"; do
    echo "  Pushing $branch..."
    git push -u origin "$branch"
done

echo "✅ All branches pushed successfully!"
echo ""

# Create GitHub releases/tags
echo "🏷️  Creating initial release..."
gh release create v1.0.0 \
  --title "ESG Pathfinder v1.0.0" \
  --notes "Initial release of ESG Pathfinder with comprehensive ESG framework support:

## Features
- ✅ TCFD (Climate-related Financial Disclosures)
- ✅ CSRD (Corporate Sustainability Reporting Directive)
- ✅ GRI (Global Reporting Initiative Standards)
- ✅ SASB (Sustainability Accounting Standards Board)
- ✅ IFRS (International Financial Reporting Standards)

## Deployment Options
- 🌟 Vercel (deployment/vercel branch)
- 🌊 Netlify (deployment/netlify branch)
- 🚂 Railway (deployment/railway branch)
- 🐳 Docker (deployment/docker branch)
- ☁️ AWS (deployment/aws branch)
- 🔷 Azure (deployment/azure branch)

## Quick Start
1. Choose your deployment platform
2. Switch to the corresponding branch
3. Follow the platform-specific deployment guide
4. Access your ESG compliance platform!

## Documentation
- Main README: Complete setup instructions
- DEPLOYMENT.md: Platform-specific deployment guides
- Platform-specific guides in each deployment branch

## Support
- Issues: Report bugs and request features
- Discussions: Community support and questions
- Documentation: Comprehensive guides and API docs" \
  --target master

echo "✅ Initial release created!"
echo ""

# Set up GitHub Pages for documentation
echo "📚 Setting up GitHub Pages..."
gh api repos/:owner/:repo/pages -X POST -f source[branch]=master -f source[path]=/docs 2>/dev/null || echo "GitHub Pages already configured or not available"

echo "✅ Repository setup complete!"
echo ""

# Display repository information
REPO_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo "🎉 Your ESG Pathfinder repository is ready!"
echo ""
echo "📍 Repository URL: $REPO_URL"
echo "🌐 Live Demo: Check deployment guides for platform-specific URLs"
echo "📖 Documentation: $REPO_URL/blob/master/README.md"
echo "🚀 Deployment Guide: $REPO_URL/blob/master/DEPLOYMENT.md"
echo ""
echo "🔧 Next Steps:"
echo "1. Visit your repository: $REPO_URL"
echo "2. Choose your deployment platform"
echo "3. Follow the platform-specific deployment guide"
echo "4. Deploy your ESG compliance platform!"
echo ""
echo "📋 Available Branches:"
for branch in "${branches[@]}"; do
    echo "  • $branch: $REPO_URL/tree/$branch"
done
echo ""
echo "🎯 Quick Deployment Commands:"
echo "  Vercel:   git checkout deployment/vercel && vercel"
echo "  Railway:  git checkout deployment/railway && railway up"
echo "  Docker:   git checkout deployment/docker && docker-compose up -d"
echo "  AWS:      git checkout deployment/aws && ./deploy-aws.sh"
echo "  Azure:    git checkout deployment/azure && ./deploy-azure.sh"
echo ""
echo "🌟 Don't forget to star the repository if you find it useful!"