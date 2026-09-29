# Client-Side Routing and Navigation

<cite>
**Referenced Files in This Document**
- [plan.md](file://tasks/plan.md)
- [todo.md](file://tasks/todo.md)
- [Pujo_Sahayak_Master_Project_Context.md](file://Pujo_Sahayak_Master_Project_Context.md)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document explains the client-side routing and navigation design for Pujo Sahayak, a mobile-first React + Vite PWA. The application targets 21 mockup screens and uses React Router v6 to map primary navigation tabs, nested detail routes, and feature-specific subroutes. It also documents how URL parameters, query-like state, and navigation guards integrate with the app’s AI assistant context (Maya), favorites, planner, and social meetups.

The documentation is derived from the project’s planning and task files and the master product context. No source code was available in the workspace; therefore, this guide describes the intended implementation rather than inspecting concrete route definitions.

## Project Structure
At the repository level, the routing specification lives in the planning and task artifacts:

- `tasks/plan.md` defines the screen-to-route mapping, architecture decisions, and the overall React Router v6 strategy.
- `tasks/todo.md` tracks implementation tasks that tie routes to UI components and verification steps.
- `Pujo_Sahayak_Master_Project_Context.md` defines the primary navigation surface (Home, Favorites, Search, Categories, Meets) and the role of Maya as an always-accessible assistant.

```mermaid
graph TB
A["Repository Root"] --> B["tasks/plan.md"]
A --> C["tasks/todo.md"]
A --> D["Pujo_Sahayak_Master_Project_Context.md"]
B --> E["Screen → Route Map"]
B --> F["React Router v6 Strategy"]
C --> G["Task-Based Implementation Checklist"]
D --> H["Primary Navigation Tabs"]
D --> I["Maya Assistant Context"]
```

**Diagram sources**
- [plan.md:1-79](file://tasks/plan.md#L1-L79)
- [todo.md:1-81](file://tasks/todo.md#L1-L81)
- [Pujo_Sahayak_Master_Project_Context.md:140-158](file://Pujo_Sahayak_Master_Project_Context.md#L140-L158)

**Section sources**
- [plan.md:1-79](file://tasks/plan.md#L1-L79)
- [todo.md:1-81](file://tasks/todo.md#L1-L81)
- [Pujo_Sahayak_Master_Project_Context.md:140-158](file://Pujo_Sahayak_Master_Project_Context.md#L140-L158)

## Core Components
The routing system centers around five primary navigation tabs plus deep links into feature areas:

- Primary tabs: Home, Favorites, Search, Categories, Meets.
- Deep-linkable features: Maya, Planner, Safety/Emergency, Profile/Settings, Trip/Route Map, Restaurant Detail, Pandal Detail, Beyond Puja.

Key responsibilities:
- Bottom tab bar maps to top-level routes.
- Detail pages use nested routes with URL parameters.
- Maya receives contextual data through route state or shared store.
- Navigation guards protect premium or sensitive flows (e.g., advanced planner, paid meetups).

```mermaid
graph LR
BottomNav["Bottom Tab Navigation"] --> Home["Home /"]
BottomNav --> Favorites["Favorites /favorites"]
BottomNav --> Search["Search /search"]
BottomNav --> Categories["Categories /categories"]
BottomNav --> Meets["Meets /meets"]
Home --> Explore["Explore /explore"]
Explore --> PandalDetail["Pandal Detail /pandal/:id"]
Explore --> RestaurantDetail["Restaurant Detail /restaurant/:id"]
Meets --> CreateMeetup["Create Meetup /meets/create"]
Profile["Profile /profile"] --> Settings["Settings /profile/settings"]
Safety["Safety /safety"] --> MissingPerson["Missing Person Report /safety/missing-person"]
Planner["Planner /planner"] --> TripMap["Trip /trip/:planDayId"]
Maya["Maya /maya<br/>Scan /maya/scan"] -.->|Contextual hints| PandalDetail
Maya -.->|Contextual hints| RestaurantDetail
```

**Diagram sources**
- [plan.md:19-39](file://tasks/plan.md#L19-L39)
- [Pujo_Sahayak_Master_Project_Context.md:140-158](file://Pujo_Sahayak_Master_Project_Context.md#L140-L158)

**Section sources**
- [plan.md:19-39](file://tasks/plan.md#L19-L39)
- [Pujo_Sahayak_Master_Project_Context.md:140-158](file://Pujo_Sahayak_Master_Project_Context.md#L140-L158)

## Architecture Overview
The routing architecture follows these principles:

- React Router v6 is used for all navigation.
- Five bottom tabs correspond to top-level routes.
- Detail pages are nested under `/pandal/:id` and `/restaurant/:id`.
- Feature subroutes include `/maya`, `/maya/scan`, `/meets/create`, `/safety`, `/safety/missing-person`, `/trip/:planDayId`, `/profile/settings`, and `/beyond-puja`.
- State persistence uses Zustand with localStorage for saves, visits, plans, settings, and “continue where you left off.”
- Motion and offline capabilities are provided by Framer Motion and vite-plugin-pwa respectively.

```mermaid
flowchart TD
Start(["App Boot"]) --> Router["React Router v6 Setup"]
Router --> Shell["AppShell + Bottom Nav"]
Shell --> TopRoutes["Top-Level Routes<br/>Home, Favorites, Search, Categories, Meets"]
TopRoutes --> NestedRoutes["Nested Routes<br/>Details, Subfeatures"]
NestedRoutes --> Params["URL Parameters<br/>/pandal/:id, /restaurant/:id, /trip/:planDayId"]
NestedRoutes --> QueryState["Query-Like State<br/>Filters, Search, Category Selection"]
NestedRoutes --> Guards["Navigation Guards<br/>Premium, Auth, Permissions"]
Params --> Store["Zustand Store<br/>Saves, Visits, Plans, Settings"]
QueryState --> Store
Guards --> Store
Store --> MayaCtx["Maya Context<br/>Current Place, Plan, Location"]
```

**Diagram sources**
- [plan.md:7-18](file://tasks/plan.md#L7-L18)
- [plan.md:19-39](file://tasks/plan.md#L19-L39)

**Section sources**
- [plan.md:7-18](file://tasks/plan.md#L7-L18)
- [plan.md:19-39](file://tasks/plan.md#L19-L39)

## Detailed Component Analysis

### Screen-to-Route Mapping
The planned mapping covers 21 screens across discovery, planning, social, utility, and profile domains.

| Mockup screen | Route | Notes |
|---|---|---|
| Splash | `/splash` | Entry point |
| Home | `/` | Main discovery surface |
| Explore / Pandal Directory | `/explore` | List/Map toggle, filters |
| Pandal Detail | `/pandal/:id` | Hero, actions, reviews, similar places |
| Maya chat / Scan / Voice | `/maya`, `/maya/scan` | Chat shell, camera scan frame |
| Puja Planner | `/planner` | Day tabs, stops, AI suggestion |
| Meets list | `/meets` | Existing meetups |
| Create Meetup | `/meets/create` | Form wizard |
| Categories | `/categories` | Places, Transport & Services, Utilities |
| Search | `/search` | Trending, nearby, filter pills |
| Profile | `/profile` | User control center |
| Safety / Emergency | `/safety` | Quick emergency shortcuts |
| Missing Person Report | `/safety/missing-person` | Wizard flow |
| Trip / Route Map | `/trip/:planDayId` | Leaflet multi-stop map |
| Restaurant Detail | `/restaurant/:id` | Details and nearby restaurants |
| Settings | `/profile/settings` | Appearance, account, privacy |
| Beyond Puja | `/beyond-puja` | Off-season local discovery |

```mermaid
flowchart TD
S1["Splash /splash"] --> S2["Home /"]
S2 --> S3["Explore /explore"]
S3 --> S4["Pandal Detail /pandal/:id"]
S3 --> S5["Restaurant Detail /restaurant/:id"]
S2 --> S6["Search /search"]
S2 --> S7["Categories /categories"]
S2 --> S8["Meets /meets"]
S8 --> S9["Create Meetup /meets/create"]
S2 --> S10["Planner /planner"]
S10 --> S11["Trip /trip/:planDayId"]
S2 --> S12["Profile /profile"]
S12 --> S13["Settings /profile/settings"]
S2 --> S14["Safety /safety"]
S14 --> S15["Missing Person Report /safety/missing-person"]
S2 --> S16["Beyond Puja /beyond-puja"]
S2 --> S17["Maya /maya"]
S17 --> S18["Maya Scan /maya/scan"]
```

**Diagram sources**
- [plan.md:19-39](file://tasks/plan.md#L19-L39)

**Section sources**
- [plan.md:19-39](file://tasks/plan.md#L19-L39)

### Primary Navigation Integration
The primary navigation consists of five tabs: Home, Favorites, Search, Categories, and Meets. These should remain simple and mobile-first. The AI assistant (Maya) is accessible prominently but does not occupy one of the five permanent slots.

```mermaid
graph TB
Nav["Bottom Navigation"] --> H["Home"]
Nav --> F["Favorites"]
Nav --> Se["Search"]
Nav --> C["Categories"]
Nav --> M["Meets"]
H --> Maya["Maya (always accessible)"]
F --> Maya
Se --> Maya
C --> Maya
M --> Maya
```

**Diagram sources**
- [Pujo_Sahayak_Master_Project_Context.md:140-158](file://Pujo_Sahayak_Master_Project_Context.md#L140-L158)

**Section sources**
- [Pujo_Sahayak_Master_Project_Context.md:140-158](file://Pujo_Sahayak_Master_Project_Context.md#L140-L158)

### Nested Routing Structures
Nested routes support detail views and feature subpages:

- `/pandal/:id`: Pandal detail page with hero, actions, reviews, similar places, nearby restaurants, and related meetups.
- `/restaurant/:id`: Restaurant detail page connected to the broader local ecosystem.
- `/meets/create`: Meetup creation wizard.
- `/safety/missing-person`: Missing person report wizard.
- `/profile/settings`: Settings within the profile section.
- `/trip/:planDayId`: Route map for a specific day in the planner.
- `/maya/scan`: Camera-based scan mode inside Maya.

```mermaid
flowchart TD
Parent["Parent Route"] --> ChildA["Child Route A"]
Parent --> ChildB["Child Route B"]
Parent --> ChildC["Child Route C"]
Parent --> Params["URL Parameter :id or :planDayId"]
Params --> Data["Load Entity Data"]
Data --> Render["Render Detail View"]
```

**Diagram sources**
- [plan.md:11-11](file://tasks/plan.md#L11-L11)
- [plan.md:19-39](file://tasks/plan.md#L19-L39)

**Section sources**
- [plan.md:11-11](file://tasks/plan.md#L11-L11)
- [plan.md:19-39](file://tasks/plan.md#L19-L39)

### Navigation Guards
Navigation guards should enforce access rules for premium or sensitive flows:

- Premium-only planner features.
- Paid or restricted meetups.
- Account and privacy-sensitive settings.
- Emergency-related flows requiring quick access without friction.

Recommended guard behavior:
- Redirect unauthenticated users to login when required.
- Prompt upgrade for premium features.
- Allow emergency shortcuts even when locked behind other restrictions.

```mermaid
flowchart TD
Enter["Navigate To Route"] --> CheckAuth{"Requires Authentication?"}
CheckAuth --> |Yes| MaybeLogin["Redirect to Login"]
CheckAuth --> |No| CheckPremium{"Requires Premium?"}
CheckPremium --> |Yes| MaybeUpgrade["Prompt Upgrade"]
CheckPremium --> |No| Allow["Allow Navigation"]
MaybeLogin --> Exit["Exit Guard"]
MaybeUpgrade --> Exit
Allow --> Exit
```

[No sources needed since this diagram shows conceptual workflow, not actual code structure]

### URL Parameter Handling
URL parameters carry entity identifiers and plan-day references:

- `/pandal/:id`: Loads pandal details, reviews, similar places, and nearby restaurants.
- `/restaurant/:id`: Loads restaurant details and related content.
- `/trip/:planDayId`: Loads trip data for a specific planner day.

Implementation guidance:
- Extract parameters from the router location.
- Validate parameter presence before loading data.
- Handle missing or invalid IDs gracefully with fallback UI.

```mermaid
flowchart TD
Start(["Enter Detail Route"]) --> ReadParams["Read URL Parameters"]
ReadParams --> Validate{"Parameters Valid?"}
Validate --> |No| NotFound["Show Not Found or Fallback"]
Validate --> |Yes| FetchData["Fetch Entity Data"]
FetchData --> Render["Render Detail Page"]
NotFound --> End(["Exit"])
Render --> End
```

**Diagram sources**
- [plan.md:19-39](file://tasks/plan.md#L19-L39)

**Section sources**
- [plan.md:19-39](file://tasks/plan.md#L19-L39)

### Query String Management
Although the plan emphasizes query-like state via filters and search inputs, the following patterns apply:

- Search page: maintain search text, trending/nearby toggles, and category filters.
- Explore page: maintain area, distance, theme, and crowd filters.
- Categories page: maintain selected category group and subcategory selection.
- Meets page: maintain date, location, and interest filters.

Recommendation:
- Keep lightweight query state in URL for shareability and back-button support.
- Persist heavy or complex filters in Zustand if they affect multiple screens.

```mermaid
flowchart TD
Input["User Filters/Search Input"] --> UpdateState["Update Query-Like State"]
UpdateState --> Persist{"Shareable or Global?"}
Persist --> |Yes| SyncURL["Sync With URL Query"]
Persist --> |No| LocalStore["Keep In Local State"]
SyncURL --> Apply["Apply Filters to Data"]
LocalStore --> Apply
Apply --> Render["Render Filtered Results"]
```

[No sources needed since this diagram shows conceptual workflow, not actual code structure]

### Navigation State Synchronization With Maya Context
Maya should understand the current app context so users do not repeat information:

- If opened from a pandal page, Maya knows the selected pandal.
- If opened from a restaurant page, Maya knows the selected restaurant.
- Maya can consider current location, saved locations, current trip, selected language, and relevant category.

```mermaid
sequenceDiagram
participant User as "User"
participant Router as "Router"
participant Page as "Detail Page"
participant Store as "Zustand Store"
participant Maya as "Maya Context"
User->>Page : Open Pandal/Restaurant
Page->>Store : Load Selected Entity
Store-->>Page : Entity Data
User->>Router : Navigate to /maya
Router->>Maya : Pass Context From Current Route
Maya-->>User : Context-Aware Responses
```

**Diagram sources**
- [Pujo_Sahayak_Master_Project_Context.md:643-660](file://Pujo_Sahayak_Master_Project_Context.md#L643-L660)
- [plan.md:19-39](file://tasks/plan.md#L19-L39)

**Section sources**
- [Pujo_Sahayak_Master_Project_Context.md:643-660](file://Pujo_Sahayak_Master_Project_Context.md#L643-L660)
- [plan.md:19-39](file://tasks/plan.md#L19-L39)

## Dependency Analysis
Routing depends on several cross-cutting concerns:

- Bottom navigation drives top-level routes.
- Detail routes depend on entity data loaded from the demo dataset.
- Maya depends on current route context and store state.
- Planner and trip routes depend on persisted plan data.
- Meets routes depend on meetup data and user permissions.

```mermaid
graph TB
RN["React Router v6"] --> BN["Bottom Navigation"]
BN --> TR["Top Routes"]
TR --> DR["Detail Routes"]
DR --> DS["Demo Dataset"]
TR --> MS["Maya Context"]
TR --> PS["Planner State"]
TR --> ME["Meets State"]
PS --> TM["Trip Map"]
MS --> MR["Maya Responses"]
```

**Diagram sources**
- [plan.md:7-18](file://tasks/plan.md#L7-L18)
- [plan.md:19-39](file://tasks/plan.md#L19-L39)

**Section sources**
- [plan.md:7-18](file://tasks/plan.md#L7-L18)
- [plan.md:19-39](file://tasks/plan.md#L19-L39)

## Performance Considerations
- Use lazy loading for heavy routes such as maps and camera-based scanning.
- Defer non-critical data fetching until after initial render.
- Avoid unnecessary re-renders by memoizing filtered lists and context values.
- Respect reduced-motion preferences for smooth transitions.
- Keep URL state minimal to avoid excessive history entries.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common routing issues and resolutions:

- Broken deep links: verify route definitions match the planned screen-to-route map.
- Missing detail data: validate URL parameters and handle invalid IDs gracefully.
- Maya lacks context: ensure context is passed when navigating to `/maya` or `/maya/scan`.
- Filters not persisting: confirm whether filters should be stored in URL query or Zustand.
- Premium features accessible without upgrade: review navigation guards and redirect logic.
- Offline behavior: verify service worker caching for critical shell assets.

**Section sources**
- [plan.md:63-79](file://tasks/plan.md#L63-L79)
- [todo.md:77-81](file://tasks/todo.md#L77-L81)

## Conclusion
The routing design for Pujo Sahayak centers on a clean React Router v6 setup with five primary tabs, nested detail routes, and feature subroutes. URL parameters identify entities and planner days, while query-like state manages filters and searches. Maya integrates deeply with routing context to provide grounded, helpful responses. Navigation guards protect premium and sensitive flows, and Zustand persists user state for continuity. This structure supports both the seasonal Puja experience and the broader off-season local discovery model.

[No sources needed since this section summarizes without analyzing specific files]