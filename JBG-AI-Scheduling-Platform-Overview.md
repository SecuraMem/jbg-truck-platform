# JBG AI-Powered Truck Scheduling Platform
## Executive Overview for Jamaica Broilers Group

---

## Introduction

We are pleased to present the **JBG AI-Powered Truck Scheduling Platform** — an intelligent dispatch system designed specifically for Jamaica Broilers Group's logistics operations. This platform leverages advanced artificial intelligence to ensure **fair, efficient, and transparent** load assignments across your fleet of 80+ contracted trucks.

Built on JBG's core values of **"Truth, Fairness & Goodwill"**, this system addresses the critical challenge of equitable work distribution while optimizing delivery efficiency across Jamaica.

---

## The Problem We Solve

### Current Challenges in Manual Scheduling

1. **Fairness Perception Issues**: Contract drivers may feel some trucks receive preferential treatment over others, leading to dissatisfaction and potential contractor churn.

2. **Time-Consuming Manual Process**: Dispatchers spend significant time manually matching loads to trucks, considering capacity, location, and driver availability.

3. **Lack of Transparency**: Without clear metrics, it's difficult to demonstrate that scheduling decisions are made fairly.

4. **Inconsistent Decision-Making**: Different dispatchers may apply different criteria, leading to inconsistent outcomes.

5. **No Historical Tracking**: Difficult to analyze patterns or prove fairness over time.

---

## Our Solution: AI-Powered Fair Scheduling

### Core Philosophy

The platform operates on a simple principle: **Every contractor deserves equal opportunity to earn their living.**

We define "fairness" as ensuring all active trucks meet a minimum weekly quota (default: 3 loads per week) before any truck receives additional assignments.

### How the AI Works

Our system uses **Claude AI** (by Anthropic) to analyze your fleet and loads, then generate optimized assignments that maximize fairness while respecting operational constraints.

**The AI considers:**
- Current weekly load count for each truck
- Truck capacity and size (small: 3-5T, medium: 8-14T, large: 18-25T)
- Load size, destination, priority, and deadline
- Which trucks are furthest below their weekly quota
- Capacity matching (right-sized truck for each load)

**The AI prioritizes:**
1. Trucks with 0 loads this week (highest priority)
2. Trucks with 1-2 loads (below quota)
3. Trucks at quota (3 loads)
4. Trucks above quota (only if necessary)

---

## Platform Features

### 1. Real-Time Dashboard

![Dashboard Overview]

The main dashboard provides instant visibility into your fleet's status:

| Metric | Description |
|--------|-------------|
| **Fairness Score** | Percentage of trucks meeting or exceeding weekly quota (target: 90%+) |
| **Active Trucks** | Number of trucks currently available for dispatch |
| **Below Quota** | Trucks needing priority for fair distribution |
| **Unassigned Loads** | Loads ready for AI scheduling |
| **Average Loads/Truck** | Fleet-wide distribution metric |

**Priority Trucks Table**: Instantly see which contractors most need work, sorted by urgency.

---

### 2. AI Schedule Generation

**One-Click Intelligent Scheduling**

When dispatchers click "Generate Fair Schedule", the AI:

1. Analyzes all 88 trucks and their current weekly loads
2. Reviews all unassigned loads (size, destination, priority, deadline)
3. Creates optimal assignments prioritizing fairness
4. Returns assignments with **reasoning for each decision**
5. Calculates the resulting fairness score

**Example AI Output:**
```
Assignment: Load L-1005 (12T to Montego Bay) → Truck T-023
Reasoning: Brown's Haulage (T-023) has only 1 load this week and needs
2 more to meet quota. Medium truck capacity (12T) matches load size perfectly.
```

**Processing Time**: 10-15 seconds for full fleet analysis

---

### 3. Conversational AI Assistant

**Natural Language Interface for Dispatchers**

Dispatchers can chat with the AI to:

- **Ask questions**: "Which trucks need the most help this week?"
- **Explore scenarios**: "What if Truck T-001 is unavailable tomorrow?"
- **Get explanations**: "Why was Load L-1008 assigned to T-045?"
- **Request changes**: "Can we reassign the Montego Bay load to a larger truck?"
- **Analyze patterns**: "Which routes have the most high-priority loads?"

**Sample Conversation:**
```
Dispatcher: "What if we get 10 more loads for Kingston tomorrow?"

AI: "Based on current distribution, I'd recommend assigning those loads to:
- T-012 (Campbell Transport): 0 loads, Kingston-based
- T-034 (Williams Trucking): 1 load, available
- T-056 (Davis Logistics): 1 load, medium capacity
...
This would improve your fairness score from 71% to 85%."
```

