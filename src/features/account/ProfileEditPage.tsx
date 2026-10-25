import { useRef, useState, type ChangeEvent } from 'react'
import { ArrowLeft, Camera } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AppBar, Button, IconButton, TextField, useFeedback } from '@/design-system'
import { isApiEnabled } from '@/api/config'
import {
  changeDisplayName,
  deleteAvatar,
  profileFailure,
  profileNameFormatError,
  uploadAvatar,
} from '@/api/profile'
import type { ApiUser } from '@/api/types'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import { ProfileAvatar } from './ProfileAvatar'
import { makeProfilePhoto } from './profilePhoto'
import './AccountPages.css'

export { PROFILE_NAME_MAX_LENGTH } from '@/api/profile'
import { PROFILE_NAME_MAX_LENGTH } from '@/api/profile'

/**
 * Edit the name and photo shown for this account. With a backend they are
 * saved to the server (so they follow the account to other devices and
 * survive the next login); the offline prototype keeps them on the device.
 */
export function ProfileEditPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useFeedback()
  const currentUser = usePrototypeStore((state) => state.currentUser)
  const authenticated = usePrototypeStore((state) => state.authSession.status === 'authenticated')
  const updateProfile = usePrototypeStore((state) => state.updateProfile)
  const applyServerProfile = usePrototypeStore((state) => state.applyServerProfile)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(currentUser.displayName)
  const [photo, setPhoto] = useState(currentUser.profileImageUrl)
  const [processing, setProcessing] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [serverNameError, setServerNameError] = useState<string | null>(null)

  if (!authenticated) return <Navigate to="/auth/login" replace />

  // Opened from 내 계정: go back to it rather than stacking another copy.
  const fromAccount = Boolean((location.state as { fromAccount?: boolean } | null)?.fromAccount)
  const leave = () => (fromAccount ? navigate(-1) : navigate('/account', { replace: true }))

  const trimmedName = name.trim()
  const changed = trimmedName !== currentUser.displayName || photo !== currentUser.profileImageUrl
  const nameError = serverNameError ?? (isApiEnabled ? profileNameFormatError(name) : trimmedName ? null : '이름을 적어 주세요.') ?? undefined

  const pickPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Clear so picking the same file again still fires a change.
    event.target.value = ''
    if (!file) return
    setProcessing(true)
    setPhotoError(null)
    try {
      setPhoto(await makeProfilePhoto(file))
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : '사진을 처리하지 못했어요.')
    } finally {
      setProcessing(false)
    }
  }

  const save = async () => {
    if (!trimmedName || !changed || saving || (isApiEnabled && nameError)) return
    if (!isApiEnabled) {
      updateProfile({ displayName: trimmedName, profileImageUrl: photo })
      showToast({ message: '프로필을 저장했어요.', tone: 'success' })
      leave()
      return
    }

    setSaving(true)
    setServerNameError(null)
    setPhotoError(null)
    // 이름은 저장됐는데 사진에서 실패하면, 저장된 이름이라도 화면에 반영한다.
    let latest: ApiUser | null = null
    try {
      if (trimmedName !== currentUser.displayName) {
        latest = await changeDisplayName(trimmedName)
      }
      if (photo !== currentUser.profileImageUrl) {
        latest = photo ? await uploadAvatar(photo) : await deleteAvatar()
      }
      if (latest) applyServerProfile(latest)
      showToast({ message: '프로필을 저장했어요.', tone: 'success' })
      leave()
    } catch (error) {
      if (latest) applyServerProfile(latest)
      const failure = profileFailure(error)
      if (failure.field === 'name') setServerNameError(failure.message)
      else if (failure.field === 'photo') setPhotoError(failure.message)
      else showToast({ message: failure.message, tone: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell
      surface="base"
      contentClassName="account-flow-shell"
      appBar={
        <AppBar
          title="프로필 수정"
          leading={
            <IconButton
              label="내 계정으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={leave}
            />
          }
        />
      }
      fixedAction={
        <Button variant="brand" fullWidth loading={saving} disabled={!trimmedName || !changed || processing || Boolean(isApiEnabled && nameError)} onClick={save}>
          저장하기
        </Button>
      }
    >
      <main className="profile-edit">
        <section className="profile-edit__photo">
          <button
            type="button"
            className="profile-edit__avatar-button"
            aria-label="프로필 사진 바꾸기"
            disabled={processing}
            onClick={() => fileInputRef.current?.click()}
          >
            <ProfileAvatar src={photo} size={96} className="profile-edit__avatar" />
            <span className="profile-edit__camera" aria-hidden>
              <Camera size={16} />
            </span>
          </button>
          <input
            ref={fileInputRef}
            className="profile-edit__file"
            type="file"
            accept="image/*"
            tabIndex={-1}
            aria-hidden
            onChange={pickPhoto}
          />
          <div className="profile-edit__photo-actions">
            <button
              type="button"
              className="profile-edit__text-button"
              disabled={processing}
              onClick={() => fileInputRef.current?.click()}
            >
              {processing ? '사진 준비 중…' : '프로필 사진 바꾸기'}
            </button>
            {photo && (
              <button
                type="button"
                className="profile-edit__text-button profile-edit__text-button--muted"
                disabled={processing}
                onClick={() => {
                  setPhoto(undefined)
                  setPhotoError(null)
                }}
              >
                사진 지우기
              </button>
            )}
          </div>
          {photoError && (
            <p className="profile-edit__error" role="alert">
              {photoError}
            </p>
          )}
        </section>

        <TextField
          id="profile-name"
          label="이름"
          value={name}
          maxLength={PROFILE_NAME_MAX_LENGTH}
          autoComplete="nickname"
          helper={`홈과 내 계정에 보이는 이름이에요. ${PROFILE_NAME_MAX_LENGTH}자까지 쓸 수 있어요.`}
          error={nameError}
          onChange={(event) => {
            setName(event.target.value)
            setServerNameError(null)
          }}
        />
      </main>
    </AppShell>
  )
}
