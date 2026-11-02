export type ReleaseNote = {
  version: string
  changes: readonly string[]
}

/**
 * What changed in the career simulator, newest first. Semantic versioning:
 * every merged pull request that touched the game is one patch release.
 */
export const RELEASE_NOTES: readonly ReleaseNote[] = [
  {
    version: '1.0.7',
    changes: ['검색 결과에 게임 제목과 소개가 보이도록 페이지 정보를 달고 사이트맵에 추가했어요.'],
  },
  {
    version: '1.0.6',
    changes: [
      '연애 중에만 나오는 이벤트 "모의고사 전날 데이트"를 추가했어요.',
      '결과가 하나로 정해져 있던 선택지 9개에 일이 꼬이는 결과를 더했어요.',
      '전설의 일타강사를 만났을 때 대역전이 일어날 확률을 5%에서 20%로 올렸어요.',
      '고3 인강 몰아 듣기의 결과 확률을 50:50으로 맞췄어요.',
      '커리어 요약의 전체 성적 변화와 주요 이벤트를 접었다 펼칠 수 있게 했어요.',
      '대학 지원 뒤 수능 성적표에는 이벤트를 다시 보여 주지 않아요.',
      '"재미로 보는 가상 시뮬레이션" 안내는 시작 화면에만 보여 줘요.',
    ],
  },
  {
    version: '1.0.5',
    changes: ['진행 화면의 성적 변화 그래프도 눌러서 열고 닫을 수 있고, 열렸는지 화살표로 보여 줘요.'],
  },
  {
    version: '1.0.4',
    changes: ['모바일에서 결과를 공유할 때 문구 끝에 빈 줄이 붙지 않아요.'],
  },
  {
    version: '1.0.3',
    changes: ['공유한 결과 링크의 미리보기 카드에 게임 제목과 소개가 보여요.'],
  },
  {
    version: '1.0.2',
    changes: ['재수 해의 6월 모의평가 성적표가 작년 수능과 비교해 알려 주고, 작은 변화도 따로 구분해요.'],
  },
  {
    version: '1.0.1',
    changes: ['커리어 결과를 이미지로 저장하고 링크로 공유할 수 있어요.'],
  },
  {
    version: '1.0.0',
    changes: ['수험생 커리어 시뮬레이터 출시'],
  },
]
