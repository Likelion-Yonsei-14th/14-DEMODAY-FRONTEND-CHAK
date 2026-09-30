# Product / UX decisions

This document tracks the latest decisions that the code prototype must prioritize over older Figma flow explorations.

## Prototype scope

- Login, signup, account deletion, and other secondary account screens stay documented in Figma for now.
- Core experience flows are implemented as clickable code prototypes.
- The code prototype is an interactive UX specification, not a production backend.

## Personal Desk

- The home experience is the user’s study desk, not a card feed.
- Messages appear as physical-looking desk objects.
- 1–8 message objects are shown individually.
- From 9+ objects, some can be clustered/stacked and an "전체 응원 보기" secondary view can be offered.
- Primary reading path: Desk Object → Common Reader.
- Card/Grid lists are secondary navigation only.

## Unified Composer

There is no upfront mode choice for "한 줄 / 사진 / 꾸미기 / 편지".

One editor provides:

- 배경
- 글자
- 문구 (Word Art)
- 스티커
- 사진

A supporter can start typing immediately and add only the elements they need.

## Canvas

### Standard Card

- Default aspect ratio: 4:5.
- Body text can be freely positioned.
- Word Art, stickers, and floating photos can be moved/scaled/rotated within product limits.
- Fixed PNG backgrounds and user photo backgrounds are allowed.

### Long Card

- Triggered when content becomes too long for the Standard Card and the user accepts the transition.
- Body uses automatic vertical flow.
- Header/Footer retain limited decoration freedom.
- The editor keeps the same five tabs.
- Unsupported assets stay visible as Restricted; they are not hidden or treated as inert disabled controls.
- Tapping a Restricted asset explains why it is unavailable.
- The default service background must support Long Card.
- Fixed artwork PNGs and full-photo backgrounds may be 4:5-only.

## Asset model

Asset capability is explicit data:

- supportsLongCard
- movable
- scalable
- rotatable

Background types:

- scalable
- repeatable
- fixed
- photo

## Class mode

- Static 2D classroom, not a metaverse.
- Blackboard = shared/public messages.
- Locker = personal message objects.
- Locker Object → Common Reader reuses the Personal Desk reading pattern.

## Design principle

> UI는 깨끗하게, 콘텐츠는 살아있게.

The service shell is calm, premium, and restrained. User-created content can be hand-drawn, playful, meme-like, colorful, and intentionally personal.
