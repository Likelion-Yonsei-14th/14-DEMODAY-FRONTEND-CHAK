import { useEffect, useState, type FormEvent } from 'react'
import { fetchMinigameNickname, NICKNAME_MAX, nicknameErrorText, nicknameFormatError, saveMinigameNickname } from '@/api/minigames'
import { Button, TextField } from '@/design-system'
import './MinigameNicknameForm.css'

/** 미니게임 랭킹에 보일 닉네임을 정한다. 로그인한 회원에게만 보여 준다. */
export function MinigameNicknameForm() {
  const [saved, setSaved] = useState<string | null>(null)
  const [defaultName, setDefaultName] = useState<string | null>(null)
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchMinigameNickname()
      .then((profile) => {
        if (cancelled) return
        setSaved(profile.nickname)
        setDefaultName(profile.defaultNickname)
        // 불러오는 사이에 이미 입력을 시작했다면 그 내용을 덮어쓰지 않는다.
        setValue((current) => (current === '' ? (profile.nickname ?? '') : current))
      })
      .catch(() => {
        // 불러오지 못해도 새로 정하는 것은 가능하다.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const unchanged = value.trim() === (saved ?? '')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return
    const formatError = nicknameFormatError(value)
    if (formatError) {
      setError(formatError)
      setDone(false)
      return
    }
    setSaving(true)
    setError(undefined)
    setDone(false)
    try {
      const profile = await saveMinigameNickname(value)
      setSaved(profile.nickname)
      setDefaultName(profile.defaultNickname)
      setValue(profile.nickname ?? '')
      setDone(true)
    } catch (failure) {
      setError(nicknameErrorText(failure))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="minigame-nickname" aria-labelledby="minigame-nickname-title">
      <h2 id="minigame-nickname-title">랭킹에 보일 닉네임</h2>
      <form onSubmit={submit} noValidate>
        <TextField
          id="minigame-nickname"
          label="닉네임"
          value={value}
          maxLength={NICKNAME_MAX + 4}
          autoComplete="nickname"
          placeholder={defaultName ? `정하지 않으면 ${defaultName}` : '2~12자'}
          helper={done ? undefined : '한글, 영문, 숫자, 밑줄(_) 2~12자'}
          error={error}
          onChange={(event) => {
            setValue(event.target.value)
            setError(undefined)
            setDone(false)
          }}
        />
        <div className="minigame-nickname__row">
          <Button type="submit" size="m" variant="secondary" loading={saving} disabled={unchanged}>
            저장하기
          </Button>
          {done && (
            <p className="minigame-nickname__done" role="status">
              닉네임을 저장했어요
            </p>
          )}
        </div>
      </form>
    </section>
  )
}