---

### 4. Fleet Management

**Complete Truck Overview**

- View all 88 trucks with real-time status
- Filter by: Below Quota / At Quota / Above Quota
- Search by truck ID or contractor name
- Sort by weekly loads, size, or contractor
- Visual progress bars showing quota completion

**Fairness Status Dashboard** *(NEW)*

At-a-glance fairness indicators with color-coded summary cards:

| Card | Color | Description |
|------|-------|-------------|
| **Below Quota** | 🔴 Red | Trucks needing more loads to meet weekly target |
| **At Quota** | 🟡 Yellow | Trucks meeting their weekly target exactly |
| **Above Quota** | 🟢 Green | Trucks exceeding their weekly target |
| **Fairness Score** | 🔵 Blue | Percentage of trucks at or above quota |

**Contractor Performance Tracking** *(NEW)*

Each truck displays performance metrics:
- **On-Time Rate**: Color-coded badge (🟢 90%+ / 🟡 75-89% / 🔴 <75%)
- Historical reliability data for informed assignment decisions
- Helps prioritize reliable contractors for time-sensitive deliveries

**Truck Information Displayed:**
- Truck ID (T-001 through T-088)
- Contractor Name
- Truck Size (Small/Medium/Large)
- Capacity (tons)
- Weekly Loads (current/target)
- Performance Badge *(NEW)*
- Status Badge

---

### 5. Load Management

**Comprehensive Load Tracking**

- View all loads with priority indicators
- Filter by: High/Normal/Low priority
- Filter by: Assigned/Unassigned status
- Add new loads manually
- Track assignment status

**Regional Grouping View** *(NEW)*

Toggle between Grid View and Regional View to see loads organized by Jamaica's geographic regions:

| Region | Coverage |
|--------|----------|
| **Kingston Metro** | Kingston, Portmore, Spanish Town, Half Way Tree, Liguanea |
| **Western** | Montego Bay, Negril, Savanna-la-Mar, Black River |
| **North Coast** | Ocho Rios, Falmouth, Runaway Bay, Port Antonio |
| **Central** | Mandeville, May Pen, Old Harbour, Linstead |
| **Eastern** | Morant Bay, Yallahs, Bull Bay |

Benefits of Regional View:
- **Route optimization**: Group deliveries by area to minimize travel time
- **Fuel efficiency**: Reduce empty miles by clustering nearby deliveries
- **Visual clarity**: Instantly see which regions have the most pending loads

**Load Information:**
- Load ID
- Size (tons)
- Destination (Jamaican locations)
- Priority Level
- Deadline
- Region Badge *(NEW)*
- Assigned Truck (if applicable)

**Supported Destinations:**
Kingston, Montego Bay, Spanish Town, Portmore, Mandeville, May Pen, Ocho Rios, Savanna-la-Mar, Negril, Half Way Tree, Liguanea, Constant Spring, Papine, Port Antonio, Black River, Falmouth, Runaway Bay, and more.

---

### 6. AI-Powered Recommendations *(NEW)*

**Intelligent Insights with One-Click Actions**

After generating a schedule, the AI provides actionable recommendations:

| Category | Icon | Purpose |
|----------|------|---------|
| **Fairness** | 📈 | Identify trucks falling behind quota |
| **Efficiency** | 📍 | Suggest route optimizations and load consolidation |
| **Risk** | ⚠️ | Warn about capacity issues or tight deadlines |
| **Cost** | 💰 | Flag opportunities to reduce empty miles |

**One-Click Accept & Apply** *(NEW)*

Each recommendation includes an "Accept & Apply" button that:
- Instantly implements the suggested change
- Shows "Applied" confirmation when actioned
- Saves dispatcher time on routine decisions
- Turns AI insights into immediate actions

**Example Recommendations:**
```
🔴 HIGH PRIORITY - Fairness
Issue: T-045, T-067, T-089 still at 0/3 loads this week
Impact: Risk of missing weekly minimum, affects contractor fairness
Action: Prioritize these 3 trucks for tomorrow's high-priority loads
[⚡ Accept & Apply]

🟡 MEDIUM PRIORITY - Efficiency
Issue: 4 loads going to Montego Bay area assigned to different trucks
Impact: Increased fuel costs and travel time
Action: Consolidate Western region loads to 2 trucks for route efficiency
[⚡ Accept & Apply]
```

