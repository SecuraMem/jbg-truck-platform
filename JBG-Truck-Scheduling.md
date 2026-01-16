# JBG Truck Scheduling Platform - Technical Specification

## Executive Summary

We are building TWO distinct versions of the JBG truck scheduling platform:

1. **Demo Version**: Browser-based prototype for sales demonstrations
2. **Production Version**: Enterprise SaaS platform for actual deployment

This document clarifies the architecture, purpose, and technical decisions for each version.

---

## 🎯 Demo Version (For Sales - Week 1)

### Purpose
- Demonstrate AI-powered fair scheduling to JBG decision-makers
- Prove the concept works before requesting $75K Year 1 investment
- Allow JBG to interact with the system during evaluation
- Close the deal by showing a working product at jbgtruckscheduling.com

### Architecture
```
User Browser
    ↓
React Single-Page Application
    ↓ (Direct HTTPS calls)
Anthropic Claude API
    ↓
AI generates schedules
    ↓
localStorage (browser storage for persistence)
```

### Technology Stack
- **Frontend**: React 18
- **UI Components**: Custom components using Tailwind CSS + Lucide icons
- **State Management**: React hooks (useState, useEffect)
- **Data Persistence**: Browser localStorage API
- **AI Integration**: Direct fetch() calls to Anthropic API
- **Hosting**: Vercel (free tier, automatic HTTPS)
- **Domain**: jbgtruckscheduling.com

### Key Features
1. **Truck Management**
   - Display 88 pre-populated trucks with realistic JBG data
   - Show weekly load counts for each truck
   - Identify trucks below weekly quota (3 loads/week)

2. **Load Management**
   - Display unassigned loads with size, destination, priority, deadline
   - Allow manual addition of new loads
   - Track assignment status

3. **AI Schedule Generation**
   - Click button to trigger Claude API
   - Claude analyzes trucks + loads + fairness constraints
   - Returns JSON with load-to-truck assignments + reasoning
   - Display fairness score (percentage of trucks meeting quota)

4. **Conversational Interface**
   - Chat with Claude about scheduling decisions
   - Ask "what if" scenarios
   - Request schedule adjustments
   - Get explanations in natural language

5. **JBG Branding**
   - Professional blue color scheme matching jamaicabroilersgroup.com
   - JBG logo and mission statement ("Truth, Fairness & Goodwill")
   - Branded as "With God's guidance, we serve"
   - Custom domain: jbgtruckscheduling.com

### Data Flow

**Schedule Generation Flow:**
```
1. User clicks "Generate Schedule"
2. React app collects:
   - Array of 88 trucks (from localStorage)
   - Array of unassigned loads (from localStorage)
   - Constraints (min 3 loads/week, capacity rules)
3. React app builds prompt:
   "You are JBG's scheduling assistant. Here are 88 trucks and 24 loads.
    Generate fair assignments prioritizing trucks below 3 loads/week..."
4. React app calls Anthropic API directly:
   POST https://api.anthropic.com/v1/messages
   Headers: x-api-key: [YOUR_DEMO_API_KEY]
   Body: { model: "claude-sonnet-4", messages: [...] }
5. Claude returns JSON:
   {
     "assignments": [
       { "loadId": "L-1001", "truckId": "T-023", "reasoning": "..." }
     ],
     "fairnessScore": 0.94
   }
6. React app:
   - Updates loads as "assigned"
   - Increments truck weekly counts
   - Saves to localStorage
   - Displays results with fairness score
```

### Security Considerations (Demo Only)

**API Key Handling:**
- Your Anthropic API key stored in `.env` file locally
- Deployed to Vercel as environment variable (never in Git)
- **IMPORTANT**: This is YOUR key, not production-ready
- Cost: ~$0.01-0.02 per schedule generation
- Expected demo usage: <$5 total during sales process

**Data Privacy:**
- All data stays in browser (localStorage)
- No backend database
- No user authentication
- JBG-specific data is sample/fake for demo

**Limitations Explained to JBG:**
- "This demo uses our temporary API key for testing"
- "Production will use YOUR Anthropic API key for full security and cost control"
- "Data persistence is browser-only for demo; production uses secure database"

### Deployment Strategy

**Local Development:**
```
1. Create React app
2. Add .env with REACT_APP_ANTHROPIC_API_KEY
3. Build components for Dashboard, Chat, Trucks, Loads
4. Test schedule generation flow
5. Verify localStorage persistence works
```

