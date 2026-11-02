import { attemptLabel } from './examCareerConfig'
import type { SharedCareer } from './examCareerShare'

export type CareerTitle = { title: string; blurb: string }

const gradesOf = (career: SharedCareer) => Object.values(career.grades)

/**
 * A title for how the career turned out, from what a shared link already
 * carries, so the owner, a friend and the share image all show the same one.
 * The first rule that fits wins; rarer stories sit higher.
 */
export function careerTitleOf(career: SharedCareer): CareerTitle {
  const grades = gradesOf(career)
  const best = Math.min(...grades)
  const worst = Math.max(...grades)
  const top = career.enrolled === 'sky'
  const strong = top || career.enrolled === 'seoul-upper'
  const retakes = career.attempt

  if (retakes >= 3) {
    return {
      title: `${retakes}수의 전설`,
      blurb: `${attemptLabel(retakes)}까지 책상을 떠나지 않았어요. 끝까지 간 사람만 아는 이야기예요.`,
    }
  }
  if (retakes === 0 && top) return { title: '현역 SKY 신화', blurb: '재수 없이 한 번에 해냈어요. 전설로 남을 만한 한 해였어요.' }
  if (retakes >= 1 && top) return { title: '역전의 명수', blurb: `${attemptLabel(retakes)}의 끈기가 결국 SKY의 문을 열었어요.` }
  if (retakes >= 1 && strong) return { title: '다시 일어선 도전자', blurb: `한 번 더 도전한 ${attemptLabel(retakes)}, 보란 듯이 올라섰어요.` }
  if (retakes === 0 && career.average <= 2.5) return { title: '현역 에이스', blurb: '처음부터 흔들림 없이 달렸어요. 성적표가 든든해요.' }
  if (best === 1 && worst >= 5) return { title: '한 과목 장인', blurb: '한 과목은 만점급, 다른 과목은 숙제로 남았어요. 극과 극의 성적표예요.' }
  if (worst - best >= 4) return { title: '극단의 줄타기', blurb: '과목마다 성적이 크게 갈렸어요. 편식하지 않았다면 어땠을까요?' }
  if (career.enrolled === null) return { title: '자유로운 영혼', blurb: '정해진 길 대신 나만의 길을 골랐어요.' }
  if (retakes >= 1) return { title: '끈기의 재도전러', blurb: `${attemptLabel(retakes)}를 버텨 낸 단단한 마음이 가장 큰 성과예요.` }
  if (career.average >= 5) return { title: '버티기 달인', blurb: '쉽지 않은 한 해를 끝까지 견뎠어요. 그것만으로 충분히 대단해요.' }
  return { title: '꾸준한 정석 수험생', blurb: '무리하지 않고 꾸준히 걸어 왔어요. 안정적인 한 해였어요.' }
}
