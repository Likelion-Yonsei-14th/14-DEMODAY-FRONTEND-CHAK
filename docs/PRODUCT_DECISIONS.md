# Product / UX decisions

This document tracks the latest decisions that the code prototype must prioritize over older Figma flow explorations.

## Prototype scope

- Login, signup, account deletion, and other secondary account screens stay documented in Figma for now.
- Core experience flows are implemented as clickable code prototypes.
- The code prototype is an interactive UX specification, not a production backend.

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

Long Card is not part of the current product model.

## Desk creation / ownership

- A desk can be created by the test-taker or by another supporter.
- Self-created desks begin as claimed.
- Supporter-created desks begin as unclaimed.
- The recipient can claim the desk later.
- Before completing claim, the recipient can confirm or change the read mode.
- After claim, the original creator should have the same control level as an ordinary supporter.

## Read modes

User-facing copy describes the outcome rather than exposing internal mode names.

Internal modes:

- `daily`: open the day’s messages at a configured daily time.
- `time-capsule`: keep messages locked until a configured date/time.

## Class mode

- Static 2D classroom, not a metaverse.
- Blackboard = shared/public messages.
- Locker = personal message objects.
- Locker Object → Common Reader reuses the Personal Desk reading pattern.

## Design principle

> UI는 깨끗하게, 콘텐츠는 살아있게.

The service shell is calm, premium, and restrained. User-created content can be hand-drawn, playful, meme-like, colorful, and intentionally personal.