**Vercel Deployment:**
```
1. Push code to GitHub (excluding .env)
2. Connect Vercel to GitHub repo
3. Add REACT_APP_ANTHROPIC_API_KEY as Vercel environment variable
4. Deploy (automatic)
5. Point jbgtruckscheduling.com domain to Vercel
```

**Demo Timeline:** 3-5 days of development

### Demo Script Usage

When demonstrating to JBG:
1. Show dashboard with 88 trucks, fairness metrics
2. Click "Generate Schedule" - wait 10-15 seconds
3. Show AI assignments with reasoning
4. Demo chat: "What if Truck T-023 is unavailable?"
5. Show fairness score improvement
6. Explain: "This will use YOUR API key in production for full control"

---

## 🏗️ Production Version (After Contract Signed - Week 2-8)

### Purpose
- Enterprise-grade platform for actual JBG logistics operations
- Secure, scalable, multi-tenant architecture
- Foundation for selling to additional customers (Grace Kennedy, Wisynco, etc.)
- Support real users, real data, real money ($5K/month)

### Architecture
```
User Browser (React SPA)
    ↓ HTTPS
Rust Backend (Axum)
    ↓
PostgreSQL Database (multi-tenant)
    ↓ (Server-side API calls)
Anthropic Claude API (using JBG's key)
```

### Technology Stack
- **Frontend**: React 18 (deployed to Vercel)
- **Backend**: Rust + Axum web framework
- **Database**: PostgreSQL 15+
- **Authentication**: JWT tokens
- **API Key Encryption**: AES-256-GCM
- **Hosting**: Railway (backend + database) or Fly.io
- **Domain**: jbgtruckscheduling.com (same, but points to backend API)

### Multi-Tenant Architecture

**Core Principle**: Single codebase serves multiple companies

**Database Schema:**
```
companies
  - id (UUID)
  - slug (e.g., "jbg")
  - company_name
  - domain (e.g., "jbgtruckscheduling.com")
  - encrypted_anthropic_api_key (AES-256 encrypted)
  - theme_config (JSON: colors, logo URL, branding)
  - billing_tier ("starter" | "professional" | "enterprise")

users
  - id
  - company_id (FK to companies)
  - email
  - password_hash (bcrypt)
  - role ("admin" | "dispatcher" | "viewer")

trucks
  - id
  - company_id (FK to companies)
  - truck_id (e.g., "T-001")
  - company_name (contractor name)
  - size ("small" | "medium" | "large")
  - capacity_tons
  - min_weekly_loads (default: 3)
  - active (boolean)

loads
  - id
  - company_id (FK to companies)
  - load_id (e.g., "L-1001")
  - size_tons
  - destination
  - priority ("high" | "normal" | "low")
  - deadline (timestamp)
  - assigned_truck_id (nullable FK to trucks)

schedules
  - id
  - company_id (FK to companies)
  - week_start (date, Monday of week)
  - assignments (JSONB array)
  - fairness_score (decimal 0.00-1.00)
  - ai_reasoning (text)
  - generated_by_user_id
  - approved (boolean)
  - created_at

assignments (audit trail)
  - id
  - load_id
  - truck_id
  - company_id
  - week_start
  - assigned_by_user_id
  - is_override (boolean)
  - override_reason (enum or text)
  - created_at
```

### Data Flow

**Production Schedule Generation Flow:**
```
1. User clicks "Generate Schedule" in React app

2. React makes authenticated API call:
   POST https://jbgtruckscheduling.com/api/schedules/generate
   Headers: Authorization: Bearer <JWT_TOKEN>

3. Rust backend:
   a. Validates JWT token
   b. Extracts company_id from token
   c. Retrieves JBG's encrypted Anthropic API key from database
   d. Decrypts API key using master encryption key (env variable)
   e. Queries database:
      - Active trucks for company_id
      - Unassigned loads for company_id
      - Company constraints (min weekly loads, etc.)
   f. Builds scheduling prompt (same logic as demo)
   g. Calls Anthropic API server-side using JBG's API key
   h. Parses Claude's JSON response
   i. Validates assignments (capacity constraints, etc.)
   j. Saves schedule to database
   k. Updates load assignments
   l. Returns schedule JSON to frontend

4. React displays results (same UI as demo)
```

### Security Architecture

**API Key Management:**
- JBG provides their own Anthropic API key during onboarding
- Backend encrypts key with AES-256-GCM before storing
- Master encryption key stored as environment variable (never in database)
- Decryption only happens in memory during API calls
- JBG can rotate their key anytime via settings UI

