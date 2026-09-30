import { PrototypePlaceholderPage } from './PrototypePlaceholderPage'

export function DeskPage() {
  return (
    <PrototypePlaceholderPage
      title="Owner Desk"
      phase="P4"
      summary="수험생이 친구들이 놓고 간 응원 오브젝트를 발견하고 직접 눌러 읽는 홈 화면입니다."
      decisions={[
        '카드 목록보다 Desk Scene과 Object가 먼저 보인다.',
        '1–8개는 개별 Object, 9개 이상은 일부 Stack/Cluster로 정리한다.',
        'Daily와 Time Capsule의 잠금 상태는 Object의 시각 상태로 표현한다.',
        'Object를 누르면 Common Reader로 진입한다.',
      ]}
    />
  )
}

export function ComposerPage() {
  return (
    <PrototypePlaceholderPage
      title="Unified Composer"
      phase="P2–3"
      summary="친구가 응원을 남길 때 모드를 먼저 고르지 않고, 하나의 카드 위에서 필요한 기능만 조합합니다."
      decisions={[
        '한 줄 / 사진 / 꾸미기 / 편지 모드 선택을 제거한다.',
        '하단 탭은 배경 · 글자 · 문구 · 스티커 · 사진으로 고정한다.',
        '기본 Canvas는 4:5이고 본문 포함 자유 배치가 가능하다.',
        'Long Card는 본문 Auto-flow이며 같은 탭을 유지한다.',
        'Long에서 못 쓰는 에셋은 숨기지 않고 Restricted로 표시한다.',
      ]}
    />
  )
}

export function ReaderPage() {
  return (
    <PrototypePlaceholderPage
      title="Common Reader"
      phase="P4"
      summary="Personal Desk와 Class Locker에서 같은 Reader Shell을 공유하고 콘텐츠 표현만 달라집니다."
      decisions={[
        'Desk/Locker Object가 Reader의 진입점이다.',
        '작성자 · 날짜 · 공개상태 · 닫기/신고 구조는 공통이다.',
        '카드의 배경과 꾸밈 결과를 그대로 읽을 수 있게 보여준다.',
        '읽은 뒤에는 원래 공간으로 자연스럽게 돌아간다.',
      ]}
    />
  )
}

export function ClaimPage() {
  return (
    <PrototypePlaceholderPage
      title="Creator / Claim"
      phase="P5"
      summary="친구가 먼저 만든 응원 공간을 실제 수험생이 Claim하면 소유권과 설정 권한이 이전됩니다."
      decisions={[
        'Claim 전 Creator는 기본 Desk 설정과 공유를 할 수 있다.',
        'Claim 후 실제 수험생은 Owner가 된다.',
        '기존 Creator는 일반 Supporter 수준의 권한으로 전환된다.',
        '동명이인 Desk는 자동 병합하지 않는다.',
      ]}
    />
  )
}

export function ClassroomPage() {
  return (
    <PrototypePlaceholderPage
      title="Classroom"
      phase="P6"
      summary="메타버스가 아닌 정적인 2D 교실에서 Blackboard와 학생별 Locker를 통해 응원을 주고받습니다."
      decisions={[
        'Blackboard는 반 전체가 보는 공유 메시지 공간이다.',
        'Locker는 개인 메시지 Object가 쌓이는 공간이다.',
        'Locker도 1–8개 개별 표시, 9개 이상 Stack/Cluster를 적용한다.',
        'Locker Object 역시 Common Reader를 사용한다.',
      ]}
    />
  )
}
