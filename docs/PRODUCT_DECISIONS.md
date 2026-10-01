# Product / UX decisions

This document tracks the latest decisions that the code prototype must prioritize over older Figma flow explorations.

## Prototype scope

- Core experience flows and the account lifecycle are implemented as clickable code prototypes.
- Authentication screens simulate state only; real credentials, OAuth, sessions, and backend persistence remain production implementation work.
- The code prototype is an interactive UX specification, not a production backend.

## Account / authentication

- The service remains usable without login for browsing and leaving encouragements.
- Account screens exist so users can understand how they would return to their saved spaces across visits.
- Prototype flows include:
  - email login
  - email signup
  - Google login mock
  - account page
  - logout
  - account deletion and completion
- Google is the primary social-login prototype. Kakao login remains optional follow-up scope.
- No production authentication or OAuth credentials are included in the prototype.

## Personal Desk

- The home experience is the user’s study desk, not a card feed.
- Messages appear as physical-looking desk objects.
- Primary reading path: Desk Object → Common Reader.
- Card/envelope lists are secondary navigation only.
- Unread messages are visually discoverable on the desk.
- Daily / Time Capsule availability will be expressed through the object state rather than a separate content feed.

## Unified Composer

There is no upfront mode choice for "한 줄 / 사진 / 꾸미기 / 편지".

One editor provides:

- 배경
- 글자
- 문구 (Word Art)
- 스티커
- 사진

A supporter can start typing immediately and add only the elements they need.

## Card pages

- All message cards use the standard 4:5 canvas.
- A single message can contain **up to 3 card pages**.
- The add-card entry point stays visible; overflow is not the only way to create another page.
- Text is never split automatically across pages.
- No page reorder is required for the current MVP.
- A newly added page inherits:
  - the current page background
  - the last text element’s style
- A newly added page does **not** inherit:
  - actual text content
  - stickers
  - Word Art
  - photos
- Each page stores its own background, text, stickers, Word Art, and photos.
- Composer and Recipient Reader must share rendering geometry/styles so authored output is preserved.

## Canvas interaction

- Body text can be freely positioned.
- Word Art, stickers, and floating photos can be moved/scaled/rotated within product limits.
- Background images and user photo backgrounds are allowed.
- Floating layers share one z-order model.
- The selected object type controls which editing tool is active.

## Asset model

Asset capability data may describe interaction behavior such as:

- movable
- scalable
- rotatable

Background types:

- scalable
- repeatable
- fixed
- photo

The current product model uses standard 4:5 cards only, with up to 3 pages per message.

## Desk creation / ownership

- A desk can be created by the test-taker or by another supporter.
- Self-created desks begin as claimed.
- Supporter-created desks begin as unclaimed.
- The recipient can claim the desk later.
- Before completing claim, the recipient can confirm or change the read mode.
- After claim, the original creator should have the same control level as an ordinary supporter.

## Owner / creator management

- The desk owner can manage:
  - Daily / Time Capsule opening schedule
  - whether public encouragements can be viewed by visitors
  - new-encouragement notifications
  - supporter invite link
  - hidden / blocked supporters
  - connecting another separately created room by code
  - ending new encouragement intake while keeping existing messages readable
- Blocking a supporter hides that supporter’s encouragements from the owner desk and envelope list.
- Connected rooms remain separate. Connecting does not merge rooms or messages.
- Before Claim, the creator can manage the owner/share links, connection code, and initial opening schedule.
- After Claim, creator management ends and the creator returns to ordinary supporter permissions.

## Read modes

User-facing copy describes the outcome rather than exposing internal mode names.

Internal modes:

- `daily`: open the day’s messages at a configured daily time.
- `time-capsule`: keep messages locked until a configured date/time.

## Class / group mode

- The mode is for a high-school class, study group, friend group, or another small community preparing for the exam together.
- Entry copy describes the situation and desired action rather than asking users to understand product-internal terms such as “personal desk” vs. “group space.”
- The creator is assumed to be one of the members; no creator-role question is required.
- Member names are not collected when the space is created.
- A shared link opens the group space; each visitor enters their own name or nickname and gets one locker.
- There is no separate Claim flow for lockers.
- The main experience is a horizontally explorable 2D classroom map rather than a menu of feature buttons.
- Users move left/right through the classroom and interact directly with the blackboard and lockers in the scene.
- Blackboard:
  - shared/public by default
  - visible immediately
  - supports short text and freehand chalk drawing
- Locker:
  - one locker per member
  - uses the existing Unified Composer for personal encouragements
  - the placement destination is the inside of the locker instead of the personal desk
  - public encouragements may be viewed by other visitors
  - private encouragements can only be opened by the locker owner
  - the locker owner reads incoming encouragements on Daily mode only
- Locker Object → Common Reader reuses the same card renderer and reader behavior as Personal Desk.

## Post-exam Wrapped / benefits

- After the exam, the owner can move through:
  - completion home (“정말 수고했어요”)
  - intro summary
  - AI-reconstructed encouragement themes / emotions / repeated expressions / representative sentence
  - nickname reveal for supporters who consented to be shown
  - full personal record across messages, friends, photos, and participation days
  - share image that uses aggregate statistics and does not expose original message text
- Wrapped is non-competitive. It should never rank users by how many messages or friends they had.
- The final Wrapped screen can lead into student benefits.
- Benefits prototype includes:
  - category-based benefit list
  - benefit detail with partner, period, condition, and use CTA
  - coupon save / on-site presentation / use completion

## Design principle

> UI는 깨끗하게, 콘텐츠는 살아있게.

The service shell is calm, premium, and restrained. User-created content can be hand-drawn, playful, meme-like, colorful, and intentionally personal.