**Authentication Flow:**
```
1. User logs in with email/password
2. Backend validates credentials
3. Backend generates JWT token containing:
   - user_id
   - company_id
   - role
   - expiration (24 hours)
4. Frontend stores token (httpOnly cookie or localStorage)
5. All API requests include token in Authorization header
6. Backend validates token on every request
7. Backend enforces company_id isolation (SQL WHERE company_id = ?)
```

**Data Isolation:**
- Every query MUST filter by company_id
- Impossible for JBG to see Grace Kennedy's data
- Enforced at database constraint level
- Middleware validates company_id matches JWT token

**Cost Control:**
- Each company uses their own Anthropic API key
- They pay Claude directly for usage
- We track token usage for reporting only
- Monthly usage reports sent to company admin

### API Endpoints

**Authentication:**
```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me
```

**Trucks:**
```
GET    /api/trucks
POST   /api/trucks
GET    /api/trucks/:id
PUT    /api/trucks/:id
DELETE /api/trucks/:id
```

**Loads:**
```
GET    /api/loads
POST   /api/loads
GET    /api/loads/unassigned
POST   /api/loads/bulk-import  (CSV upload)
PUT    /api/loads/:id
DELETE /api/loads/:id
```

**Schedules:**
```
POST   /api/schedules/generate  (AI generation)
GET    /api/schedules
GET    /api/schedules/:id
POST   /api/schedules/:id/approve
POST   /api/schedules/:id/override  (manual adjustment)
```

**Reports:**
```
GET    /api/reports/fairness
GET    /api/reports/weekly-summary
GET    /api/reports/truck-performance
POST   /api/reports/export  (PDF/Excel)
```

**AI Chat:**
```
POST   /api/ai/chat  (conversational interface)
```

**Settings:**
```
GET    /api/settings/constraints
PUT    /api/settings/constraints
PUT    /api/settings/api-key  (update Anthropic key)
```

### Frontend-Backend Communication

**Frontend (React):**
- Deployed to Vercel as static SPA
- Makes REST API calls to backend
- No direct Anthropic API calls (security)
- Handles UI state, rendering, user interactions

**Backend (Rust):**
- Deployed to Railway as single binary
- Exposes REST API
- Handles all business logic
- Makes Anthropic API calls server-side
- Manages database transactions

**Environment Variables:**
```
Backend (.env):
  DATABASE_URL=postgres://...
  JWT_SECRET=<random_secret>
  MASTER_ENCRYPTION_KEY=<random_key_for_api_key_encryption>
  PORT=3000

Frontend (.env):
  REACT_APP_API_URL=https://api.jbgtruckscheduling.com
```

### Deployment Architecture

**Railway Setup:**
```
1. One Railway project per deployment environment
2. PostgreSQL addon (automated backups, scaling)
3. Rust app service (auto-deploy from GitHub)
4. Environment variables configured in Railway dashboard
5. Custom domain: api.jbgtruckscheduling.com
```

**Vercel Setup:**
```
1. Frontend deployed separately
2. Environment variable: REACT_APP_API_URL
3. Custom domain: jbgtruckscheduling.com
4. CORS configured to allow api.jbgtruckscheduling.com
```

**Alternative (Simpler):**
```
1. Single Railway deployment
2. Rust backend serves static React files
3. API routes: /api/*
4. Frontend routes: /*
5. Single domain: jbgtruckscheduling.com
```

### Theme Configuration System

**Purpose**: Make each company's instance feel bespoke

**Configuration File (stored in database):**
```json
{
  "branding": {
    "company_name": "Jamaica Broilers Group",
    "logo_url": "/assets/jbg-logo.png",
    "favicon_url": "/assets/jbg-favicon.ico",
    "primary_color": "#1e3a8a",
    "secondary_color": "#3b82f6",
    "mission_statement": "Truth, Fairness & Goodwill",
    "tagline": "With God's guidance, we serve"
  },
  "features": {
    "min_weekly_loads": 3,
    "truck_count": 88,
    "enable_whatsapp": true,
    "enable_sms_notifications": false
  },
  "ai_prompts": {
    "system_context": "You are scheduling assistant for Jamaica Broilers Group, Jamaica's largest poultry and distribution company. Main depots: Kingston, Spanish Town, Montego Bay. Priority customers: KFC, restaurants, supermarkets."
  }
}
```

**Frontend loads theme from API:**
```
GET /api/settings/theme
Returns: theme JSON
React applies colors, logos, text dynamically
```

### Scaling to Customer #2 (Grace Kennedy)

**Process:**
```
1. Customer signs contract
2. Create new company record in database:
   - slug: "gk"
   - domain: "gktruckscheduling.com"
   - theme_config: { colors: GK blue/white, logo: GK, etc. }
3. Point gktruckscheduling.com DNS to same backend
4. Backend reads domain from request
5. Backend loads correct company_id based on domain
6. Serve GK-branded frontend with GK data
```

