# Meets Page Implementation

<cite>
**Referenced Files in This Document**
- [Pujo_Sahayak_Master_Project_Context.md](file://Pujo_Sahayak_Master_Project_Context.md)
- [plan.md](file://tasks/plan.md)
- [todo.md](file://tasks/todo.md)
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
This document explains the Meets Page implementation for Pujo Sahayak as a social discovery layer that helps users find or organize community meetups around shared interests and plans. It covers:
- The social discovery interface for browsing, filtering, and joining meetups
- The meetup creation workflow with form fields, validation concepts, location selection, and participant management
- Interest-based matching to connect users with similar activities
- Real-time update patterns for status changes and participant joins
- Geographic proximity features and location-based meetup discovery
- Scalability considerations for growing community features and user-generated content

The Meets feature is part of a broader product ecosystem centered on Durga Puja exploration, local discovery, planning, safety, and community interaction.

## Project Structure
The repository currently contains product context and task documentation rather than application source code. The Meets feature is defined at the product and planning levels:
- Product context defines the Meets page goal, existing meetup cards, create-your-own flow, interest-based discovery, monetization concepts, and integration points such as “meetups near this place” from the Pandal Detail page.
- Implementation plan maps routes including `/meets` and `/meets/create`.
- Task checklist describes the expected UI behavior for Meets and Create Meetup, including pills, cards, join actions, and local state updates.

```mermaid
graph TB
App["Pujo Sahayak App"] --> Home["Home"]
App --> Explore["Explore / Pandal Directory"]
App --> PandalDetail["Pandal Detail"]
App --> Meets["Meets Page"]
App --> CreateMeetup["Create Meetup"]
App --> Profile["Profile"]
App --> Safety["Safety / Emergency"]
PandalDetail --> MeetsNearby["Meetups near this place"]
Meets --> JoinAction["Join Meetup"]
CreateMeetup --> AddToStore["Add Meetup to Local Store"]
```

**Diagram sources**
- [Pujo_Sahayak_Master_Project_Context.md:664-770](file://Pujo_Sahayak_Master_Project_Context.md#L664-L770)
- [plan.md:29-30](file://tasks/plan.md#L29-L30)
- [todo.md:53-54](file://tasks/todo.md#L53-L54)

**Section sources**
- [Pujo_Sahayak_Master_Project_Context.md:664-770](file://Pujo_Sahayak_Master_Project_Context.md#L664-L770)
- [plan.md:19-39](file://tasks/plan.md#L19-L39)
- [todo.md:53-54](file://tasks/todo.md#L53-L54)

## Core Components
The Meets feature includes these core components based on the product context and tasks:
- Meets list view with pill filters (All, Nearby, My Interests)
- Meetup cards showing image, name, date/time, location/distance, attendee avatars + count, and Join action
- Create Meetup form with title, date, time, location, description, interest chips, maximum participants, and public/restricted visibility
- Integration with Pandal Detail via “Meetups near this place”
- Profile activity tracking including a Meetups tab
- Monetization model support for free, paid, and premium-only meetups

These components are designed to be mobile-first, integrated with the app’s design system, and backed by a typed data model that includes a `Meetup` entity.

**Section sources**
- [Pujo_Sahayak_Master_Project_Context.md:664-770](file://Pujo_Sahayak_Master_Project_Context.md#L664-L770)
- [Pujo_Sahayak_Master_Project_Context.md:935-950](file://Pujo_Sahayak_Master_Project_Context.md#L935-L950)
- [Pujo_Sahayak_Master_Project_Context.md:978-991](file://Pujo_Sahayak_Master_Project_Context.md#L978-L991)
- [plan.md:19-39](file://tasks/plan.md#L19-L39)
- [todo.md:53-54](file://tasks/todo.md#L53-L54)

## Architecture Overview
At a high level, the Meets feature interacts with:
- Routing: `/meets` and `/meets/create`
- State store: Zustand with persist middleware for meetups and related user state
- Data model: Typed entities including `Meetup`, `Place`, `User`, etc.
- UI components: Cards, chips, buttons, bottom navigation, motion primitives
- Location services: Proximity calculations and nearby discovery
- Safety and moderation controls for social interactions

```mermaid
graph TB
Router["React Router"] --> MeetsRoute["/meets"]
Router --> CreateRoute["/meets/create"]
MeetsRoute --> MeetsList["Meets List View"]
CreateRoute --> CreateForm["Create Meetup Form"]
MeetsList --> Filters["Filters: All / Nearby / My Interests"]
MeetsList --> Cards["Meetup Cards"]
Cards --> JoinAction["Join Action"]
CreateForm --> Validation["Form Validation"]
CreateForm --> LocationPicker["Location Selection"]
CreateForm --> ParticipantLimits["Participant Limits"]
CreateForm --> Visibility["Public / Restricted"]
MeetsList --> Store["Zustand Store"]
CreateForm --> Store
JoinAction --> Store
Store --> DataModel["Typed Data Model"]
Store --> Persistence["localStorage"]
MeetsList --> LocationService["Geographic Proximity"]
CreateForm --> LocationService
```

**Diagram sources**
- [plan.md:19-39](file://tasks/plan.md#L19-L39)
- [todo.md:53-54](file://tasks/todo.md#L53-L54)
- [Pujo_Sahayak_Master_Project_Context.md:664-770](file://Pujo_Sahayak_Master_Project_Context.md#L664-L770)

## Detailed Component Analysis

### Social Discovery Interface
The Meets list provides:
- Pill filters: All, Nearby, My Interests
- Meetup cards with image, name, date/time, location/distance, attendee avatars + count, and Join action
- Integration with the broader app navigation and routing

Behavioral expectations:
- Filtering updates the displayed list without full reloads
- Joining a meetup updates local state immediately
- Distance and location are shown per card to aid discovery

```mermaid
flowchart TD
Start(["Open Meets Page"]) --> LoadList["Load Meetups from Store"]
LoadList --> ApplyFilters["Apply Active Filter<br/>All / Nearby / My Interests"]
ApplyFilters --> RenderCards["Render Meetup Cards"]
RenderCards --> UserInteraction{"User Interaction"}
UserInteraction --> |Join| UpdateState["Update Attendees Count<br/>Mark Joined"]
UserInteraction --> |Filter Change| ReapplyFilters["Reapply Filters"]
UpdateState --> Persist["Persist to localStorage"]
ReapplyFilters --> RenderCards
Persist --> End(["Updated UI"])
```

**Diagram sources**
- [todo.md:53-54](file://tasks/todo.md#L53-L54)
- [plan.md:19-39](file://tasks/plan.md#L19-L39)

**Section sources**
- [todo.md:53-54](file://tasks/todo.md#L53-L54)
- [plan.md:19-39](file://tasks/plan.md#L19-L39)

### Meetup Creation Workflow
The Create Meetup form includes:
- Title
- Date
- Time
- Location
- Description
- Interest chips
- Maximum participants
- Public / restricted visibility
- Optional selections for pandals, restaurants, or route

Validation and UX considerations:
- Required fields must be validated before submission
- Location should be selected explicitly; distance can be computed later
- Interest chips should constrain or tag the meetup for matching
- Maximum participants should enforce capacity limits
- Visibility should control discoverability and access

```mermaid
flowchart TD
Open(["Open Create Meetup"]) --> FillFields["Fill Title, Date, Time, Location, Description"]
FillFields --> SelectInterests["Select Interest Chips"]
SelectInterests --> SetLimits["Set Max Participants"]
SetLimits --> ChooseVisibility["Choose Public / Restricted"]
ChooseVisibility --> Validate["Validate Fields"]
Validate --> Valid{"Valid?"}
Valid --> |No| ShowErrors["Show Field Errors"]
Valid --> |Yes| Submit["Submit Meetup"]
Submit --> AddToList["Add to Local Meetup List"]
AddToList --> NavigateBack["Navigate Back to Meets"]
ShowErrors --> FillFields
```

**Diagram sources**
- [Pujo_Sahayak_Master_Project_Context.md:703-727](file://Pujo_Sahayak_Master_Project_Context.md#L703-L727)
- [todo.md:53-54](file://tasks/todo.md#L53-L54)

**Section sources**
- [Pujo_Sahayak_Master_Project_Context.md:703-727](file://Pujo_Sahayak_Master_Project_Context.md#L703-L727)
- [todo.md:53-54](file://tasks/todo.md#L53-L54)

### Interest-Based Matching Algorithm
Interest-based matching connects users with meetups and other users through shared interests such as photography, pandal hopping, food, music, art, night exploration, heritage, and family-friendly exploration. The algorithm should:
- Tag meetups with interest chips
- Tag users with their interests
- Score match relevance using:
  - Exact interest overlap
  - Activity type alignment (e.g., pandal-related meetups for users who explore pandals)
  - Recency of user activity
  - Location proximity when applicable

Implementation guidance:
- Start with simple scoring rules
- Avoid dating-app-like profiles; emphasize activity-based discovery
- Provide clear explanations for recommendations where possible

```mermaid
flowchart TD
Inputs["User Interests + Meetup Tags"] --> ComputeOverlap["Compute Interest Overlap"]
ComputeOverlap --> WeightFactors["Weight by Activity Type + Recency + Location"]
WeightFactors --> RankMatches["Rank Matched Meetups/Users"]
RankMatches --> PresentResults["Present Top Matches"]
```

**Diagram sources**
- [Pujo_Sahayak_Master_Project_Context.md:730-750](file://Pujo_Sahayak_Master_Project_Context.md#L730-L750)

**Section sources**
- [Pujo_Sahayak_Master_Project_Context.md:730-750](file://Pujo_Sahayak_Master_Project_Context.md#L730-L750)

### Real-Time Updates for Status Changes and Participant Joins
Real-time updates should reflect:
- New attendees joining a meetup
- Host-initiated status changes (e.g., cancelled, full, moved)
- Live participant counts and avatars

Patterns:
- Optimistic UI updates followed by persistence
- Event-driven state changes in the store
- Debounced re-renders to avoid excessive UI churn
- Fallback to polling if real-time channels are unavailable

```mermaid
sequenceDiagram
participant User as "User"
participant UI as "Meets UI"
participant Store as "Zustand Store"
participant Backend as "Backend Service"
User->>UI : Click Join
UI->>Store : Update attendee count locally
Store-->>UI : Optimistic render
UI->>Backend : Send join request
Backend-->>Store : Confirm join
Store-->>UI : Finalize state
```

**Diagram sources**
- [todo.md:53-54](file://tasks/todo.md#L53-L54)
- [plan.md:12](file://tasks/plan.md#L12)

**Section sources**
- [todo.md:53-54](file://tasks/todo.md#L53-L54)
- [plan.md:12](file://tasks/plan.md#L12)

### Geographic Proximity Features
Location-based meetup discovery should:
- Use GPS or manual location input
- Compute distances between user and meetup locations
- Surface nearby meetups prominently
- Integrate with map views and route planning where relevant

Constraints:
- Do not overclaim precision in dense urban environments
- Use wording like “nearby” instead of exact containment
- Respect privacy controls for location sharing

```mermaid
flowchart TD
GetUserLocation["Get User Location"] --> FetchMeetups["Fetch Meetups"]
FetchMeetups --> ComputeDistances["Compute Distances"]
ComputeDistances --> SortByProximity["Sort by Proximity"]
SortByProximity --> DisplayNearby["Display Nearby Meetups"]
```

**Diagram sources**
- [Pujo_Sahayak_Master_Project_Context.md:1360-1387](file://Pujo_Sahayak_Master_Project_Context.md#L1360-L1387)
- [todo.md:53-54](file://tasks/todo.md#L53-L54)

**Section sources**
- [Pujo_Sahayak_Master_Project_Context.md:1360-1387](file://Pujo_Sahayak_Master_Project_Context.md#L1360-L1387)
- [todo.md:53-54](file://tasks/todo.md#L53-L54)

### Integration with Pandal Detail
The Pandal Detail page can surface “Meetups near this place,” connecting individual places to the community system. This encourages users to discover group activities aligned with specific locations they are exploring.

```mermaid
sequenceDiagram
participant PD as "Pandal Detail Page"
participant API as "Meetup Service"
participant UI as "Meets Section"
PD->>API : Request meetups near pandal
API-->>PD : Return nearby meetups
PD->>UI : Render "Meetups near this place"
```

**Diagram sources**
- [Pujo_Sahayak_Master_Project_Context.md:935-950](file://Pujo_Sahayak_Master_Project_Context.md#L935-L950)

**Section sources**
- [Pujo_Sahayak_Master_Project_Context.md:935-950](file://Pujo_Sahayak_Master_Project_Context.md#L935-L950)

### Data Structures
The product data model includes a `Meetup` entity alongside other core types such as `User`, `Place`, `Review`, `Photo`, `Trip`, `Category`, `Offer`, `Subscription`, `Payment`, `SafetyPoint`, and `EmergencyReport`. A Pandal can be modeled as a specialized type of Place to support off-season expansion.

Key fields implied by the context:
- Meetup: title, date, time, location, description, interests, max participants, visibility, attendees
- Place/Pandal: name, location, theme, area, popularity
- User: interests, activity history, profile settings

```mermaid
erDiagram
USER {
uuid id PK
string name
array interests
timestamp created_at
}
PLACE {
uuid id PK
string name
float latitude
float longitude
enum category
}
MEETUP {
uuid id PK
string title
datetime start_time
datetime end_time
uuid place_id FK
text description
array interests
int max_participants
enum visibility
}
USER ||--o{ MEETUP : "joins"
PLACE ||--o{ MEETUP : "hosts"
```

**Diagram sources**
- [Pujo_Sahayak_Master_Project_Context.md:1232-1259](file://Pujo_Sahayak_Master_Project_Context.md#L1232-L1259)
- [todo.md:14](file://tasks/todo.md#L14)

**Section sources**
- [Pujo_Sahayak_Master_Project_Context.md:1232-1259](file://Pujo_Sahayak_Master_Project_Context.md#L1232-L1259)
- [todo.md:14](file://tasks/todo.md#L14)

### Form Handling and Validation
Form handling for Create Meetup should:
- Validate required fields (title, date, time, location)
- Enforce maximum participants
- Ensure interests are selected
- Handle public vs restricted visibility
- Provide clear error messages and inline feedback

Validation flow:
```mermaid
flowchart TD
Input["User Input"] --> CheckRequired["Check Required Fields"]
CheckRequired --> CheckLimits["Check Max Participants"]
CheckLimits --> CheckInterests["Check Interest Chips"]
CheckInterests --> CheckVisibility["Check Visibility Setting"]
CheckVisibility --> Valid{"All Valid?"}
Valid --> |No| ErrorFeedback["Show Inline Errors"]
Valid --> |Yes| SubmitForm["Submit Form"]
```

**Diagram sources**
- [Pujo_Sahayak_Master_Project_Context.md:703-727](file://Pujo_Sahayak_Master_Project_Context.md#L703-L727)
- [todo.md:53-54](file://tasks/todo.md#L53-L54)

**Section sources**
- [Pujo_Sahayak_Master_Project_Context.md:703-727](file://Pujo_Sahayak_Master_Project_Context.md#L703-L727)
- [todo.md:53-54](file://tasks/todo.md#L53-L54)

### Real-Time Communication Patterns
Recommended patterns:
- Optimistic updates for join actions
- Event-driven store updates
- Debounced UI refreshes
- Fallback polling if WebSocket or server-sent events are unavailable
- Clear error states for failed operations

```mermaid
sequenceDiagram
participant Client as "Client"
participant Store as "Zustand Store"
participant Channel as "Real-Time Channel"
Client->>Store : Optimistic join
Store-->>Client : Immediate UI update
Client->>Channel : Emit join event
Channel-->>Store : Broadcast updated attendees
Store-->>Client : Sync final state
```

**Diagram sources**
- [plan.md:12](file://tasks/plan.md#L12)
- [todo.md:53-54](file://tasks/todo.md#L53-L54)

**Section sources**
- [plan.md:12](file://tasks/plan.md#L12)
- [todo.md:53-54](file://tasks/todo.md#L53-L54)

## Dependency Analysis
The Meets feature depends on:
- React Router for navigation (`/meets`, `/meets/create`)
- Zustand with persist middleware for client state and localStorage
- Typed data model including `Meetup`
- Design system components (cards, chips, buttons, bottom nav)
- Location services for proximity calculations
- Safety and moderation controls for social interactions

```mermaid
graph TB
MeetsFeature["Meets Feature"] --> Router["React Router"]
MeetsFeature --> Store["Zustand + Persist"]
MeetsFeature --> DataModel["Typed Data Model"]
MeetsFeature --> UIComponents["Design System Components"]
MeetsFeature --> LocationService["Location Services"]
MeetsFeature --> SafetyModeration["Safety & Moderation"]
```

**Diagram sources**
- [plan.md:12](file://tasks/plan.md#L12)
- [plan.md:19-39](file://tasks/plan.md#L19-L39)
- [todo.md:53-54](file://tasks/todo.md#L53-L54)

**Section sources**
- [plan.md:12](file://tasks/plan.md#L12)
- [plan.md:19-39](file://tasks/plan.md#L19-L39)
- [todo.md:53-54](file://tasks/todo.md#L53-L54)

## Performance Considerations
- Use optimistic UI updates to improve perceived responsiveness during join actions
- Debounce location updates and filter recalculations to reduce re-renders
- Paginate or virtualize large meetup lists
- Cache nearby results based on current location and time window
- Avoid heavy computations on the main thread; offload distance sorting to workers if needed
- Keep real-time payloads minimal and focused on essential state changes

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Join action does not persist: verify Zustand store updates and localStorage persistence
- Nearby filter returns no results: check location permissions and coordinate accuracy
- Interest matching yields irrelevant results: review tagging strategy and scoring weights
- Real-time updates not reflected: confirm channel connectivity and fallback polling
- Form submission fails: validate field constraints and provide clear error messages

**Section sources**
- [todo.md:53-54](file://tasks/todo.md#L53-L54)
- [plan.md:12](file://tasks/plan.md#L12)

## Conclusion
The Meets Page implementation provides a robust social discovery layer for Pujo Sahayak, enabling users to browse, create, and join community meetups aligned with shared interests and geographic proximity. The feature integrates with the app’s routing, state management, data model, and design system while emphasizing safety, moderation, and performance. As the platform grows beyond the Puja season, the Meets feature will continue to support local discovery, community engagement, and activity-based social connections.

[No sources needed since this section summarizes without analyzing specific files]