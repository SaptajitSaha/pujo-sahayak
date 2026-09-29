# Pujo Sahayak — Master Product Context for Qwen

## Project Name

**Pujo Sahayak**

This is a modern web application/PWA designed primarily around the Durga Puja experience in Kolkata, but intentionally designed so that it remains useful beyond the Puja season.

The product combines:

**Pandal discovery + local place discovery + AI assistance + route planning + social meetups + safety + user-generated content + personalization + monetization.**

The application should feel like a **digital companion for exploring Kolkata during Puja**, rather than a conventional directory or generic AI chatbot.

The core idea is:

> Help people discover where to go, understand what they are seeing, decide what to do next, connect with people, and stay informed and safe while travelling around the city.

---

# 1. Core Product Philosophy

The product should not be treated as a collection of unrelated features.

Everything should revolve around one user journey:

```text
Discover
   ↓
Explore
   ↓
Understand
   ↓
Plan
   ↓
Visit
   ↓
Share / Review
   ↓
Meet people
   ↓
Discover something else
```

For example:

A user discovers a pandal.

They open it.

They learn about its theme.

They see what other people posted.

They check restaurants nearby.

They save the place.

They add it to a Puja plan.

They potentially join a meetup.

They visit it.

They mark it visited.

They upload photographs.

They review it.

Then the app recommends another nearby place.

This creates a continuous ecosystem instead of a single-purpose app.

---

# 2. Main Value Proposition

The application should combine several things that normally require different platforms.

### Discovery
Find pandals, restaurants, events and useful places.

### Intelligence
Ask the AI assistant questions about what you are seeing or what you want to do.

### Planning
Create a multi-stop Puja plan.

### Community
Find meetups and people with similar interests.

### Utility
Get transport, emergency and nearby-service information.

### Memory
Save places, visited places, photographs and experiences.

### Continuity
Remain useful outside the Durga Puja season through restaurants, events, local activities, offers and other discovery features.

---

# 3. Important: This Is Not Only a Puja App

The application has a **seasonal core but a broader local-discovery ecosystem**.

Durga Puja is the strongest initial use case because it naturally creates:

- massive movement of people
- pandal exploration
- restaurants and food discovery
- transportation requirements
- events
- meetups
- shopping
- local experiences
- safety requirements
- content generation
- route planning

But the overall platform should eventually support discovery of other local experiences.

Think conceptually about:

```text
Place
├── Pandal
├── Restaurant
├── Event
├── Attraction
├── Service
└── Other local experience
```

Pandal is simply the most important category during Puja.

---

# 4. Primary Navigation

The current handwritten UI suggests the following primary navigation:

```text
Home
Favorites
Search
Categories
Meets
```

Keep this structure unless a later design decision explicitly changes it.

The navigation should remain simple and mobile-first.

The AI assistant should be accessible prominently through the UI rather than necessarily taking one of the five permanent navigation slots.

---

# 5. Home Page

The Home page is the main discovery surface.

It should not only show pandals.

It should dynamically present what is relevant to the user.

## A. Advertisements / Sponsored Spotlight

There is a concept for an advertising/spotlight area near the top.

Example:

```text
Sponsored

[ Image / Video ]

Brand / Event
Short description

[ Explore ]
```

This should visually be a **native sponsored card**, not an intrusive banner.

The UI must clearly distinguish sponsored content from organic recommendations.

## B. Explore Spotlight

A larger editorial-style feature section containing:

- pictures
- videos
- name
- short description

This can spotlight a:

- pandal
- restaurant
- event
- local experience

During Puja, pandals should dominate.

Outside Puja, the same component can promote other local experiences.

## C. Restaurants

The Home page should include a restaurant discovery section.

Cards can show:

```text
Image
Restaurant name
Rating
Distance
Cuisine / category
```

Potentially:

```text
Open now
₹₹
Nearby
```

The purpose is not to turn Pujo Sahayak into a food-delivery platform.

