# Participant Management and RSVP System

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
10. [Appendices](#appendices)

## Introduction
This document describes the Participant Management and RSVP System for Pujo Sahayak’s Meets feature. It explains how users discover meetups, join them, manage their attendance, and handle cancellations. It also outlines the organizer experience for managing attendees, sending announcements, and tracking participation metrics. The system is designed to be safe, transparent, and community-oriented, with clear boundaries between discovery, planning, social interaction, and safety.

The scope includes:
- User journey from discovering a meetup to joining and managing attendance
- RSVP workflow including confirmation notifications, participant limits, and waitlist behavior when capacity is reached
- Organizer dashboard capabilities for attendee management, announcements, and participation metrics
- Real-time update mechanisms for participant counts, status changes, and communication channels
- Safety features such as user verification, reporting/blocking, moderation, and emergency access
- Data models for participant relationships, attendance tracking, and communication logs

## Project Structure
At this stage, the repository contains product context and implementation plans rather than source code. The relevant information for the Participant Management and RSVP System comes from:
- Master product context describing the Meets page, create-meetup flow, participant controls, safety requirements, and data model
- Implementation plan defining routes, state storage, and screen responsibilities
- Task list detailing the Meets and Create Meetup screens, including maximum participants and local join/create behavior

```mermaid
graph TB
A["Master Product Context<br/>Meets, Safety, Data Model"] --> B["Implementation Plan<br/>Routes, State, Screens"]
B --> C["Task List<br/>Meets + Create Meetup Tasks"]
C --> D["Participant Management & RSVP System"]
```

**Diagram sources**
- [Pujo_Sahayak_Master_Project_Context.md:664-773](file://Pujo_Sahayak_Master_Project_Context.md#L664-L773)
- [plan.md:19-39](file://tasks/plan.md#L19-L39)
- [todo.md:53-55](file://tasks/todo.md#L53-L55)

**Section sources**
- [Pujo_Sahayak_Master_Project_Context.md:664-773](file://Pujo_Sahayak_Master_Project_Context.md#L664-L773)
- [plan.md:19-39](file://tasks/plan.md#L19-L39)
- [todo.md:53-55](file://tasks/todo.md#L53-L55)

## Core Components
The Participant Management and RSVP System centers on these components:
- Meetup entity and metadata (title, date, time, location, description, interests, maximum participants, public/restricted)
- Participant relationship (user, meetup, status, timestamps)
- Attendance tracking (confirmed, waiting, cancelled, no-show)
- Organizer role and permissions (manage attendees, send announcements, view metrics)
- Notifications and communications (confirmation, reminders, updates, announcements)
- Safety and moderation (report/block, host info, public meeting locations, age restrictions where appropriate, emergency access)
- Real-time updates (participant count, status changes, communication channel events)

These components are grounded in the product context’s Meets design, the create-meetup form fields, and the safety requirements for meetups.

**Section sources**
- [Pujo_Sahayak_Master_Project_Context.md:664-773](file://Pujo_Sahayak_Master_Project_Context.md#L664-L773)
- [Pujo_Sahayak_Master_Project_Context.md:1232-1255](file://Pujo_Sahayak_Master_Project_Context.md#L1232-L1255)
- [Pujo_Sahayak_Master_Project_Context.md:1441-1455](file://Pujo_Sahayak_Master_Project_Context.md#L1441-L1455)
- [todo.md:53-55](file://tasks/todo.md#L53-L55)

## Architecture Overview
The RSVP system integrates discovery, planning, social interaction, and safety into one cohesive flow. Users discover meetups through the Meets page or from place detail pages; they can join free or paid meetups; organizers manage attendees and communicate updates; safety tools protect participants.

```mermaid
graph TB
subgraph "User"
U1["Discover Meetups"]
U2["Join / RSVP"]
U3["Manage Attendance"]
U4["Cancel / No-show"]
end
subgraph "System"
S1["Meetup Catalog"]
S2["RSVP Engine"]
S3["Participant Store"]
S4["Notifications"]
S5["Real-time Updates"]
S6["Safety & Moderation"]
end
subgraph "Organizer"
O1["Attendee Management"]
O2["Announcements"]
O3["Participation Metrics"]
end
U1 --> S1
U2 --> S2
S2 --> S3
S2 --> S4
S3 --> S5
S5 --> U3
S5 --> O1
O1 --> S3
O2 --> S4
O3 --> S3
S6 --> U2
S6 --> O1
```

**Diagram sources**
- [Pujo_Sahayak_Master_Project_Context.md:664-773](file://Pujo_Sahayak_Master_Project_Context.md#L664-L773)
- [Pujo_Sahayak_Master_Project_Context.md:1441-1455](file://Pujo_Sahayak_Master_Project_Context.md#L1441-L1455)
- [todo.md:53-55](file://tasks/todo.md#L53-L55)

## Detailed Component Analysis

### User Journey: Discover to Join
Users discover meetups via:
- Meets page cards showing name, date/time, location, distance, participant avatars/count, and Join action
- Pandal detail page “Meetups near this place” section
- Interest-based filtering (All/Nearby/My Interests)

Joining a meetup involves:
- Validating user eligibility (free/paid/premium-only)
- Enforcing participant limits
- Confirming RSVP and updating participant count
- Sending confirmation notification
- Adding user to waitlist if capacity is reached

```mermaid
sequenceDiagram
participant User as "User"
participant MeetsPage as "Meets Page"
participant RSVP as "RSVP Engine"
participant Store as "Participant Store"
participant Notify as "Notifications"
User->>MeetsPage : View meetup card
MeetsPage->>RSVP : Request join(meetupId, userId)
RSVP->>Store : Check capacity and status
alt Capacity available
Store-->>RSVP : Slot available
RSVP->>Store : Add participant confirmed
Store-->>RSVP : Success
RSVP->>Notify : Send confirmation
Notify-->>User : Confirmation received
else Capacity full
Store-->>RSVP : Waitlist position assigned
RSVP->>Notify : Send waitlist notification
Notify-->>User : Waitlisted
end
```

**Diagram sources**
- [Pujo_Sahayak_Master_Project_Context.md:664-773](file://Pujo_Sahayak_Master_Project_Context.md#L664-L773)
- [todo.md:53-55](file://tasks/todo.md#L53-L55)

**Section sources**
- [Pujo_Sahayak_Master_Project_Context.md:664-773](file://Pujo_Sahayak_Master_Project_Context.md#L664-L773)
- [todo.md:53-55](file://tasks/todo.md#L53-L55)

### RSVP Workflow: Confirmation, Limits, and Waitlist
The RSVP workflow enforces:
- Participant limit validation
- Status transitions (pending → confirmed/waitlisted)
- Confirmation notifications upon successful RSVP
- Waitlist assignment when capacity is reached
- Automatic promotion from waitlist to confirmed if a spot opens

```mermaid
flowchart TD
Start(["RSVP Request"]) --> Validate["Validate Eligibility<br/>Free/Paid/Premium-only"]
Validate --> CapacityCheck{"Capacity Available?"}
CapacityCheck --> |Yes| Confirm["Add Confirmed Participant"]
CapacityCheck --> |No| Waitlist["Assign Waitlist Position"]
Confirm --> NotifyConfirm["Send Confirmation Notification"]
Waitlist --> NotifyWait["Send Waitlist Notification"]
NotifyConfirm --> End(["Complete"])
NotifyWait --> End
```

**Diagram sources**
- [Pujo_Sahayak_Master_Project_Context.md:703-728](file://Pujo_Sahayak_Master_Project_Context.md#L703-L728)
- [todo.md:53-55](file://tasks/todo.md#L53-L55)

**Section sources**
- [Pujo_Sahayak_Master_Project_Context.md:703-728](file://Pujo_Sahayak_Master_Project_Context.md#L703-L728)
- [todo.md:53-55](file://tasks/todo.md#L53-L55)

### Organizer Dashboard: Attendees, Announcements, Metrics
Organizers can:
- Manage attendees (confirm, remove, promote from waitlist)
- Send announcements to all participants
- Track participation metrics (join rate, cancellation rate, attendance rate)
- Control visibility and permissions (public/restricted, location visibility)

```mermaid
classDiagram
class Organizer {
+manageAttendees()
+sendAnnouncement(message)
+viewMetrics()
+updateVisibility()
}
class Meetup {
+id
+title
+date
+time
+location
+maxParticipants
+status
}
class Participant {
+userId
+meetupId
+status
+joinedAt
+cancelledAt
}
class Announcement {
+message
+sentAt
+recipients
}
Organizer --> Meetup : "manages"
Organizer --> Announcement : "sends"
Meetup --> Participant : "has many"
```

**Diagram sources**
- [Pujo_Sahayak_Master_Project_Context.md:1441-1455](file://Pujo_Sahayak_Master_Project_Context.md#L1441-L1455)
- [todo.md:53-55](file://tasks/todo.md#L53-L55)

**Section sources**
- [Pujo_Sahayak_Master_Project_Context.md:1441-1455](file://Pujo_Sahayak_Master_Project_Context.md#L1441-L1455)
- [todo.md:53-55](file://tasks/todo.md#L53-L55)

### Real-time Update Mechanisms
Real-time updates ensure:
- Participant counts reflect current confirmed and waitlisted numbers
- Status changes propagate to both users and organizers
- Communication channels deliver timely announcements and reminders

```mermaid
sequenceDiagram
participant UI as "UI"
participant WS as "WebSocket / Event Stream"
participant Store as "Participant Store"
participant Notify as "Notifications"
Store-->>WS : Emit "participantCountUpdated"
WS-->>UI : Push updated count
Store-->>WS : Emit "participantStatusChanged"
WS-->>UI : Push status change
Notify-->>WS : Emit "announcementSent"
WS-->>UI : Push announcement
```

[No sources needed since this diagram shows conceptual real-time flow]

### Safety Features: Verification, Reporting, Moderation
Safety measures include:
- Host information visibility
- Public meeting locations
- Report/block functionality
- Moderation controls
- Optional age restrictions
- Emergency access

```mermaid
flowchart TD
A["User Reports Issue"] --> B["Moderation Queue"]
B --> C{"Review Decision"}
C --> |Action Required| D["Warn / Restrict / Remove"]
C --> |No Action| E["Close Case"]
D --> F["Notify Affected Parties"]
E --> G["Log Outcome"]
```

**Diagram sources**
- [Pujo_Sahayak_Master_Project_Context.md:1441-1455](file://Pujo_Sahayak_Master_Project_Context.md#L1441-L1455)

**Section sources**
- [Pujo_Sahayak_Master_Project_Context.md:1441-1455](file://Pujo_Sahayak_Master_Project_Context.md#L1441-L1455)

### Data Models: Participants, Attendance, Communications
Core entities and relationships:
- User
- Meetup
- Participant (relationship between User and Meetup with status and timestamps)
- Announcement (communication log)
- SafetyReport (moderation record)

```mermaid
erDiagram
USER {
uuid id PK
string name
string phone
boolean verified
datetime createdAt
}
MEETUP {
uuid id PK
string title
datetime date
datetime time
string location
int maxParticipants
enum status
datetime createdAt
}
PARTICIPANT {
uuid id PK
uuid user_id FK
uuid meetup_id FK
enum status
datetime joined_at
datetime cancelled_at
}
ANNOUNCEMENT {
uuid id PK
uuid meetup_id FK
text message
datetime sent_at
}
SAFETY_REPORT {
uuid id PK
uuid reporter_id FK
uuid target_id FK
enum type
text details
enum resolution
datetime createdAt
}
USER ||--o{ PARTICIPANT : "joins"
MEETUP ||--o{ PARTICIPANT : "has"
MEETUP ||--o{ ANNOUNCEMENT : "receives"
USER ||--o{ SAFETY_REPORT : "submits"
```

**Diagram sources**
- [Pujo_Sahayak_Master_Project_Context.md:1232-1255](file://Pujo_Sahayak_Master_Project_Context.md#L1232-L1255)
- [Pujo_Sahayak_Master_Project_Context.md:1441-1455](file://Pujo_Sahayak_Master_Project_Context.md#L1441-L1455)

**Section sources**
- [Pujo_Sahayak_Master_Project_Context.md:1232-1255](file://Pujo_Sahayak_Master_Project_Context.md#L1232-L1255)
- [Pujo_Sahayak_Master_Project_Context.md:1441-1455](file://Pujo_Sahayak_Master_Project_Context.md#L1441-L1455)

## Dependency Analysis
The RSVP system depends on:
- Meets catalog and filters (discovery)
- Participant store (state persistence)
- Notifications service (confirmation and announcements)
- Safety and moderation tools (report/block, host info, emergency access)
- Real-time event stream (count/status updates)

```mermaid
graph LR
Discovery["Discovery Layer"] --> RSVP["RSVP Engine"]
RSVP --> Store["Participant Store"]
Store --> Realtime["Real-time Updates"]
RSVP --> Notify["Notifications"]
Safety["Safety & Moderation"] --> RSVP
Organizer["Organizer Tools"] --> Store
Organizer --> Notify
```

**Diagram sources**
- [plan.md:19-39](file://tasks/plan.md#L19-L39)
- [todo.md:53-55](file://tasks/todo.md#L53-L55)
- [Pujo_Sahayak_Master_Project_Context.md:1441-1455](file://Pujo_Sahayak_Master_Project_Context.md#L1441-L1455)

**Section sources**
- [plan.md:19-39](file://tasks/plan.md#L19-L39)
- [todo.md:53-55](file://tasks/todo.md#L53-L55)
- [Pujo_Sahayak_Master_Project_Context.md:1441-1455](file://Pujo_Sahayak_Master_Project_Context.md#L1441-L1455)

## Performance Considerations
- Keep participant count updates lightweight by batching events and debouncing UI re-renders
- Use optimistic UI for join actions to improve perceived responsiveness
- Cache meetup metadata locally to reduce network calls during RSVP
- Limit real-time payload size by sending only necessary fields (status, count, timestamp)
- Implement server-side throttling for announcements to prevent notification storms

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- RSVP fails due to capacity: check waitlist logic and notify user appropriately
- Participant count not updating: verify real-time event emission and subscription handling
- Announcement not delivered: confirm recipient list and notification queue processing
- Safety report unresolved: review moderation queue and escalation paths
- Organizer cannot manage attendees: validate permissions and role checks

**Section sources**
- [Pujo_Sahayak_Master_Project_Context.md:1441-1455](file://Pujo_Sahayak_Master_Project_Context.md#L1441-L1455)
- [todo.md:53-55](file://tasks/todo.md#L53-L55)

## Conclusion
The Participant Management and RSVP System for Pujo Sahayak integrates discovery, RSVP, attendance tracking, organizer tools, real-time updates, and safety features into a cohesive platform. It supports free, paid, and premium-only meetups while enforcing participant limits and providing waitlist management. Organizers gain control over attendees, announcements, and metrics, and users benefit from transparent status updates and robust safety mechanisms. The data model ensures clear relationships between users, meetups, participants, announcements, and safety reports, enabling scalable growth beyond the Puja season.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Key Requirements Summary
- Meets page with discoverability and join actions
- Create meetup form with maximum participants and visibility settings
- RSVP enforcement with confirmation and waitlist
- Organizer tools for attendee management, announcements, and metrics
- Safety features including report/block, host info, public locations, and emergency access
- Real-time updates for counts, statuses, and communications

**Section sources**
- [Pujo_Sahayak_Master_Project_Context.md:664-773](file://Pujo_Sahayak_Master_Project_Context.md#L664-L773)
- [Pujo_Sahayak_Master_Project_Context.md:1441-1455](file://Pujo_Sahayak_Master_Project_Context.md#L1441-L1455)
- [todo.md:53-55](file://tasks/todo.md#L53-L55)