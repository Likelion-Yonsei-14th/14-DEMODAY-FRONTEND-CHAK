import type { Dimension, Trait } from './studyTypeQuestions'

export const STUDY_TYPE_CODES = [
  'PSA',
  'PSN',
  'PFA',
  'PFN',
  'LSA',
  'LSN',
  'LFA',
  'LFN',
] as const

export type StudyTypeCode = (typeof STUDY_TYPE_CODES)[number]

export function isStudyTypeCode(value: unknown): value is StudyTypeCode {
  return (
    typeof value === 'string' &&
    (STUDY_TYPE_CODES as readonly string[]).includes(value)
  )
}

export type StudyTip = { title: string; body: string }

export type CharacterAsset = {
  /** Shown to screen readers and used as the <img> alt text. */
  alt: string
  /**
   * Path to a finished illustration (e.g. `/assets/minigame/study-type/psa.webp`).
   * While null, the built-in placeholder drawing in studyTypeCharacters.ts is used.
   */
  imageSrc: string | null
  /** Soft background behind the character on cards and the share image. */
  background: string
}

export type StudyTypeResult = {
  /** Internal classification only; never shown to users. */
  typeCode: StudyTypeCode
  /** Public name used in result URLs, so links don't reveal the code. */
  slug: string
  typeName: string
  tagline: string
  description: string
  characteristics: string[]
  relatableMoments: string[]
  strengths: string[]
  cautions: string[]
  studyTips: StudyTip[]
  compatibleType: {
    typeCode: StudyTypeCode
    reason: string
    complement: string
  }
  characterAsset: CharacterAsset
}

export const TRAIT_LABELS: Record<Trait, string> = {
  P: '계획형',
  L: '즉흥형',
  S: '혼공형',
  F: '함께형',
  A: '걱정형',
  N: '태평형',
}

export const DIMENSION_COPY: Record<
  Dimension,
  {
    title: string
    /** Used when the answers split 4:3 - both sides clearly show up. */
    balanced: string
    lean: Record<string, string>
  }
> = {
  plan: {
    title: '공부 계획',
    balanced:
      '계획을 세우는 날도, 그날그날 정하는 날도 있어요. 상황에 따라 두 방식을 오가는 편이에요.',
    lean: {
      P: '미리 정해 둔 순서가 있을 때 마음 편히 공부에 들어가는 편이에요.',
      L: '그날의 컨디션과 필요에 맞춰 공부 순서를 바꾸는 편이에요.',
    },
  },
  environment: {
    title: '공부 환경',
    balanced:
      '혼자 파고드는 시간도, 같이 공부하는 시간도 모두 필요하다고 느끼는 편이에요.',
    lean: {
      S: '방해받지 않는 나만의 시간에 집중력이 올라가는 편이에요.',
      F: '누군가와 같이 공부할 때 에너지를 얻는 편이에요.',
    },
  },
  mental: {
    title: '시험 멘탈',
    balanced:
      '긴장할 때도 있지만 금방 마음을 다잡기도 해요. 두 모습이 비슷하게 나타났어요.',
    lean: {
      A: '시험을 앞두고 여러 상황을 미리 떠올리며 꼼꼼히 대비하는 편이에요.',
      N: '지나간 일보다 지금 할 수 있는 일에 집중하는 편이에요.',
    },
  },
}

