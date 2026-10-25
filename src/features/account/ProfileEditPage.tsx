import { useRef, useState, type ChangeEvent } from 'react'
import { ArrowLeft, Camera } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AppBar, Button, IconButton, TextField, useFeedback } from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import { ProfileAvatar } from './ProfileAvatar'
import { makeProfilePhoto } from './profilePhoto'
import './AccountPages.css'

export const PROFILE_NAME_MAX_LENGTH = 20

/**
 * Edit the name and photo shown for this account. The backend has no profile
 * update API yet, so this saves to the device's store only; swap the save for
 * the API call once it exists.
 */
export function ProfileEditPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useFeedback()
  const currentUser = usePrototypeStore((state) => state.currentUser)
  const authenticated = usePrototypeStore((state) => state.authSession.status === 'authenticated')
  const updateProfile = usePrototypeStore((state) => state.updateProfile)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(currentUser.displayName)
  const [photo, setPhoto] = useState(currentUser.profileImageUrl)
  const [processing, setProcessing] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

  if (!authenticated) return <Navigate to="/auth/login" replace />

  // Opened from 내 계정: go back to it rather than stacking another copy.
  const fromAccount = Boolean((location.state as { fromAccount?: boolean } | null)?.fromAccount)
  const leave = () => (fromAccount ? navigate(-1) : navigate('/account', { replace: true }))

  const trimmedName = name.trim()
  const changed = trimmedName !== currentUser.displayName || photo !== currentUser.profileImageUrl
  const nameError = trimmedName ? undefined : '이름을 적어 주세요.'

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

  const save = () => {
    if (!trimmedName || !changed) return
    updateProfile({ displayName: trimmedName, profileImageUrl: photo })
    showToast({ message: '프로필을 저장했어요.', tone: 'success' })
    leave()
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
        <Button variant="brand" fullWidth disabled={!trimmedName || !changed || processing} onClick={save}>
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
          onChange={(event) => setName(event.target.value)}
        />
      </main>
    </AppShell>
  )
}