**Zero code changes needed for Customer #2** - just database configuration.

### Production Timeline

**Week 1-2: Database + Auth**
- PostgreSQL schema
- User authentication (JWT)
- API key encryption system
- Basic CRUD endpoints

**Week 3-4: Core Features**
- Truck management
- Load management  
- Schedule generation (AI integration)
- Fairness calculations

**Week 5-6: Advanced Features**
- Chat interface
- Reports (PDF/Excel)
- CSV import
- Weekly reset automation

**Week 7: Testing + Polish**
- Data migration from demo to production
- User acceptance testing with JBG
- Bug fixes
- Performance optimization

**Week 8: Launch**
- Production deployment
- Dispatcher training (2 sessions)
- Go-live
- Monitoring setup

### Cost Structure

**Development Phase:**
- Development time: 200 hours @ 2 months
- No cash costs during development

**Production Operations:**
```
Monthly Costs:
- Railway Hobby: $5/month (Rust + PostgreSQL)
- Vercel: $0 (static React hosting)
- Domain: $1/month ($12/year)
- Monitoring (optional): $10/month
Total: ~$15/month

AI Costs: $0 (JBG pays Anthropic directly)

Revenue per Customer: $5,000/month
Gross Margin: 99.7%
```

**Scaling Economics:**
```
1 customer:  $5K/mo revenue - $15/mo costs = $4,985/mo profit
5 customers: $25K/mo revenue - $50/mo costs = $24,950/mo profit
10 customers: $50K/mo revenue - $100/mo costs = $49,900/mo profit
```

---

## 🔄 Transition from Demo to Production

### After JBG Signs Contract:

**Week 1:**
1. Collect $7,500 setup fee (50% of $15K)
2. JBG provides their Anthropic API key
3. Begin Rust backend development

**Week 2-6:**
4. Build production features
5. Weekly demos to JBG stakeholders
6. Iterate based on feedback

**Week 7:**
7. Migrate demo data to production database
8. Import actual truck data from JBG
9. User acceptance testing
10. Dispatcher training

**Week 8:**
11. Production launch
12. Collect remaining $7,500 setup fee
13. First $5,000 monthly payment
14. Monitor usage, fix bugs
15. Begin Customer #2 outreach

### Data Migration

**From Demo localStorage to Production Database:**
- Export trucks from localStorage
- Import to PostgreSQL with company_id = 'jbg'
- Verify data integrity
- JBG confirms accuracy
- Add any missing real trucks
- Delete sample/fake data

---

## 📊 Key Differences Summary

| Aspect | Demo Version | Production Version |
|--------|--------------|-------------------|
| **Purpose** | Sales tool | Actual operations |
| **Architecture** | Frontend-only | Full-stack |
| **API Key** | Your key (temporary) | JBG's key (permanent) |
| **Data Storage** | localStorage (browser) | PostgreSQL (server) |
| **Authentication** | None | JWT-based |
| **Multi-tenant** | No | Yes |
| **Security** | Minimal | Enterprise-grade |
| **Cost** | $13 total | $5-15/month ops |
| **Timeline** | 3-5 days | 6-8 weeks |
| **Scalability** | 1 customer only | Unlimited customers |
| **Branding** | Hardcoded JBG | Dynamic per customer |
| **Revenue** | $0 (sales tool) | $5K/month per customer |

---

## 🎯 Success Criteria

### Demo Success:
- ✅ JBG decision-makers see working AI scheduling
- ✅ Fairness concept is understood and valued
- ✅ JBG signs $75K Year 1 contract
- ✅ Total demo cost < $100

### Production Success:
- ✅ JBG uses platform daily for real scheduling
- ✅ 80% reduction in manual scheduling time
- ✅ Fairness score ≥ 90% maintained weekly
- ✅ Zero data security incidents
- ✅ 99.5% uptime SLA met
- ✅ JBG provides testimonial for Customer #2 sales

---

## 📝 Next Steps

**Immediate (This Week):**
1. Build demo version with Claude Code
2. Deploy to jbgtruckscheduling.com
3. Schedule demo with JBG contact
4. Present and close deal

**After Contract (Week 2+):**
5. Begin production backend development
6. Weekly progress updates to JBG
7. Launch in Week 8
8. Collect $5K monthly payments

---

This specification provides clear separation between what we're building NOW (demo) versus what we're building LATER (production), eliminating confusion for Claude Code or any other development tool.