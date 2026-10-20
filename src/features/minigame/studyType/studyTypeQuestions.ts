/**
 * Questions for the "나의 수험생 유형은?" mini game. Copy can be edited here
 * without touching the screens. Bump STUDY_TYPE_DATA_VERSION whenever a
 * question is added, removed or re-mapped so saved progress is discarded
 * instead of being scored against different questions.
 */
export const STUDY_TYPE_DATA_VERSION = 1

export type Dimension = 'plan' | 'environment' | 'mental'

export type Trait = 'P' | 'L' | 'S' | 'F' | 'A' | 'N'

export type QuestionOption = {
  trait: Trait
  label: string
}

export type StudyTypeQuestion = {
  id: string
  question: string
  dimension: Dimension
  options: readonly [QuestionOption, QuestionOption]
}

export const DIMENSION_TRAITS: Record<Dimension, readonly [Trait, Trait]> = {
  plan: ['P', 'L'],
  environment: ['S', 'F'],
  mental: ['A', 'N'],
}

export const DIMENSIONS: readonly Dimension[] = ['plan', 'environment', 'mental']

export const STUDY_TYPE_QUESTIONS: readonly StudyTypeQuestion[] = [
  // PART 1. 공부 계획 (P/L)
  {
    id: 'q1',
    dimension: 'plan',
    question: '아침에 책상에 앉으면 가장 먼저 하는 행동은?',
    options: [
      { trait: 'P', label: '오늘 할 일을 확인하고 공부 순서를 정한다.' },
      { trait: 'L', label: '지금 가장 공부하고 싶은 과목부터 시작한다.' },
    ],
  },
  {
    id: 'q2',
    dimension: 'plan',
    question: '오늘 계획했던 공부를 예상보다 빨리 끝냈다면?',
    options: [
      { trait: 'P', label: '다음에 할 공부를 미리 당겨서 진행한다.' },
      { trait: 'L', label: '남은 시간에 하고 싶은 공부를 자유롭게 한다.' },
    ],
  },
  {
    id: 'q3',
    dimension: 'plan',
    question: '갑자기 학원 수업이 취소되어 시간이 생겼다면?',
    options: [
      { trait: 'P', label: '기존 공부 계획을 수정해서 시간을 활용한다.' },
      { trait: 'L', label: '그때그때 필요한 공부를 찾아서 한다.' },
    ],
  },
  {
    id: 'q4',
    dimension: 'plan',
    question: '시험 일주일 전, 나의 공부 방식은?',
    options: [
      { trait: 'P', label: '미리 정해둔 순서대로 최종 복습을 진행한다.' },
      { trait: 'L', label: '가장 부족하다고 느끼는 과목에 집중한다.' },
    ],
  },
  {
    id: 'q5',
    dimension: 'plan',
    question: '나의 공부 플래너는?',
    options: [
      { trait: 'P', label: '공부할 때 거의 매일 사용하는 필수품이다.' },
      { trait: 'L', label: '필요할 때만 사용하는 참고용 도구다.' },
    ],
  },
  {
    id: 'q6',
    dimension: 'plan',
    question: '유튜브에서 새로운 공부법을 발견했다면?',
    options: [
      { trait: 'P', label: '내 공부 계획에 어떻게 적용할지 먼저 생각한다.' },
      { trait: 'L', label: '괜찮아 보이면 일단 바로 시도해 본다.' },
    ],
  },
  {
    id: 'q7',
    dimension: 'plan',
    question: '갑자기 공부 의욕이 폭발하는 날에는?',
    options: [
      { trait: 'P', label: '기존 계획에서 더 공부할 부분을 추가한다.' },
      { trait: 'L', label: '지금 하고 싶은 과목을 끝까지 파고든다.' },
    ],
  },

  // PART 2. 공부 환경 (S/F)
  {
    id: 'q8',
    dimension: 'environment',
    question: '공부가 도저히 안 되는 날에는?',
    options: [
      { trait: 'S', label: '혼자 조용한 곳으로 가서 다시 집중해 본다.' },
      { trait: 'F', label: '친구와 함께 공부하면서 분위기를 바꿔 본다.' },
    ],
  },
  {
    id: 'q9',
    dimension: 'environment',
    question: '가장 공부가 잘되는 환경은?',
    options: [
      { trait: 'S', label: '아무도 방해하지 않는 조용한 개인 공간.' },
      { trait: 'F', label: '다른 사람들과 함께 공부하는 스터디 공간.' },
    ],
  },
  {
    id: 'q10',
    dimension: 'environment',
    question: '어려운 문제를 만났을 때 나는?',
    options: [
      { trait: 'S', label: '시간이 걸려도 혼자 충분히 고민해 본다.' },
      { trait: 'F', label: '친구들과 풀이 방법을 이야기하며 해결한다.' },
    ],
  },
  {
    id: 'q11',
    dimension: 'environment',
    question: '모의고사가 끝나면 가장 먼저 하고 싶은 것은?',
    options: [
      { trait: 'S', label: '혼자 틀린 문제를 분석하고 정리하기.' },
      { trait: 'F', label: '친구들과 어려웠던 문제에 대해 이야기하기.' },
    ],
  },
  {
    id: 'q12',
    dimension: 'environment',
    question: '친구가 공부 인증 사진을 보냈다면?',
    options: [
      { trait: 'S', label: '나도 조용히 내 공부를 이어간다.' },
      { trait: 'F', label: '나도 공부 인증 사진을 보내고 싶어진다.' },
    ],
  },
  {
    id: 'q13',
    dimension: 'environment',
    question: '스터디카페에서 친구를 우연히 만났다면?',
    options: [
      { trait: 'S', label: '인사만 하고 각자 공부하는 게 편하다.' },
      { trait: 'F', label: '쉬는 시간에 같이 이야기하고 싶다.' },
    ],
  },
  {
    id: 'q14',
    dimension: 'environment',
    question: '시험기간에 나에게 가장 필요한 것은?',
    options: [
      { trait: 'S', label: '누구에게도 방해받지 않는 나만의 공간.' },
      { trait: 'F', label: '서로 응원하고 자극받을 수 있는 공부 메이트.' },
    ],
  },

  // PART 3. 시험 멘탈 (A/N)
  {
    id: 'q15',
    dimension: 'mental',
    question: '모의고사 성적이 예상보다 낮게 나왔다면?',
    options: [
      {
        trait: 'A',
        label: '수능에서도 이러면 어떡하지? 마음이 쓰여서 오답부터 꼼꼼히 다시 본다.',
      },
      { trait: 'N', label: '이번엔 이 정도구나. 부족한 부분만 채우면 된다고 생각한다.' },
    ],
  },
  {
    id: 'q16',
    dimension: 'mental',
    question: '시험이 일주일 앞으로 다가왔다면?',
    options: [
      { trait: 'A', label: '시간이 빨리 가는 것 같아 조급해지고, 빠진 범위가 없는지 계속 점검한다.' },
      { trait: 'N', label: '남은 시간에 할 수 있는 것부터 차분히 한다.' },
    ],
  },
  {
    id: 'q17',
    dimension: 'mental',
    question: '시험장에서 모르는 문제가 연달아 나온다면?',
    options: [
      { trait: 'A', label: '순간 머리가 하얘지고, 지나간 문제가 자꾸 신경 쓰인다.' },
      { trait: 'N', label: '일단 표시해 두고 풀 수 있는 문제부터 해결한다.' },
    ],
  },
  {
    id: 'q18',
    dimension: 'mental',
    question: '시험에서 아는 문제를 실수로 틀렸다면?',
    options: [
      { trait: 'A', label: '그 실수가 계속 생각나서 같은 유형을 몇 번이고 다시 풀어 본다.' },
      { trait: 'N', label: '아쉽지만 오답 노트에 적고 바로 다음으로 넘어간다.' },
    ],
  },
  {
    id: 'q19',
    dimension: 'mental',
    question: '시험 전날 친구가 "나 진짜 망했어"라고 한다면?',
    options: [
      { trait: 'A', label: '친구 이야기를 듣다 보니 나도 덩달아 마음이 불안해진다.' },
      { trait: 'N', label: '아직 시험 전이니까 모르는 거라고 말해 준다.' },
    ],
  },
  {
    id: 'q20',
    dimension: 'mental',
    question: '모의고사 예상 등급컷이 계속 바뀐다면?',
    options: [
      { trait: 'A', label: '내 등급이 달라질까 봐 자꾸 새로고침하게 된다.' },
      { trait: 'N', label: '확정되면 그때 확인하기로 한다.' },
    ],
  },
  {
    id: 'q21',
    dimension: 'mental',
    question: '수능 D-1 알림이 뜬 순간 나의 반응은?',
    options: [
      { trait: 'A', label: '벌써 내일이라니, 심장이 두근두근한다.' },
      { trait: 'N', label: '드디어 내일이네. 준비한 걸 보여줄 차례다.' },
    ],
  },
]