export const STUDY_TYPE_RESULTS: Record<StudyTypeCode, StudyTypeResult> = {
  PSA: {
    typeCode: 'PSA',
    slug: 'perfect-planner',
    typeName: '완벽주의 플래너',
    tagline: '계획은 완벽한데 왜 이렇게 불안하지?',
    description:
      '오늘 할 일을 칸칸이 채워 두고 하나씩 지워 나갈 때 가장 안심이 돼요. 그만큼 준비에 진심이라 작은 변수에도 마음이 쓰이는 타입이에요.',
    characteristics: [
      '공부 계획을 꼼꼼하게 세워요.',
      '혼자 집중하는 시간을 중요하게 생각해요.',
      '계획이 어긋나면 걱정이 커져요.',
      '시험 준비를 빈틈없이 하고 싶어 해요.',
    ],
    relatableMoments: [
      '플래너를 쓰는 시간이 생각보다 길다.',
      '공부를 많이 했는데도 아직 부족한 것 같다.',
      '계획표에 체크 표시하는 순간이 제일 좋다.',
      '계획이 틀어지면 하루 종일 신경 쓰인다.',
    ],
    strengths: [
      '범위를 빠짐없이 챙기는 꼼꼼함',
      '혼자서도 오래 버티는 집중력',
      '실수를 줄이려는 철저한 대비',
    ],
    cautions: [
      '계획을 지키지 못한 날, 나 자신에게 너무 엄격해질 수 있어요.',
      '준비가 완벽해질 때까지 다음 단계로 넘어가기를 미룰 수 있어요.',
    ],
    studyTips: [
      {
        title: '계획표에 빈칸 하나 남기기',
        body: '하루 계획의 20%는 비워 두세요. 밀린 공부를 채우는 칸이 있으면 계획이 틀어져도 덜 흔들려요.',
      },
      {
        title: '오늘 한 것도 같이 적기',
        body: '자기 전에 못 한 것 대신 해낸 것 세 가지를 적어 보세요. 생각보다 많이 했다는 걸 눈으로 확인할 수 있어요.',
      },
      {
        title: '실전처럼 시간 재고 풀기',
        body: '주 1회는 실제 시험 시간에 맞춰 문제를 풀어 보세요. 미리 겪어 본 상황은 시험장에서 덜 낯설어요.',
      },
    ],
    compatibleType: {
      typeCode: 'LSN',
      reason: '둘 다 혼자 집중하는 시간을 좋아해서, 같은 공간에서 각자 공부하기 편한 조합이에요.',
      complement:
        '느긋한 마이웨이형의 여유가 걱정을 덜어 주고, 완벽주의 플래너의 계획이 마이웨이형에게 길잡이가 돼요.',
    },
    characterAsset: {
      alt: '안경을 쓰고 플래너를 든 부엉이',
      imageSrc: null,
      background: '#e3dbff',
    },
  },
  PSN: {
    typeCode: 'PSN',
    slug: 'routine-master',
    typeName: '마이웨이 루틴 장인',
    tagline: '오늘도 어제처럼, 내 페이스대로.',
    description:
      '매일 같은 시간에 앉아 같은 순서로 공부하는 게 자연스러워요. 주변이 시끄러워도 내 루틴만 지키면 된다는 믿음이 있는 타입이에요.',
    characteristics: [
      '일정한 공부 루틴을 꾸준히 유지해요.',
      '혼자서 묵묵히 공부하는 편이에요.',
      '주변 분위기에 크게 흔들리지 않아요.',
      '자기 페이스를 가장 중요하게 생각해요.',
    ],
    relatableMoments: [
      '공부 시작 전에 꼭 하는 나만의 의식이 있다.',
      '친구들이 시험 범위로 술렁여도 일단 오늘 분량부터 한다.',
      '늘 앉던 자리에 누가 앉아 있으면 살짝 당황한다.',
      '"너 원래 이 시간에 공부하잖아"라는 말을 자주 듣는다.',
    ],
    strengths: [
      '컨디션에 덜 흔들리는 꾸준함',
      '남과 비교하지 않는 안정감',
      '오래 쌓일수록 빛나는 실력',
    ],
    cautions: [
      '익숙한 방법만 고집하다 더 잘 맞는 공부법을 놓칠 수 있어요.',
      '루틴이 깨지는 날에는 리듬을 되찾는 데 시간이 걸릴 수 있어요.',
    ],
    studyTips: [
      {
        title: '한 달에 한 번 루틴 점검',
        body: '월말에 모의고사 결과를 보고 루틴 중 하나만 바꿔 보세요. 꾸준함은 지키면서 약점은 보완할 수 있어요.',
      },
      {
        title: '비상용 미니 루틴 만들기',
        body: '시간이 없는 날을 위한 30분짜리 루틴을 따로 정해 두세요. 루틴이 끊기지 않으면 다음 날 회복이 빨라요.',
      },
      {
        title: '수능 시간표로 하루 보내기',
        body: '시험 몇 주 전부터는 기상과 공부 시간을 수능 시간표에 맞춰 보세요. 루틴 장인에게 가장 든든한 준비예요.',
      },
    ],
    compatibleType: {
      typeCode: 'LSA',
      reason: '혼자 공부하는 걸 좋아하는 두 사람이라, 말없이 옆자리를 지켜 주는 메이트가 될 수 있어요.',
      complement:
        '루틴 장인의 안정감이 마감 직전 각성자의 불안을 가라앉히고, 각성자의 몰입력이 루틴 장인에게 새로운 자극이 돼요.',
    },
    characterAsset: {
      alt: '차분하게 책을 읽는 거북이',
      imageSrc: null,
      background: '#cdefe4',
    },
  },
  PFA: {
    typeCode: 'PFA',
    slug: 'study-leader',
    typeName: '열정 과다 스터디장',
    tagline: '얘들아, 오늘 공부 인증 왜 안 올려?',
    description:
      '같이 목표를 세우고 함께 달성할 때 가장 힘이 나요. 시험이 다가올수록 나도, 친구들도 제대로 준비하고 있는지 챙기게 되는 타입이에요.',
    characteristics: [
      '친구들과 공부 계획을 공유해요.',
      '스터디나 공부 인증을 좋아해요.',
      '시험이 가까워지면 긴장감이 높아져요.',
      '다른 사람들과 함께 목표를 이루고 싶어 해요.',
    ],
    relatableMoments: [
      '단톡방에 스터디 규칙을 먼저 올려 본 적이 있다.',
      '친구가 인증을 안 하면 괜히 내가 더 신경 쓰인다.',
      '시험 범위 정리본을 만들어서 나눠 준 적이 있다.',
      '다들 공부하고 있다는 걸 확인해야 마음이 놓인다.',
    ],
    strengths: [
      '사람들을 모으고 이끄는 추진력',
      '함께하는 목표를 끝까지 챙기는 책임감',
      '긴장을 준비로 바꾸는 부지런함',
    ],
    cautions: [
      '다른 사람의 진도까지 챙기다 내 공부 시간이 줄어들 수 있어요.',
      '친구들의 불안까지 함께 짊어지면 쉽게 지칠 수 있어요.',
    ],
    studyTips: [
      {
        title: '스터디 시간과 내 시간 나누기',
        body: '하루 중 스터디에 쓰는 시간을 정해 두고, 그 밖의 시간은 알림을 꺼 두세요. 리더도 혼자 공부할 시간이 필요해요.',
      },
      {
        title: '친구에게 설명하며 복습하기',
        body: '헷갈리는 개념을 친구에게 설명해 보세요. 말로 풀어내다 보면 내가 아는 것과 모르는 것이 선명해져요.',
      },
      {
        title: '인증은 결과보다 과정으로',
        body: '"몇 시간 했다" 대신 "오늘 무엇을 이해했다"를 인증해 보세요. 비교 대신 서로의 성장을 응원하게 돼요.',
      },
    ],
    compatibleType: {
      typeCode: 'LFN',
      reason: '둘 다 같이 공부하는 걸 좋아해서, 스터디를 꾸리면 분위기가 금방 살아나는 조합이에요.',
      complement:
        '일단 카공부터형의 여유가 스터디장의 긴장을 풀어 주고, 스터디장의 계획이 카공부터형의 공부 시간을 알차게 채워 줘요.',
    },
    characterAsset: {
      alt: '체크리스트와 확성기를 든 여우',
      imageSrc: null,
      background: '#ffd9cf',
    },
  },
  PFN: {
    typeCode: 'PFN',
    slug: 'challenge-collector',
    typeName: '갓생 챌린지 수집가',
    tagline: '오늘도 공부 인증 완료!',
    description:
      '작은 목표를 하나씩 달성하고 친구들과 인증하는 재미로 공부해요. 오늘 못 했으면 내일 다시 하면 된다는 긍정 에너지가 있는 타입이에요.',
    characteristics: [
      '친구들과 함께 루틴을 실천해요.',
      '공부 인증과 챌린지를 즐겨요.',
      '긍정적인 분위기에서 동기부여를 얻어요.',
      '꾸준히 쌓이는 성취를 중요하게 생각해요.',
    ],
    relatableMoments: [
      '공부 타이머 기록을 캡처해 두는 게 습관이다.',
      '챌린지 연속 기록이 끊기기 직전에 겨우 지켜 낸 적이 있다.',
      '친구의 인증에 하트를 누르는 것도 내 루틴 중 하나다.',
      '다 쓴 문제집을 쌓아 두고 사진 찍고 싶어진다.',
    ],
    strengths: [
      '작은 성취를 꾸준히 이어 가는 힘',
      '주변까지 밝게 만드는 긍정 에너지',
      '실패해도 금방 다시 시작하는 회복력',
    ],
    cautions: [
      '인증하기 좋은 공부에 시간이 쏠리고, 어려운 부분은 뒤로 밀릴 수 있어요.',
      '공부 시간 기록에 집중하다 실제 이해도를 놓칠 수 있어요.',
    ],
    studyTips: [
      {
        title: '약점 과목 챌린지 만들기',
        body: '가장 미루게 되는 과목으로 7일 챌린지를 열어 보세요. 인증하는 재미가 약점 공략의 원동력이 돼요.',
      },
      {
        title: '시간 대신 문제 수로 기록',
        body: '공부 시간과 함께 맞힌 문제 수나 외운 개념 수도 기록해 보세요. 숫자가 늘어나는 게 눈에 보여요.',
      },
      {
        title: '주말엔 스스로 점검하기',
        body: '일주일에 한 번은 인증 없이 혼자 지난주 내용을 테스트해 보세요. 쌓아 온 것이 진짜 내 것이 됐는지 확인할 수 있어요.',
      },
    ],
    compatibleType: {
      typeCode: 'LFA',
      reason: '함께 공부할 때 힘이 나는 두 사람이라, 같이 있으면 공부 분위기가 금방 만들어져요.',
      complement:
        '챌린지 수집가의 꾸준한 루틴이 밤샘 총대장의 리듬을 잡아 주고, 총대장의 몰입력이 챌린지에 깊이를 더해 줘요.',
    },
    characterAsset: {
      alt: '노트와 별 스티커를 든 강아지',
      imageSrc: null,
      background: '#ffedb3',
    },
  },
  LSA: {
    typeCode: 'LSA',
    slug: 'last-minute-awakener',
    typeName: '마감 직전 각성자',
    tagline: '아직 안 늦었어. 지금부터 진짜 시작이다.',
    description:
      '평소엔 그날 끌리는 공부를 하다가, 시험이 다가오면 누구보다 무섭게 몰입해요. 긴장감이 오히려 집중의 스위치가 되는 타입이에요.',
    characteristics: [
      '상황에 따라 공부 계획을 유연하게 바꿔요.',
      '혼자 몰입해서 공부하는 편이에요.',
      '시험이 다가오면 긴장감이 커져요.',
      '마감이 가까워질수록 집중력이 높아져요.',
    ],
    relatableMoments: [
      '시험 3일 전의 내가 한 달 치 공부를 해낸 적이 있다.',
      '"이번엔 미리 해야지"를 매번 다짐한다.',
      '밤 11시가 넘으면 갑자기 집중이 잘된다.',
      '책상 정리부터 시작했는데 정신 차려 보니 새벽이다.',
    ],
    strengths: [
      '짧은 시간에 몰아치는 폭발적인 집중력',
      '급한 상황에서도 우선순위를 찾는 판단력',
      '혼자서도 끝까지 해내는 뒷심',
    ],
    cautions: [
      '마감 직전 몰아치기가 반복되면 컨디션이 무너질 수 있어요.',
      '시험 직전 불안이 커지면 수면 시간부터 줄이게 될 수 있어요.',
    ],
    studyTips: [
      {
        title: '가짜 마감일 만들기',
        body: '실제 시험보다 일주일 앞선 날짜를 나만의 마감일로 정해 보세요. 각성 모드를 조금 더 일찍 켤 수 있어요.',
      },
      {
        title: '25분 집중 + 5분 휴식',
        body: '몰입이 잘 될 때도 타이머로 쉬는 시간을 챙기세요. 짧게 끊어야 각성 모드가 더 오래 가요.',
      },
      {
        title: '잠은 공부 계획에 포함하기',
        body: '시험 2주 전부터는 취침 시간을 정해 두세요. 각성자의 집중력은 잘 잔 다음 날 가장 빛나요.',
      },
    ],
    compatibleType: {
      typeCode: 'PSN',
      reason: '둘 다 혼자 공부하는 걸 좋아해서, 같은 독서실에서 각자의 페이스를 존중해 줄 수 있어요.',
      complement:
        '루틴 장인의 꾸준함이 각성자에게 미리 시작하는 습관을 알려 주고, 각성자의 몰입력은 루틴 장인에게 좋은 자극이 돼요.',
    },
    characterAsset: {
      alt: '알람시계와 책더미 사이에서 공부하는 햄스터',
      imageSrc: null,
      background: '#ffd3e6',
    },
  },
  LSN: {
    typeCode: 'LSN',
    slug: 'easygoing-solo',
    typeName: '느긋한 마이웨이형',
    tagline: '급할 거 있나? 내 방식대로 하면 되지.',
    description:
      '정해진 시간표보다 그날의 컨디션을 믿어요. 시험 전에도 내 페이스를 잃지 않고, 혼자만의 방식으로 차근차근 해 나가는 타입이에요.',
    characteristics: [
      '정해진 시간표에 크게 얽매이지 않아요.',
      '혼자 공부하는 시간을 좋아해요.',
      '시험을 앞두고도 비교적 침착해요.',
      '그날의 컨디션에 따라 공부를 조절해요.',
    ],
    relatableMoments: [
      '공부할 때 들을 플레이리스트 고르는 데 진심이다.',
      '친구들이 불안해할 때 "괜찮아, 아직 시간 있어"라고 말해 준다.',
      '컨디션이 좋은 날은 하루 만에 한 단원을 끝내기도 한다.',
      '플래너는 샀는데 첫 장만 깨끗하게 채워져 있다.',
    ],
    strengths: [
      '압박 속에서도 흔들리지 않는 침착함',
      '나에게 맞는 방법을 찾아내는 감각',
      '번아웃이 잘 오지 않는 여유',
    ],
    cautions: [
      '여유가 길어지면 시작 시점이 자꾸 늦어질 수 있어요.',
      '혼자 판단하다 보면 부족한 과목을 늦게 알아챌 수 있어요.',
    ],
    studyTips: [
      {
        title: '오늘의 최소 분량 정하기',
        body: '컨디션과 상관없이 하루에 꼭 하는 최소 분량 하나만 정해 두세요. 여유는 지키면서 공백은 줄일 수 있어요.',
      },
      {
        title: '주간 목표만 느슨하게',
        body: '하루 계획 대신 이번 주에 끝낼 단원만 정해 보세요. 순서는 그날 기분대로 골라도 괜찮아요.',
      },
      {
        title: '모의고사로 위치 확인하기',
        body: '정기적으로 모의고사를 풀고 과목별 점수를 기록해 두세요. 혼자 공부해도 방향을 잃지 않아요.',
      },
    ],
    compatibleType: {
      typeCode: 'PSA',
      reason: '서로 말 걸지 않아도 편한 조용한 공부 메이트가 될 수 있어요.',
      complement:
        '완벽주의 플래너의 계획이 마이웨이형에게 방향을 잡아 주고, 마이웨이형의 여유가 플래너의 긴장을 풀어 줘요.',
    },
    characterAsset: {
      alt: '헤드폰을 쓰고 여유롭게 공부하는 고양이',
      imageSrc: null,
      background: '#d6e2ff',
    },
  },
  LFA: {
    typeCode: 'LFA',
    slug: 'all-nighter-captain',
    typeName: '단체 밤샘 총대장',
    tagline: '야, 오늘 밤 같이 공부할 사람 구함.',
    description:
      '혼자 있으면 걱정이 커지지만, 친구들과 함께라면 밤새 공부할 힘이 생겨요. 분위기를 만들고 사람을 모으는 데 타고난 타입이에요.',
    characteristics: [
      '친구들과 공부할 때 동기부여를 얻어요.',
      '계획보다 상황에 맞춰 움직여요.',
      '시험이 가까워지면 불안해질 수 있어요.',
      '다른 사람과 함께 긴장을 풀어 내는 편이에요.',
    ],
    relatableMoments: [
      '시험 전날 "지금 깨어 있는 사람?"을 보내 본 적이 있다.',
      '혼자 공부하면 걱정이 커지는데, 같이 하면 이상하게 괜찮다.',
      '공부하다 출출해지면 간식 메뉴부터 정한다.',
      '같이 밤새운 친구들과는 전우애가 생긴다.',
    ],
    strengths: [
      '분위기를 띄워 모두를 공부하게 만드는 힘',
      '급한 상황에서 사람을 모으는 행동력',
      '서로의 불안을 알아채고 다독이는 공감력',
    ],
    cautions: [
      '같이 있는 시간이 길어지면 공부보다 수다가 길어질 수 있어요.',
      '밤샘이 반복되면 시험 당일 컨디션이 흔들릴 수 있어요.',
    ],
    studyTips: [
      {
        title: '밤샘 대신 아침 스터디',
        body: '친구들과 아침 7시 스터디를 잡아 보세요. 함께하는 힘은 그대로, 수면 리듬은 수능 시간에 맞춰져요.',
      },
      {
        title: '50분 공부, 10분 수다',
        body: '같이 공부할 땐 타이머로 공부와 휴식 시간을 나눠 보세요. 쉬는 시간이 정해져 있으면 오히려 더 집중돼요.',
      },
      {
        title: '걱정은 종이에 적고 넘기기',
        body: '불안할 때는 걱정되는 것을 적고, 그중 지금 할 수 있는 일 하나만 골라 시작해 보세요.',
      },
    ],
    compatibleType: {
      typeCode: 'PFN',
      reason: '둘 다 같이 공부하는 걸 좋아해서, 만나면 바로 스터디가 열리는 조합이에요.',
      complement:
        '챌린지 수집가의 규칙적인 루틴이 총대장의 밤샘을 줄여 주고, 총대장의 추진력이 챌린지를 더 뜨겁게 만들어 줘요.',
    },
    characterAsset: {
      alt: '커피와 교재를 들고 밤샘 공부하는 너구리',
      imageSrc: null,
      background: '#e1dbd0',
    },
  },
  LFN: {
    typeCode: 'LFN',
    slug: 'cafe-first',
    typeName: '일단 카공부터형',
    tagline: '공부? 일단 카페부터 정하자.',
    description:
      '어디서, 누구와 공부하느냐가 오늘의 공부를 좌우해요. 마음에 드는 공간과 좋은 사람만 있으면 시험 앞에서도 여유롭게 집중하는 타입이에요.',
    characteristics: [
      '공부 장소와 분위기를 중요하게 생각해요.',
      '친구들과 함께 공부하는 걸 좋아해요.',
      '정해진 계획보다 유연한 방식을 선호해요.',
      '시험 상황에서도 비교적 여유를 유지해요.',
    ],
    relatableMoments: [
      '콘센트 있는 자리를 찾는 눈이 남다르다.',
      '공부 장소를 고르는 데만 30분을 쓴 적이 있다.',
      '친구와 각자 공부하다가 가끔 눈 마주치는 게 좋다.',
      '분위기 좋은 곳에서는 평소보다 두 배로 집중된다.',
    ],
    strengths: [
      '나에게 맞는 공부 환경을 찾는 감각',
      '어디서든 금방 적응하는 유연함',
      '주변 사람까지 편하게 만드는 여유',
    ],
    cautions: [
      '장소를 고르고 이동하는 데 공부 시간이 생각보다 많이 쓰일 수 있어요.',
      '분위기가 좋을수록 공부보다 대화가 길어질 수 있어요.',
    ],
    studyTips: [
      {
        title: '단골 공부 장소 정해 두기',
        body: '집중이 잘 되는 장소 두세 곳을 정해 두세요. 고민하는 시간이 줄고 앉자마자 공부를 시작할 수 있어요.',
      },
      {
        title: '도착하면 바로 15분 집중',
        body: '자리에 앉으면 대화 전에 15분만 먼저 집중해 보세요. 시작이 빠르면 그날 공부 흐름이 달라져요.',
      },
      {
        title: '시험장 같은 환경도 연습',
        body: '가끔은 조용한 독서실에서 모의고사를 풀어 보세요. 낯선 시험장에서도 평소 실력이 나와요.',
      },
    ],
    compatibleType: {
      typeCode: 'PFA',
      reason: '둘 다 함께 공부하는 걸 좋아해서, 스터디를 같이 하면 시너지가 큰 조합이에요.',
      complement:
        '스터디장의 계획력이 카공부터형의 공부를 알차게 만들어 주고, 카공부터형의 여유가 스터디장의 긴장을 풀어 줘요.',
    },
    characterAsset: {
      alt: '아이스커피와 노트를 든 펭귄',
      imageSrc: null,
      background: '#dcf0f7',
    },
  },
}

export function findStudyTypeBySlug(slug: string | undefined) {
  return Object.values(STUDY_TYPE_RESULTS).find((result) => result.slug === slug)
}
