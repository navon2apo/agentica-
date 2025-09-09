# Base44 Agent Application

## Overview
This is a full-stack web application with a React + Vite frontend and FastAPI backend. The application provides an interface for managing AI agents, customers, scheduled tasks, and various integrations including Google services.

## Architecture
- **Frontend**: React 18 + Vite, using Tailwind CSS and Radix UI components
- **Backend**: FastAPI with Python, providing REST API endpoints
- **Development**: Both services run concurrently in development mode

## Current State
- ✅ Frontend running on port 5000 (0.0.0.0:5000) 
- ✅ Backend running on port 8000 (0.0.0.0:8000)
- ✅ API communication working between frontend and backend
- ✅ Deployment configuration set up for VM deployment
- ✅ All dependencies installed and configured

## Development Setup
The application is configured to run in the Replit environment with:
- Frontend accessible via the webview on port 5000
- Backend API accessible on port 8000
- Hot reloading enabled for both frontend and backend development

## Recent Changes
- Configured Vite to bind to 0.0.0.0:5000 with allowedHosts: true for Replit compatibility
- Set up FastAPI backend with CORS enabled for all origins
- Added missing AgentTemplate export to fix frontend imports
- Configured deployment to run both services in production using VM deployment target

## Project Structure
- `/src` - React frontend source code
- `/backend` - FastAPI backend source code
- `/src/api` - API client and entity definitions
- `/src/components` - React components organized by feature
- `/src/pages` - Top-level page components

## Dependencies
- Frontend: React, Vite, Tailwind CSS, Radix UI components, React Router
- Backend: FastAPI, Uvicorn, Pydantic
- Development tools: ESLint, PostCSS, various development utilities