Restaurants are part of the **pandal-hopping/local exploration ecosystem**.

## D. Offers & Discounts

The latest sketches introduce an offers/discount section.

This may contain:

- sponsor offers
- local business offers
- Puja-related discounts
- partner promotions

The UI should avoid making the app look like a coupon website.

## E. Shopping

The current sketch marks this as **"Shopping (Not Sure)"**, so treat it as a proposed feature, not a locked requirement.

The current idea is to show trending Puja-related wearables/products and possibly what users are buying during the festival.

Possible examples:

- Puja clothing
- accessories
- traditional wear
- decorations
- festival merchandise

Do not make this a generic e-commerce marketplace unless this direction is explicitly finalized.

Current status:

**Concept under consideration.**

## F. Events / Local Experiences

To keep the application useful beyond the core pandal experience, the Home page may include:

- local events
- jamming sessions
- play zones
- local activities
- academies/classes or similar local experiences

The exact categories will be finalized later.

The principle is:

> Even after Puja is over, users should still have reasons to open the app.

---

# 6. Continue Where You Left Off

This is an important retention feature from the sketches.

The user should be able to return to the exact type of exploration they were doing.

Example:

```text
Continue where you left off

You were exploring:
South Kolkata Pandals

Last viewed:
Deshapriya Park

[ Continue Exploring ]
```

It can also remember:

- an unfinished route
- an unfinished search
- a partially explored category
- a saved restaurant
- a meetup discovery session

The objective is continuity.

Do not force users to start from the Home page every time.

---

# 7. Favorites Page

The Favorites page is more than a simple bookmark list.

It should have several sections.

### Saved Pandals
Places explicitly saved by the user.

### Places You've Been
Previously visited places.

This may include:

- pandals
- restaurants
- events
- other places

### You Might Like
Recommendation section based on:

- saved places
- visited places
- location
- categories
- preferences
- potentially AI recommendations

Use wording such as **"You might like"** rather than making absolute claims about what the user will enjoy.

---

# 8. Puja Planner

There is now a clear premium concept for planning.

The user should be able to construct a detailed multi-day Puja itinerary.

Potential scope:

```text
Panchami
Shashthi
Saptami
Ashtami
Navami
Dashami
```

A plan can contain:

- pandals
- restaurants
- events
- local attractions
- transportation/travel segments
- approximate timings

Example:

```text
Saptami

6:00 PM
Pandal A

7:00 PM
Pandal B

8:15 PM
Dinner

9:30 PM
Pandal C

11:00 PM
Return
```

The planner can later become an AI-assisted planning experience.

---

# 9. AI-Based Planning

The user should eventually be able to say something like:

> "I want to cover South Kolkata on Saptami, avoid very crowded places and have dinner around 9."

The system can propose a plan based on:

- location
- distance
- operating hours
- crowd information
- preferences
- saved places
- available events

Generated plans must be presented as **suggestions**, not guaranteed optimal routes.

---

# 10. Premium Planning

The sketch identifies detailed itinerary planning as a potential **premium feature**.

Possible model:

### Free
Basic discovery, saved places, normal exploration.

### Premium
More advanced features such as:

- multi-day itinerary planning
- AI-assisted planning
- potentially advanced recommendations
- potentially advanced meetup capabilities

The exact premium feature list is **not yet final**.

Do not hard-code a large subscription system around assumptions.

---

# 11. Search Page

The Search experience should cover the entire local ecosystem.

At the top:

```text
Search

[ Search pandals, restaurants, events... ]
```

Category shortcuts:

```text
All
Pandals
Restaurants
Events
Places
```

## Trending Pandals

Display currently popular/trending pandals.

Do not manufacture rankings unless the underlying metric exists.

"Trending" could be based on:

- views
- saves
- recent interactions
- visits
- engagement

The exact algorithm can come later.

## Popular Nearby Places

Use location context to show nearby options.

The principle:

> Help the user discover what is around them.

