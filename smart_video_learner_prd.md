# Smart Video Learner -- PRD & Execution Plan

## Objective

Given a user query (e.g., "learn TypeScript"), return and play the best
YouTube video inside the app without redirecting.

------------------------------------------------------------------------

## User Flow

1.  User enters query\
2.  System searches videos\
3.  System evaluates quality\
4.  System selects best video\
5.  Video is embedded and played\
6.  Optional: show alternatives

------------------------------------------------------------------------

## Core Functional Requirements

### 1. Search Videos

-   Input: query (string)
-   Output: list of video candidates
-   Source: YouTube Data API

### 2. Filter Candidates

Remove videos that: - Are not embeddable - Are too short (\< 5--10 min)

### 3. Enrich Metadata

Fetch: - viewCount\
- likeCount\
- duration\
- channelTitle\
- publishDate

### 4. Rank Videos

score = (views \* 0.5) + (likes \* 0.3) + (duration_weight) +
(recency_weight)

### 5. Select Final Video

-   Highest score OR AI-selected
-   Must be embeddable

### 6. Render Video

https://www.youtube.com/embed/{videoId}

------------------------------------------------------------------------

## Execution Flow

1.  Receive query\
2.  Normalize query\
3.  Call YouTube Search API\
4.  Extract videoIds\
5.  Call Videos API\
6.  Filter results\
7.  Rank videos\
8.  Select best video\
9.  Return response\
10. Embed in frontend

------------------------------------------------------------------------

## Agent TODO

### Input Handling

-   Accept user query\
-   Normalize query

### Data Fetching

-   Call search API\
-   Extract videoIds\
-   Call videos API

### Filtering

-   Remove non-embeddable\
-   Remove short videos

### Ranking

-   Implement scoring OR use AI

### Output

-   Select best video\
-   Prepare embed URL

### Frontend

-   Display iframe\
-   Show loading state

------------------------------------------------------------------------

## Future Scope

-   Learning paths\
-   Notes generation\
-   Progress tracking\
-   Playlist creation

------------------------------------------------------------------------

Generated on: 2026-04-17 07:11:26.886365
