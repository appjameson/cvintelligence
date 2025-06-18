# CV Analyzer - Resume Analysis Application

## Overview

CV Analyzer is a full-stack web application that provides AI-powered resume analysis using OpenAI's GPT models. Users can upload their CVs in PDF, DOC, or DOCX formats and receive detailed feedback on structure, content, formatting, and suggestions for improvement. The application features a credit-based system with Stripe payment integration for monetization.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Radix UI components with Tailwind CSS styling
- **Build Tool**: Vite for development and production builds
- **Animation**: Framer Motion for smooth animations and transitions

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Authentication**: Replit Auth with OpenID Connect integration
- **Session Management**: Express sessions with PostgreSQL store
- **File Processing**: Multer for handling file uploads

## Key Components

### Database Schema
- **sessions**: Session storage table (required for Replit Auth)
- **users**: User profiles with credits, Stripe integration, and authentication data
- **cvAnalyses**: Stores CV analysis results, scores, and AI-generated suggestions

### Authentication System
- Replit Auth integration with OpenID Connect
- Session-based authentication with PostgreSQL storage
- User profile management with automatic creation/updates
- Protected routes requiring authentication

### AI Analysis Service
- OpenAI GPT integration for CV analysis
- Comprehensive evaluation covering:
  - Structure and formatting
  - Content relevance
  - Keyword optimization
  - Professional experience assessment
  - Skills evaluation
  - Improvement suggestions with priority levels

### Payment System
- Stripe integration for credit purchases
- Multiple credit packages (Basic: 5 credits, Premium: 15 credits, Ultimate: 30 credits)
- Customer and subscription management
- Credit-based usage system

### File Upload System
- Support for PDF, DOC, and DOCX files
- 5MB file size limit
- Secure file handling with validation
- Temporary file storage in uploads directory

## Data Flow

1. **User Authentication**: Users authenticate via Replit Auth
2. **File Upload**: Authenticated users upload CV files through the web interface
3. **AI Analysis**: Files are processed and analyzed using OpenAI's API
4. **Result Storage**: Analysis results are stored in PostgreSQL with user association
5. **Credit Management**: Each analysis deducts one credit from user's balance
6. **Payment Processing**: Users can purchase additional credits via Stripe

## External Dependencies

### Core Services
- **OpenAI API**: For CV analysis and feedback generation
- **Stripe**: Payment processing and subscription management
- **Neon Database**: Serverless PostgreSQL hosting
- **Replit Auth**: Authentication service integration

### Development Tools
- **Drizzle Kit**: Database schema management and migrations
- **TSX**: TypeScript execution for development
- **ESBuild**: Production build bundling

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **Lucide React**: Icon library

## Deployment Strategy

### Development Environment
- Replit-hosted development with hot reload
- Vite development server with middleware mode
- PostgreSQL development database
- Environment variable configuration

### Production Build
- Vite builds the client application to `dist/public`
- ESBuild bundles the server application to `dist/index.js`
- Static file serving for client assets
- Production PostgreSQL database connection

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API authentication
- `STRIPE_SECRET_KEY`: Stripe payment processing
- `SESSION_SECRET`: Session encryption key
- Authentication configuration for Replit Auth

## Changelog

Changelog:
- June 18, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.