---

# 12. Categories Page

This is a structured discovery hub.

The current design groups categories into three broad groups.

## Places

```text
Pandals
Restaurants
Places
```

Potential future additions:

```text
Attractions
Events
Shopping
```

## Transport & Services

```text
Metro
Bus
Parking
```

Potential future additions:

```text
Cab / ride information
Fuel
Charging
```

Only add services where useful and supported by reliable data.

## Utilities

The sketch includes:

```text
Police Station
Hospital
ATM
Pharmacy
```

Potential additions:

```text
Medical camp
Toilet
Help desk
Drinking water
Parking
```

---

# 13. Ask Maya

The latest UI sketches explicitly call the AI assistant:

# **Maya**

The product is:

**Pujo Sahayak**

The assistant is:

**Maya**

Do not rename this in the implementation unless instructed otherwise.

The assistant should be accessible from the Categories experience and ideally also through a persistent, obvious action.

---

# 14. What Maya Does

Maya should not be a generic chatbot.

The assistant should understand the application's data and context.

Examples:

```text
What is the theme of this pandal?

What does this theme mean?

Where is the nearest metro?

Where can I eat nearby?

Which pandals are less crowded?

What can I visit after this?

Where is the nearest hospital?

Help me plan my evening.
```

Answers should be grounded in application data.

---

# 15. Maya + Pandal Camera

The original project concept remains important.

The user can point their camera toward a pandal.

System flow:

```text
Camera
 ↓
Visual embedding
 ↓
Compare against known pandal images
 ↓
Identify likely pandal
 ↓
Retrieve corresponding information
 ↓
Maya explains it
```

This is one of the flagship technical features.

Maya should be able to explain:

- theme
- story
- symbolism
- artist information
- relevant facts
- visit information

---

# 16. Maya Should Know User Context

Potential context:

```text
Current location
Current pandal / selected place
Saved locations
Current trip
Selected language
Relevant category
```

If the user opens Maya from a pandal page, the assistant should already know that pandal.

If the user opens Maya from a restaurant, it should understand that context.

This is much more useful than making the user repeat everything.

---

# 17. Meets Page

The new sketches introduce a complete social layer.

The page is called:

# Meets

Goal:

> Help people find or organize meetups around shared interests and plans.

## Existing Meetups

Cards can contain:

```text
Meetup name
Date
Time
Location
Participants
Short description
```

Examples:

```text
South Kolkata Pandal Hop
Saturday • 7 PM

Photography Walk
Sunday • 5 PM

Late-night Puja Food Crawl
```

---

# 18. Create Your Own Meetup

Flow:

```text
Create Meetup

Title
Date
Time
Location
Description
Interest / vibe
Maximum participants
Public / restricted
```

Potentially:

```text
Select pandals
Select restaurants
Select route
```

---

# 19. Find People Your Vibe

Users can find people based on shared interests such as:

```text
Photography
Pandal hopping
Food
Music
Art
Night exploration
Heritage
Family-friendly exploration
```

Do not make this feel like a dating application.

The product context is:

**activity-based social discovery.**

---

# 20. Meetup Monetization

The sketch proposes something like:

> First meetup free, later paid.

Meetups are also identified as potentially premium.

Treat this as a **business-model concept**, not a finalized pricing rule.

The implementation should therefore support conceptually:

```text
Free meetup
Paid meetup
Premium-only meetup
```

without hard-coding one pricing model.

---

# 21. Pandal Detail Page

The latest sketch significantly expands the detail page.

When a user clicks a pandal, they should enter a rich content page.

## Hero Section

```text
[Large image/video]

Pandal name
Location
Save / Bookmark
```

## Past Editions

A section such as:

### Previous Editions

or

### Past Editions

showing:

- photographs
- videos
- previous themes

This communicates the history/evolution of a Puja committee.

---

# 22. What Others Say

A community section showing user reviews/opinions.