---

### 7. Truck Import Feature

**Easy Fleet Updates**

- Import truck data via CSV
- Add new contractors quickly
- Bulk updates supported

---

## Fairness Metrics Explained

### The Fairness Score

**Definition**: The percentage of active trucks that have met or exceeded their weekly quota.

**Calculation**:
```
Fairness Score = (Trucks at quota + Trucks above quota) / Total active trucks × 100
```

**Example**:
- 88 total trucks, 85 active
- 25 trucks below quota (0-2 loads)
- 35 trucks at quota (3 loads)
- 25 trucks above quota (4+ loads)
- **Fairness Score**: (35 + 25) / 85 = **70.6%**

**Target**: Maintain 90%+ fairness score by end of each week

### Weekly Reset

Every Monday, load counts reset to zero, ensuring a fresh start for all contractors.

---

## Technical Architecture

### Security & Data Privacy

| Aspect | Implementation |
|--------|----------------|
| **API Key Security** | Your Anthropic API key is stored server-side only; never exposed to browsers |
| **Data Storage** | Demo uses browser localStorage; Production uses encrypted PostgreSQL |
| **Authentication** | Production version includes JWT-based user login |
|

### Technology Stack

- **Frontend**: React 18 with TypeScript
- **Backend**: Rust + Axum web framework
- **Styling**: Tailwind CSS (JBG green color scheme)
- **AI Engine**: Anthropic Claude API
- **API Server**: Express.js (development) / Vercel Serverless (production)
- **Testing**: 203 automated tests (Vitest)

---

## Deployment Options

### Option 1: Cloud Hosted (Recommended)

- Hosted on Vercel (global CDN)
- Custom domain: webagentapp.com
- Automatic HTTPS
- 99.9% uptime SLA
- Zero infrastructure management

### Option 2: On-Premise

- Deploy on Jamaica Broilers Group's own servers
- Full data sovereignty
- Requires IT support for maintenance

---

## Business Benefits

### For Dispatchers

- **80% reduction** in scheduling time
- Clear, AI-explained decisions
- Easy "what-if" scenario planning
- No more manual fairness calculations
- **One-click recommendations** — instant actions from AI insights *(NEW)*
- **Regional view** — see loads grouped by Jamaica's regions *(NEW)*

### For Management

- **Real-time visibility** into fleet utilization
- **Auditable fairness metrics** for contractor relations
- **Data-driven decisions** backed by AI analysis
- **Reduced complaints** from transparent scheduling
- **Fairness dashboard** — color-coded status at a glance *(NEW)*
- **Performance tracking** — contractor reliability metrics *(NEW)*

### For Contractors

- **Guaranteed fair treatment** — everyone gets equal opportunity
- **Visible metrics** — see exactly where you stand
- **Trust in the system** — AI removes human bias
- **Performance recognition** — on-time rates are tracked and valued *(NEW)*

---

## Sample Screenshots

### Dashboard View
```
┌─────────────────────────────────────────────────────────────────┐
│  JBG Truck Scheduling          Jamaica Broilers Group           │
│  Truth, Fairness & Goodwill    With God's guidance, we serve    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Fairness │ │ Active   │ │ Below    │ │Unassigned│           │
│  │   71%    │ │ Trucks   │ │ Quota    │ │  Loads   │           │
│  │    ↗     │ │   85     │ │   25     │ │    24    │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                 │
│  [★ Generate Fair Schedule]                                     │
│                                                                 │
│  Trucks Needing Priority:                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ T-012 │ Campbell Transport │ Medium │ 0/3 │ Needs 3    │   │
│  │ T-034 │ Williams Trucking  │ Large  │ 1/3 │ Needs 2    │   │
│  │ T-056 │ Davis Logistics    │ Small  │ 1/3 │ Needs 2    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Demo Review** | Week 1 | Live demo at webagentapp.com |
| **Feedback & Refinement** | Week 2 | Incorporate JBG-specific requirements |
| **Production Build** | Weeks 3-4 | Full backend, authentication, database |
| **Testing & Training** | Week 5 | User acceptance testing, dispatcher training |
| **Go-Live** | Week 6 | Production launch with support |

---
For Production backend Development

Rust backend:
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
---

*"With God's guidance, we serve — and with AI guidance, we serve fairly."*

**JBG AI-Powered Truck Scheduling Platform**
Built with Truth, Fairness & Goodwill in mind.
