import { describe, expect, it } from 'vitest'
import {
  letterRequest,
  objectTypeFromApi,
  objectTypeToApi,
  ownerMessagesFromApi,
  publicMessagesFromApi,
  readModeFromApi,
  readModeToApi,
  stickerRequest,
} from '@/api/mappers'
import type { ApiOwnerMessage, ApiPublicDesk, ApiPublicMessage } from '@/api/types'
import { emptyComposerDraft } from '@/prototype/mock/initialState'

const apiObject = {
  representationType: 'PHOTO_CARD',
  assetId: null,
  color: '#D8644A',
  x: 40,
  y: 60,
  rotation: 2,
  scale: 1,
  zIndex: 31,
  metadata: { zone: 'left', order: 3, locked: false },
}

describe('enum conversion', () => {
  it('round-trips object types', () => {
    expect(objectTypeToApi('photo-card')).toBe('PHOTO_CARD')
    expect(objectTypeToApi('memo')).toBe('MEMO')
    expect(objectTypeFromApi('GENERIC_CARD')).toBe('generic-card')
    expect(objectTypeFromApi(objectTypeToApi('poster-card'))).toBe('poster-card')
  })
})

describe('read mode', () => {
  it('converts daily time to HH:mm:ss and back', () => {
    const api = readModeToApi({ type: 'daily', unlockTime: '22:30' })
    expect(api).toEqual({
      readModeType: 'DAILY',
      dailyUnlockTime: '22:30:00',
      capsuleUnlockAt: null,
    })
    const desk = { ...api, id: 1 } as unknown as ApiPublicDesk
    expect(readModeFromApi(desk)).toEqual({ type: 'daily', unlockTime: '22:30' })
  })

  it('converts a time capsule to an ISO instant', () => {
    const api = readModeToApi({ type: 'time-capsule', unlockAt: '2026-11-12T09:00' })
    expect(api.readModeType).toBe('TIME_CAPSULE')
    expect(api.capsuleUnlockAt).toMatch(/Z$/)
    expect(api.dailyUnlockTime).toBeNull()
  })
})

describe('message mapping', () => {
  it('maps a public message and its desk object', () => {
    const item: ApiPublicMessage = {
      id: 7,
      authorDisplayName: '민준',
      kind: 'CARD',
      visibility: 'PUBLIC',
      schemaVersion: 1,
      card: { pages: [{ id: 'p1', backgroundAssetId: 'bg-x', textElements: [{ id: 't', text: '화이팅' }] }] },
      object: apiObject,
      unlockAt: '2026-01-01T00:00:00Z',
      createdAt: '2026-01-01T00:00:00Z',
    }
    const { messages, objects } = publicMessagesFromApi([item], '1')

    expect(messages[0]).toMatchObject({
      id: '7',
      senderName: '민준',
      visibility: 'public',
      kind: 'card',
      recipientDeskId: '1',
    })
    expect(messages[0]!.pages?.[0]?.textElements[0]?.text).toBe('화이팅')
    expect(messages[0]!.unlockAt).toBe('2026-01-01T00:00:00Z')
    expect(messages[0]!.pages?.[0]?.stickerElements).toEqual([])
    expect(objects[0]).toMatchObject({
      messageId: '7',
      representationType: 'photo-card',
      zone: 'left',
      order: 3,
      x: 40,
      locked: false,
    })
  })

  it('maps owner messages: locked card is empty, read and basket ids collected', () => {
    const base = {
      kind: 'CARD',
      visibility: 'PRIVATE',
      schemaVersion: 1,
      object: apiObject,
      unlockAt: '2030-01-01T00:00:00Z',
      createdAt: '2026-01-01T00:00:00Z',
    } as const
    const items: ApiOwnerMessage[] = [
      { ...base, deliveryId: 11, messageId: 1, authorDisplayName: 'A', status: 'READ', locked: false,
        card: { pages: [{ id: 'p' }] }, readAt: '2026-01-02T00:00:00Z', basketedAt: '2026-01-03T00:00:00Z' },
      { ...base, deliveryId: 12, messageId: 2, authorDisplayName: 'B', status: 'SENT', locked: true,
        card: null, readAt: null, basketedAt: null, object: { ...apiObject, metadata: null } },
    ]
    const mapped = ownerMessagesFromApi(items, '1')

    expect(mapped.messages.map((m) => m.deliveryId)).toEqual([11, 12])
    expect(mapped.messages[1]!.pages).toEqual([])
    expect(mapped.messages[1]!.status).toBe('sent')
    expect(mapped.readMessageIds).toEqual(['1'])
    expect(mapped.basketMessageIds).toEqual(['1'])
    expect(mapped.objects[0]!.locked).toBe(false)
    // No metadata: a private message's object falls back to locked.
    expect(mapped.objects[1]!.locked).toBe(true)
    expect(mapped.objects[1]!.zone).toBeDefined()
  })
})

describe('send requests', () => {
  const placement = { x: 52, y: 54, rotation: -2, scale: 1 }

  it('builds a letter request with desk metadata', () => {
    const request = letterRequest({
      draft: { ...emptyComposerDraft, visibility: 'private' },
      nickname: '친구',
      objectType: 'photo-card',
      objectColor: '#D8644A',
      placement,
      zone: 'center',
      order: 0,
      zIndex: 30,
      charm: { assetId: 'charm-1', material: 'acrylic', charmPhrase: '합격' },
      gems: [{ id: 'g', gemId: 'gem', x: 1, y: 2, size: 3, rotation: 0 }],
    })

    expect(request).toMatchObject({
      nickname: '친구',
      kind: 'CARD',
      visibility: 'PRIVATE',
      schemaVersion: 1,
      object: { representationType: 'PHOTO_CARD', assetId: 'charm-1', x: 52, y: 54, zIndex: 30 },
    })
    expect(request.card?.pages.length).toBeGreaterThan(0)
    expect(request.object.metadata).toMatchObject({
      zone: 'center',
      order: 0,
      material: 'acrylic',
      charmPhrase: '합격',
      locked: true,
    })
  })

  it('builds a sticker request without a card', () => {
    const request = stickerRequest({
      stickerId: 'sticker-1',
      placement,
      zone: 'left',
      order: 1,
      zIndex: 31,
    })

    expect(request).toMatchObject({ kind: 'STICKER', visibility: 'PRIVATE', card: null })
    expect(request.nickname).toBeUndefined()
    expect(request.object).toMatchObject({ representationType: 'STICKER', assetId: 'sticker-1' })
  })
})