```text
What others say

★★★★★
"This year's theme..."

★★★★★
"The lighting..."
```

These must be actual user-generated reviews.

Do not generate fake reviews through AI.

---

# 23. Top Clicks

The sketch introduces:

### Top Clicks

This means visually popular photographs contributed by actual users.

It can become a community-curated photo section.

Example:

```text
Top Clicks

[Photo] [Photo] [Photo]

Posted by visitors
```

---

# 24. User Photo Uploads

There is a clear:

### Post Your Photos +

button.

Visitors can upload their own photographs of the pandal.

The concept is that AI verifies that the uploaded image is actually related to the relevant pandal.

This is an important moderation mechanism.

---

# 25. AI Photo Verification

Intended workflow:

```text
User uploads photo
        ↓
Image verification
        ↓
Does this actually depict this pandal?
        ↓
Yes → allow
No → reject / ask user to select another image
```

AI should assist moderation rather than making irreversible assumptions.

Also maintain normal moderation controls for:

- spam
- inappropriate content
- copyrighted/promotional material
- unrelated photographs

---

# 26. Similar Places

The detail page should recommend:

### View Similar Places

Similarity can mean:

- same theme
- same area
- similar architecture
- similar popularity
- similar experience

The recommendation system can start simple.

---

# 27. Nearby Restaurants

Every major place page can connect naturally to nearby restaurants.

Example:

```text
Hungry after visiting?

Nearby Restaurants

Restaurant A
Restaurant B
Restaurant C

[ View all ]
```

This connects pandal discovery to the broader local ecosystem.

---

# 28. Meetups From Pandal Page

The detail page can contain:

### Meetups near this place

Example:

```text
Pandal Hop • 7 PM
Photography Walk • 8 PM

[ Join / View ]
```

This connects the individual place to the community system.

---

# 29. Profile Page

Profile becomes the user's personal control center.

Top:

```text
Profile

[Profile picture]

Name
Phone
Subscription
```

Then:

### Become a Premium Member

This is the main subscription CTA.

---

# 30. All Visits

The profile tracks activity types.

Potential tabs:

```text
Pandals
Restaurants
Meetups
...
```

This creates a unified activity history.

---

# 31. Emergency Shortcuts

The profile sketch contains shortcuts for:

```text
Ambulance
Police
Women
Child
...
```

These should lead to the Emergency Center or initiate appropriate actions.

Emergency functionality should not be buried deep inside settings.

---

# 32. Payments

The profile leads into a payments section.

The current sketch contains:

```text
Bill Payments
Wallet
Payment Method
Donate to India
Donate
```

This is currently part of the broader product concept.

Do not build a full wallet/payment ecosystem just because the sketch contains it unless the business model actually requires one.

The architecture should leave room for it, but the initial product can keep payment functionality focused on relevant transactions such as:

- premium subscription
- authorized meetup payments
- partner services
- donations
- potentially other verified purchases

---

# 33. Charity / Social Impact

The sketch suggests that part of the platform's margin may be donated to a charitable cause, particularly during the Puja period.

Treat this as:

**a proposed social-impact/business-model layer.**

The exact beneficiary, percentage, schedule and verification mechanism are not finalized.

Do not invent one.

---

# 34. Personalization

Profile/settings should include:

### Appearance

Potentially:

- light mode
- dark mode
- system default
- reduced motion

### App Logo

The sketch explicitly includes customization of the app logo.

Treat this as a playful personalization feature rather than something that changes the brand identity completely.

---

# 35. Account

Standard:

```text
Account
Privacy
Security
Notifications
Language
Permissions
```

The application handles location, photographs and potentially meetup information, so privacy controls should be easy to find.

---

# 36. Off-Season Strategy

The team does not want Pujo Sahayak to become irrelevant immediately after Durga Puja.

Therefore the platform should transition from:

### Puja Discovery

to:

### Kolkata Local Discovery

The same underlying structure remains:

```text
Discover places
Discover events
Discover restaurants
Meet people
Find activities
Get recommendations
```

During Puja, dominant content:

```text
Pandals
Puja events
Puja restaurants
Puja shopping
Puja meetups
```

After Puja:

```text
Restaurants
Events
Music
Local activities
Play zones
Classes / academies
Community meetups
Local experiences
Offers
```

This should happen naturally.

---

# 37. The Product Should Feel Alive

The Home page can change based on:

```text
Season
Time
Location
User activity
Current events
```

During Puja:

```text
Explore Pandals
Tonight's Popular Spots
Nearby Restaurants
Puja Offers
Meetups
```

After Puja:

```text
Events Near You
Restaurants
Weekend Activities
Jamming Sessions
Meetups
Local Experiences
```

This is how the product avoids becoming a one-week hackathon application.

---

# 38. Core User Types

### Tourist / Outsider

Doesn't know Kolkata well.

Needs:

- discovery
- explanations
- routes
- restaurants
- safety
- language assistance

### Local Pandal-Hopper

Already knows some places.

Needs:

- trending places
- planning
- crowd information
- social discovery
- recommendations

### Social Explorer

Interested in:

- meetups
- photography
- events
- food
- community

### Regular Local User

Primarily uses:

- restaurants
- events
- meetups
- services
- local discovery

This explains why the platform can survive outside Puja.

---

# 39. Product Data Model

Do not build everything around one `Pandal` entity.

Think more broadly:

```text
User
Place
Pandal
Restaurant
Event
Meetup
Review
Photo
Trip
Category
Offer
Subscription
Payment
SafetyPoint
EmergencyReport
Recommendation
```

A Pandal can be a specialized type of Place.

This will make the off-season expansion much easier.

---

# 40. Recommendation Engine

The product can eventually use:

```text
Location
+
Previous visits
+
Favorites
+
Search activity
+
Categories
+
Time
+
Season
+
Crowd
+
Social activity
```

to generate recommendations.

Example:

> "You liked two traditional pandals. You might also like these nearby heritage-style places."

Keep recommendation explanations understandable.

---

# 41. AI Should Not Control the Entire App

Do not make every feature "AI powered".

Normal software is enough for:

```text
Favorites → database
Visits → database
Search → indexing/filtering
Maps → geospatial data
Payments → payment provider
Meetups → database + business rules
Reviews → database + moderation
Categories → structured metadata
```

AI should be used where it actually provides value:

```text
Pandal identification
Photo verification
Natural-language assistant
Multilingual explanation
Voice interaction
Recommendations
Itinerary assistance
```

This makes the product more credible.

---

# 42. AI Knowledge Principle

Maya must **not hallucinate pandal facts**.

For pandal-related questions:

```text
User question
 ↓
Retrieve verified place data
 ↓
LLM generates natural response
```

If information is unavailable:

> "I don't have verified information about that yet."

Never invent:

- artist
- historical facts
- timings
- emergency numbers
- crowd status
- committee information
- donation information

---

# 43. Location Principle

Location should be used intelligently.

Possible flow:

```text
GPS
 ↓
Nearby places
 ↓
Possible current context
 ↓
User confirmation / visual identification
```

Do not blindly claim:

> "You are inside Pandal X."

GPS in dense urban environments is not precise enough to guarantee that.

Use wording such as:

> "You're near..."

when appropriate.

---

# 44. Safety System

Safety functionality remains part of the broader product.

The application should support:

```text
Emergency
Police
Ambulance
Women's assistance
Child assistance
Hospitals
Pharmacies
Help desks
Lost & Found
Missing person reports
```

Safety UI must prioritize **clarity and speed over visual effects**.

---

# 45. Missing Person System

Earlier concept remains part of the broader safety vision.

Architecture:

```text
Visitor
 ↓
Submit missing-person report
 ↓
Photo + basic details
 ↓
Location
 ↓
Nearest relevant help desk
 ↓
Authorized operator
 ↓
Resolution/update
```

Do not make sensitive missing-person information into a public social feed.

Exact authority integration is partner-dependent.

---

# 46. Meetups + Safety

Because the product introduces meeting strangers, the application should eventually have:

- meetup location visibility
- participant controls
- report/block
- host information
- public meeting locations
- moderation
- optional age restrictions where appropriate
- emergency access

Do not let the social system become an unmoderated stranger-meeting platform.

---

# 47. UI/UX Direction

The design should communicate:

**Modern Kolkata + Durga Puja + premium technology**

Not:

**Generic SaaS dashboard + red/gold festival decorations.**

The UI should feel:

- modern
- elegant
- editorial
- vibrant
- immersive
- youthful
- culturally rooted

while remaining highly functional.

---

# 48. Visual Language

Use Durga Puja as inspiration, not as a reason to put religious motifs everywhere.

Potential visual language:

```text
Deep vermilion
Warm ivory
Charcoal
Muted gold
Deep indigo
```

Use:

- subtle alpana-inspired patterns
- Bengali typography accents
- photography
- tasteful gradients
- subtle grain
- soft glow

Avoid over-decoration.

---

# 49. Motion System

Motion should communicate energy.

### Page transitions
Soft fade + slight movement.

### Cards
Very subtle scale on interaction.

### Camera scanner
Animated scan frame.

### Voice assistant
Reactive waveform.

### Recommendations
Smooth horizontal reveals.

### Puja atmosphere
Occasional subtle light/smoke effects.

The app should never become a motion showcase at the expense of usability.

---

# 50. Important Design Principle for Qwen

The handwritten sketches are **conceptual wireframes**, not literal pixel-perfect instructions.

Qwen should:

> Preserve the information architecture and intended feature placement, but redesign the UI professionally rather than copying the hand-drawn shapes.

For example, if the sketch shows a card, it means:

> There is a card-based content section containing these information elements.

It does not mean:

> Reproduce the exact rectangle.

The final UI should be polished and modern.

---

# 51. Responsive Design

The sketches are heavily mobile-oriented.

Therefore:

### Mobile
Primary design target.

### Desktop
Adapt the same system into:

- wider content layouts
- multi-column sections
- expanded map
- side panels
- richer exploration

Do not create completely separate UX concepts.

---

# 52. Do Not Turn the Home Page Into a Feed

There are many possible content types now.

That does **not** mean Home should become an endless social-media feed.

It should remain structured:

```text
Spotlight
↓
Nearby
↓
Restaurants
↓
Offers
↓
Events
↓
Recommendations
↓
Continue where you left off
```

The user should know why each section exists.

---

# 53. App Information Hierarchy

When opening the app, users should quickly understand:

```text
Where am I?
What's happening around me?
What can I explore?
What have I saved?
What can Maya help me with?
```

This should guide the entire UX.

---

# 54. What Must Remain Central

Despite the large number of features, the identity of Pujo Sahayak should still revolve around:

1. Pandal discovery
2. Understanding pandals through Maya
3. Planning
4. Local discovery
5. Community
6. Safety

Commercial and off-season systems should support these rather than overshadow them.

---

# 55. Feature Status

Qwen should treat features in three levels.

## Locked Core

```text
Home
Pandal discovery
Search
Categories
Pandal details
Favorites
Visited places
Maya AI assistant
Pandal image identification
Maps/location
Trip planning
Safety
Meetups
Reviews
User photos
Recommendations
Profile
```

## Designed but Still Evolving

```text
Offers
Restaurants
Events
Shopping
Off-season local activities
Premium subscription
Donation
Payment system
AI recommendations
```

## Experimental / Partner-Dependent

```text
VIP passes
Authority emergency integration
Real-time crowd infrastructure
Advanced missing-person authority integration
Marketplace
```

Qwen must not assume that every experimental feature needs a fully operational production implementation immediately.

---

# 56. What the Final Product Should Feel Like

Imagine someone opens Pujo Sahayak during Puja.

They see Kolkata.

They discover a nearby pandal.

They save it.

They ask Maya:

> "What is special about this place?"

Maya explains the story.

They see other people's photographs.

They discover a restaurant nearby.

They add both to a plan.

They notice a photography meetup.

They join it.

They visit the pandal.

They upload a photograph.

The app verifies it.

They mark the place as visited.

Later, the app remembers their exploration.

Then, weeks after Puja, the app still has:

> events, restaurants, activities, meetups and local experiences.

That is the product.

---

# 57. One-Sentence Technical Interpretation

For development purposes:

> **Pujo Sahayak is a location-aware local discovery platform with a specialized Durga Puja experience, powered by an AI assistant for visual identification, contextual Q&A, multilingual interaction and intelligent planning.**

---

# 58. Most Important Instruction to Qwen

Do **not** start treating this as:

> "Build a Durga Puja website."

Build it as a **real product** with a coherent ecosystem.

Do not create generic:

- AI dashboard UI
- oversized chatbot
- meaningless glassmorphism
- excessive gradients
- random festival decorations
- artificial statistics
- fake reviews
- fabricated crowd data
- fake integrations
- meaningless gamification

Every screen should have a clear user purpose.

---

# 59. Development Principle

When implementing a feature, ask:

> **Does this make discovering, planning, understanding, experiencing, or remembering a place better?**

If yes, it belongs.

If not, it should be questioned.

This is the filter that prevents the product from becoming feature soup.

---

# 60. Final Product Map

```text
PUJO SAHAYAK
│
├── HOME
│   ├── Sponsored Spotlight
│   ├── Explore Spotlight
│   ├── Restaurants
│   ├── Offers
│   ├── Shopping
│   ├── Events
│   ├── Local Experiences
│   └── Continue Where You Left Off
│
├── FAVORITES
│   ├── Saved Pandals
│   ├── Visited Places
│   ├── You Might Like
│   └── Puja Planner
│
├── SEARCH
│   ├── Pandals
│   ├── Restaurants
│   ├── Events
│   ├── Trending
│   └── Nearby
│
├── CATEGORIES
│   ├── Pandals
│   ├── Restaurants
│   ├── Places
│   ├── Metro
│   ├── Bus
│   ├── Parking
│   ├── Police
│   ├── Hospitals
│   ├── ATMs
│   ├── Pharmacy
│   └── Ask Maya
│
├── MEETS
│   ├── Discover Meetups
│   ├── Create Meetup
│   └── Find Your Vibe
│
├── MAYA
│   ├── Chat
│   ├── Voice
│   ├── Camera
│   ├── Pandal Identification
│   ├── Explanation
│   ├── Recommendations
│   └── Planning
│
├── PANDAL DETAIL
│   ├── Hero
│   ├── Current Information
│   ├── Past Editions
│   ├── Theme / Story
│   ├── What Others Say
│   ├── Top Clicks
│   ├── User Photos
│   ├── Similar Places
│   ├── Nearby Restaurants
│   └── Nearby Meetups
│
└── PROFILE
    ├── Subscription
    ├── Visits
    ├── Premium
    ├── Emergency
    ├── Payments
    ├── Donations
    ├── Personalization
    ├── Account
    └── About
```

---

# 61. Naming

Current naming should be treated as:

**Platform:** Pujo Sahayak

**AI Assistant:** Maya

This gives the product a recognizable personality without making the whole application "an AI app."

---

## Final Product Definition

> **Pujo Sahayak is a modern local-discovery and community platform centered around the Durga Puja experience. It helps users discover pandals and local places, understand what they are seeing through Maya's AI-powered visual and conversational assistance, plan their outings, find restaurants and events, join activity-based meetups, share experiences, access safety information, and build a personal record of places they have explored. Its architecture and information model should remain broad enough to continue serving Kolkata's local-discovery needs beyond the Puja season.**

