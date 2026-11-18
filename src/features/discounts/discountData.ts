/** 수험표 할인 한 건. 출처가 있는 올해(2027학년도 수능) 혜택만 넣는다. 날짜는 한국 날짜(YYYY-MM-DD). */
export type Discount = {
  /** 서버에서 받은 혜택의 번호. 아래 묶음 데이터에는 없다. */
  id?: number
  /** 어드민에서 숨김 여부. 사용자 목록에는 켜 둔 것만 온다. */
  visible?: boolean
  brand: string
  category: DiscountCategory
  benefit: string
  /** 시작일. 출처에 없으면 null(이미 진행 중으로 본다). */
  start: string | null
  /** 마지막 날. 출처에 없으면 null(끝나는 날을 모름). */
  end: string | null
  conditions: string
  /** 걸러 보기용 시·도("서울", "경기") 또는 "전국". */
  area: string
  /** 화면에 보여 줄 자세한 위치("경기 용인"). 전국이거나 모르면 빈 값. */
  place: string
  sourceUrl: string
  /** 출처가 올라온 날. 페이지에 날짜가 없으면 빈 값. */
  sourceDate: string
  /** 카드에 크게 보여 줄 한마디("2만원", "50%"). 없으면 혜택 문장만 보여 준다. */
  highlight?: string
  /** 챙겨 갈 것("2027학년도 수험표 원본", "신분증"). */
  bring?: readonly string[]
  /** 받는 방법: 현장, 사전 예약, 앱·온라인, 전화 예약. */
  howTo?: string
  /** 같이 가는 사람 혜택("동반 3명까지 같은 가격"). */
  companions?: string
  /** 적용 지점("전국 매장(일부 제외)"). */
  branches?: string
  /** 브랜드·시설이 직접 올린 대표 이미지(공식 홈페이지·공지의 og:image). 뉴스 사진은 쓰지 않는다. */
  image?: string
  /** 이미지를 가져온 공식 페이지. */
  imageSource?: string
}

export const DISCOUNT_CATEGORIES = ['놀이·체험', '음식·카페', '뷰티·미용', '안경·렌즈', '영화·공연', '여행·숙박', '패션·쇼핑', '운동·건강', '교육'] as const
export type DiscountCategory = (typeof DISCOUNT_CATEGORIES)[number]

/**
 * 아래 목록은 서버(어드민 > 혜택함 관리)로 옮겼다. 서버에 연결하지 않는 개발 화면과,
 * 서버 목록을 받지 못했을 때만 쓴다. 고칠 때는 어드민에서 고친다.
 */
/** 마지막으로 모은 날. 화면에 "11월 16일 기준"으로 보여 준다. */
export const DISCOUNTS_UPDATED = '2026-11-17'

export const DISCOUNTS: readonly Discount[] = [
  {
    "brand": "에버랜드",
    "category": "놀이·체험",
    "benefit": "수험생 이용권 2만원, 동반 최대 3명 1인 3만원",
    "start": "2026-11-11",
    "end": "2026-12-31",
    "conditions": "수시 지원·합격자도 대상이에요. 다른 쿠폰·카드 할인과 중복은 안 돼요.",
    "area": "경기",
    "place": "경기 용인",
    "sourceUrl": "https://www.wikitree.co.kr/articles/1173741",
    "sourceDate": "2026-11-11",
    "highlight": "2만원",
    "bring": [
      "사진 있는 2027학년도 수험표 원본",
      "신분증(사진 없는 서류일 때)"
    ],
    "howTo": "사전 예약",
    "companions": "동반 최대 3명 1인 3만원",
    "branches": "에버랜드(용인)",
    "image": "https://www.everland.com/contents/ia/contents/common/everland_thumbnail.jpg",
    "imageSource": "https://www.everland.com"
  },
  {
    "brand": "롯데월드 어드벤처",
    "category": "놀이·체험",
    "benefit": "종합이용권 27,000원",
    "start": "2026-11-19",
    "end": "2026-12-31",
    "conditions": "",
    "area": "서울",
    "place": "서울 송파",
    "sourceUrl": "https://www.fnnews.com/news/202611111036200244",
    "sourceDate": "2026-11-11",
    "highlight": "2.7만원",
    "bring": [
      "2027학년도 수험표",
      "신분증"
    ],
    "howTo": "현장",
    "branches": "잠실 롯데월드 어드벤처",
    "image": "https://adventure.lotteworld.com/og/og_img_adventure.jpg",
    "imageSource": "https://adventure.lotteworld.com"
  },
  {
    "brand": "롯데월드 어드벤처 부산",
    "category": "놀이·체험",
    "benefit": "종합이용권 20,000원",
    "start": "2026-11-19",
    "end": "2026-12-31",
    "conditions": "",
    "area": "부산",
    "place": "부산 기장",
    "sourceUrl": "https://www.fnnews.com/news/202611111036200244",
    "sourceDate": "2026-11-11",
    "highlight": "2만원",
    "bring": [
      "2027학년도 수험표",
      "신분증"
    ],
    "howTo": "현장",
    "branches": "롯데월드 어드벤처 부산",
    "image": "https://adventurebusan.lotteworld.com/og/og_img_adventurebusan.jpg",
    "imageSource": "https://adventurebusan.lotteworld.com"
  },
  {
    "brand": "롯데월드 아쿠아리움",
    "category": "놀이·체험",
    "benefit": "입장권 18,500원",
    "start": "2026-11-19",
    "end": "2026-11-30",
    "conditions": "",
    "area": "서울",
    "place": "서울 송파",
    "sourceUrl": "https://www.fnnews.com/news/202611111036200244",
    "sourceDate": "2026-11-11",
    "highlight": "1.85만원",
    "bring": [
      "2027학년도 수험표",
      "신분증"
    ],
    "howTo": "현장",
    "branches": "롯데월드몰 아쿠아리움",
    "image": "https://www.lotteworld.com/og/og_img_lotteworld_group.jpg",
    "imageSource": "https://www.lotteworld.com/aquarium"
  },
  {
    "brand": "서울스카이",
    "category": "놀이·체험",
    "benefit": "입장권 16,500원",
    "start": "2026-11-19",
    "end": "2026-11-30",
    "conditions": "",
    "area": "서울",
    "place": "서울 송파",
    "sourceUrl": "https://www.fnnews.com/news/202611111036200244",
    "sourceDate": "2026-11-11",
    "highlight": "1.65만원",
    "bring": [
      "2027학년도 수험표",
      "신분증"
    ],
    "howTo": "현장",
    "branches": "롯데월드타워 서울스카이",
    "image": "https://seoulsky.lotteworld.com/og/og_img_seoulsky.jpg",
    "imageSource": "https://seoulsky.lotteworld.com"
  },
  {
    "brand": "레고랜드 코리아 리조트",
    "category": "놀이·체험",
    "benefit": "본인 1일권 40%, 동반 최대 3명 30% 할인",
    "start": "2026-11-20",
    "end": "2026-12-18",
    "conditions": "운영일만 돼요. 현장 구매가 기준이고, 파크 안 식음·기념품(정가)도 10% 할인돼요. 방문 횟수 제한은 없지만 올 때마다 증빙이 필요해요.",
    "area": "강원",
    "place": "강원 춘천",
    "sourceUrl": "https://www.businesskorea.co.kr/news/articleView.html?idxno=280292",
    "sourceDate": "2026-11-03",
    "highlight": "40%",
    "bring": [
      "2027학년도 수험표(또는 수시 합격증 등 증빙)",
      "신분증"
    ],
    "howTo": "현장",
    "companions": "동반 최대 3명 30% 할인",
    "branches": "레고랜드(춘천)",
    "image": "https://www.legoland.kr/media/2cdfbvsx/%EC%82%B0%ED%83%80%ED%8C%A8%ED%82%A4%EC%A7%80_%EB%B8%8C%EB%9E%9C%EB%93%9C%EC%9B%B9_pc_%ED%85%8D%EC%8A%A4%ED%8A%B8.png?format=jpg",
    "imageSource": "https://www.legoland.kr"
  },
  {
    "brand": "씨라이프 코엑스 아쿠아리움",
    "category": "놀이·체험",
    "benefit": "본인 1일권 50% 할인(17,500원), 기념품 20%",
    "start": "2026-11-19",
    "end": "2026-12-18",
    "conditions": "수험생 본인만 돼요. 다른 프로모션과 중복은 안 돼요.",
    "area": "서울",
    "place": "서울 강남",
    "sourceUrl": "https://www.businesskorea.co.kr/news/articleView.html?idxno=280292",
    "sourceDate": "2026-11-03",
    "highlight": "50%",
    "bring": [
      "2027학년도 수험표"
    ],
    "howTo": "현장",
    "branches": "코엑스 아쿠아리움",
    "image": "https://www.visitsealife.com/coex-seoul/media/3j2jk004/hp_pc.jpg?format=jpg",
    "imageSource": "https://www.coexaqua.com"
  },
  {
    "brand": "씨라이프 부산 아쿠아리움",
    "category": "놀이·체험",
    "benefit": "본인 1일권 50% 할인(16,000원), 기념품 10%",
    "start": "2026-11-19",
    "end": "2026-12-18",
    "conditions": "수험생 본인만 돼요. 다른 프로모션과 중복은 안 돼요.",
    "area": "부산",
    "place": "부산 해운대",
    "sourceUrl": "https://www.businesskorea.co.kr/news/articleView.html?idxno=280292",
    "sourceDate": "2026-11-03",
    "highlight": "50%",
    "bring": [
      "2027학년도 수험표"
    ],
    "howTo": "현장",
    "branches": "부산 아쿠아리움(해운대)",
    "image": "https://www.visitsealife.com/busan/media/yiyjh0ow/hp_pc.jpg?format=jpg",
    "imageSource": "https://www.busanaquarium.com"
  },
  {
    "brand": "서울랜드",
    "category": "놀이·체험",
    "benefit": "파크이용권 20,500원(정가 52,000원)",
    "start": "2026-11-01",
    "end": "2026-12-31",
    "conditions": "다른 할인 쿠폰·제휴카드와 중복은 안 돼요.",
    "area": "경기",
    "place": "경기 과천",
    "sourceUrl": "https://www.segye.com/newsView/20261114501445",
    "sourceDate": "2026-11-14",
    "highlight": "2.05만원",
    "bring": [
      "수험표·접수증·수시 합격증 원본 중 1개",
      "신분증(학생증·청소년증 가능)"
    ],
    "howTo": "현장",
    "companions": "동반 2명까지 같은 가격",
    "branches": "서울랜드(과천)",
    "image": "https://seoulland.co.kr/_File/siteMng//ogImageFile_1732248626_0.jpg",
    "imageSource": "https://www.seoulland.co.kr"
  },
  {
    "brand": "대전오월드",
    "category": "놀이·체험",
    "benefit": "청소년 자유이용권 50% 할인",
    "start": "2026-11-19",
    "end": "2026-11-30",
    "conditions": "",
    "area": "대전",
    "place": "대전 중구",
    "sourceUrl": "https://www.pressian.com/pages/articles/2026111016031799553",
    "sourceDate": "2026-11-10",
    "highlight": "50%",
    "bring": [
      "수험표",
      "신분증"
    ],
    "howTo": "현장",
    "branches": "대전오월드"
  },
  {
    "brand": "금호리조트 아산스파비스",
    "category": "놀이·체험",
    "benefit": "워터파크 종일권 1만원, 동반 1인 2만원",
    "start": null,
    "end": "2026-12-31",
    "conditions": "",
    "area": "충남",
    "place": "충남 아산",
    "sourceUrl": "https://www.newstap.co.kr/news/articleView.html?idxno=337642",
    "sourceDate": "2026-11-12",
    "highlight": "1만원",
    "bring": [
      "2027학년도 수능 수험표"
    ],
    "howTo": "현장",
    "companions": "동반 인원 제한 없이 1인 2만원",
    "branches": "아산스파비스"
  },
  {
    "brand": "금호화순스파리조트",
    "category": "놀이·체험",
    "benefit": "화순아쿠아나 입장권 50% 할인",
    "start": "2026-11-01",
    "end": "2026-11-30",
    "conditions": "리조트 조식 뷔페와 편의점 커피도 50% 할인돼요.",
    "area": "전남",
    "place": "전남 화순",
    "sourceUrl": "https://www.newstap.co.kr/news/articleView.html?idxno=337642",
    "sourceDate": "2026-11-12",
    "highlight": "50%",
    "bring": [
      "수험표"
    ],
    "howTo": "현장",
    "branches": "금호화순스파리조트"
  },
  {
    "brand": "사천바다케이블카",
    "category": "놀이·체험",
    "benefit": "본인 왕복 1회 무료 탑승",
    "start": "2026-11-20",
    "end": "2027-01-22",
    "conditions": "수험생 본인만 돼요. 일반 캐빈·크리스탈 캐빈 중 고를 수 있어요.",
    "area": "경남",
    "place": "경남 사천",
    "sourceUrl": "https://view.asiae.co.kr/article/2026111615221243787",
    "sourceDate": "2026-11-16",
    "highlight": "무료",
    "bring": [
      "2027학년도 수험표",
      "사진 있는 신분증"
    ],
    "howTo": "현장",
    "companions": "동반인은 정상 요금",
    "branches": "사천바다케이블카"
  },
  {
    "brand": "명량해상케이블카",
    "category": "놀이·체험",
    "benefit": "수험생 1,000원, 동반 최대 3명 1인 3천원 할인",
    "start": "2026-11-19",
    "end": "2026-12-31",
    "conditions": "캐빈 종류와 상관없이 1,000원이에요.",
    "area": "전남",
    "place": "전남 진도",
    "sourceUrl": "https://www.hksisaeconomy.com/news/article.html?no=1294131",
    "sourceDate": "2026-11-16",
    "highlight": "1천원",
    "bring": [
      "2027학년도 수험표"
    ],
    "companions": "동반 최대 3명 1인 3,000원 할인",
    "branches": "명량해상케이블카"
  },
  {
    "brand": "옥토끼우주센터",
    "category": "놀이·체험",
    "benefit": "전시·체험시설 무료입장",
    "start": "2026-11-19",
    "end": "2026-11-22",
    "conditions": "",
    "area": "인천",
    "place": "인천 강화",
    "sourceUrl": "https://www.kyeongin.com/article/1774842",
    "sourceDate": "2026-11-16",
    "highlight": "무료",
    "bring": [
      "수험표"
    ],
    "branches": "옥토끼우주센터"
  },
  {
    "brand": "인천문화예술회관",
    "category": "영화·공연",
    "benefit": "음악극 '서푼짜리 오페라' 50% 할인(1만원)",
    "start": "2026-11-29",
    "end": "2026-12-06",
    "conditions": "",
    "area": "인천",
    "place": "인천 남동구",
    "sourceUrl": "https://www.kyeongin.com/article/1774842",
    "sourceDate": "2026-11-16",
    "highlight": "50%",
    "bring": [
      "수험표"
    ],
    "branches": "인천문화예술회관 소공연장"
  },
  {
    "brand": "계양구청소년수련관",
    "category": "교육",
    "benefit": "원데이 클래스 무료(은반지·헤어)",
    "start": "2026-11-28",
    "end": "2026-11-28",
    "conditions": "수능 마친 수험생과 19세 청소년 대상이에요. 과정별 선착순 10명이에요.",
    "area": "인천",
    "place": "인천 계양구",
    "sourceUrl": "https://www.kyeongin.com/article/1774842",
    "sourceDate": "2026-11-16",
    "highlight": "무료",
    "branches": "계양구청소년수련관"
  },
  {
    "brand": "김해문화의전당",
    "category": "영화·공연",
    "benefit": "지정 공연 6편 50% 할인",
    "start": "2026-11-11",
    "end": null,
    "conditions": "수험생 본인만 돼요. 공연별 예매 마감일까지이고 매진되면 일찍 끝나요.",
    "area": "경남",
    "place": "경남 김해",
    "sourceUrl": "https://www.imaeil.com/page/view/2026111116060709736",
    "sourceDate": "2026-11-11",
    "highlight": "50%",
    "bring": [
      "수험표",
      "신분증 또는 학생증"
    ],
    "howTo": "앱·온라인",
    "branches": "김해문화의전당"
  },
  {
    "brand": "클레이아크김해미술관",
    "category": "영화·공연",
    "benefit": "큐빅하우스 전시 무료(동반 1인 포함)",
    "start": "2026-11-19",
    "end": "2026-12-31",
    "conditions": "매주 월요일은 휴관이에요.",
    "area": "경남",
    "place": "경남 김해",
    "sourceUrl": "https://www.imaeil.com/page/view/2026111116060709736",
    "sourceDate": "2026-11-11",
    "highlight": "무료",
    "bring": [
      "수험표"
    ],
    "howTo": "현장",
    "companions": "동반 1인 무료",
    "branches": "클레이아크김해미술관"
  },
  {
    "brand": "김해천문대",
    "category": "놀이·체험",
    "benefit": "우주영상+천체관측 프로그램 특별 할인가(동반 1인 포함)",
    "start": "2026-11-19",
    "end": "2026-12-29",
    "conditions": "금요일·공휴일은 할인이 안 돼요.",
    "area": "경남",
    "place": "경남 김해",
    "sourceUrl": "https://www.imaeil.com/page/view/2026111116060709736",
    "sourceDate": "2026-11-11",
    "highlight": "특별가",
    "bring": [
      "수험표"
    ],
    "howTo": "현장",
    "companions": "동반 1인 같은 할인",
    "branches": "김해천문대"
  },
  {
    "brand": "김해시민스포츠센터 빙상장",
    "category": "운동·건강",
    "benefit": "이용료 면제",
    "start": "2026-11-19",
    "end": "2026-11-30",
    "conditions": "수험생 본인만 돼요. 스케이트 대여료는 따로 내야 하고 장갑·양말이 필요해요. 단체는 사전 예약이에요.",
    "area": "경남",
    "place": "경남 김해",
    "sourceUrl": "https://www.imaeil.com/page/view/2026111116060709736",
    "sourceDate": "2026-11-11",
    "highlight": "무료",
    "bring": [
      "수험표"
    ],
    "howTo": "현장",
    "branches": "김해시민스포츠센터 빙상장"
  },
  {
    "brand": "수험생 쉼표콘서트(10CM·소수빈)",
    "category": "영화·공연",
    "benefit": "수험생 권종 1인 10,000원(일반 30,000원)",
    "start": "2026-11-21",
    "end": "2026-11-21",
    "conditions": "2027학년도 수능 응시자 대상이에요. 수험생 권종은 1인 4매까지이고 양도는 안 돼요. 서류를 안 가져오면 현장에서 예매가 취소돼요.",
    "area": "경기",
    "place": "경기 용인",
    "sourceUrl": "https://nol.yanolja.com/ticket/products/26015215",
    "sourceDate": "",
    "highlight": "1만원",
    "bring": [
      "수험표 원본 실물(또는 응시 확인 공식 서류)"
    ],
    "howTo": "앱·온라인",
    "companions": "본인 포함 동반 3명까지 수험생 가격",
    "branches": "용인포은아트홀"
  },
  {
    "brand": "준오헤어",
    "category": "뷰티·미용",
    "benefit": "수험생 50%, 동반 고객 30% 할인",
    "start": "2026-11-19",
    "end": "2026-12-31",
    "conditions": "다른 이벤트와 중복은 안 돼요. 20만원 이상 결제하면 굿즈 1개를 줘요.",
    "area": "전국",
    "place": "",
    "sourceUrl": "https://www.wolyo.co.kr/news/articleView.html?idxno=320541",
    "sourceDate": "2026-11-16",
    "highlight": "50%",
    "bring": [
      "수험생 증빙 서류"
    ],
    "companions": "동반 고객(가족·지인) 30% 할인"
  },
  {
    "brand": "다비치안경",
    "category": "안경·렌즈",
    "benefit": "안경테·렌즈 20%, 동반 고객 10% 할인",
    "start": null,
    "end": "2026-11-30",
    "conditions": "",
    "area": "전국",
    "place": "",
    "sourceUrl": "https://www.shinailbo.co.kr/news/articleView.html?idxno=5079405",
    "sourceDate": "2026-11-05",
    "highlight": "20%",
    "bring": [
      "수험표·고3 학생증·응시원서 접수증 중 1개"
    ],
    "howTo": "현장",
    "companions": "동반 고객 10% 할인",
    "branches": "전국 매장"
  },
  {
    "brand": "라그릴리아",
    "category": "음식·카페",
    "benefit": "온더스톤 스테이크 부채살·BBQ 폭립 플래터 50% 할인",
    "start": "2026-11-10",
    "end": "2026-11-30",
    "conditions": "5만원 이상 주문 시 테이블당 1회예요. 공항점 등 일부 매장은 빠져요.",
    "area": "전국",
    "place": "",
    "sourceUrl": "https://newsway.co.kr/news/view?ud=2026111315254931805",
    "sourceDate": "2026-11-14",
    "highlight": "50%",
    "bring": [
      "수험표 또는 수능 응시원서 접수증"
    ],
    "howTo": "현장",
    "branches": "전국 매장(일부 제외)"
  },
  {
    "brand": "스트릿",
    "category": "음식·카페",
    "benefit": "밀크티 또는 레몬에이드 1잔 무료",
    "start": "2026-11-10",
    "end": "2026-11-30",
    "conditions": "공항점 등 일부 매장은 빠져요.",
    "area": "전국",
    "place": "",
    "sourceUrl": "https://newsway.co.kr/news/view?ud=2026111315254931805",
    "sourceDate": "2026-11-14",
    "highlight": "무료",
    "bring": [
      "수험표 또는 수능 응시원서 접수증"
    ],
    "howTo": "현장",
    "branches": "전국 매장(공항점 등 제외)"
  },
  {
    "brand": "63레스토랑",
    "category": "음식·카페",
    "benefit": "워킹온더클라우드·슈치쿠·백리향 지정 코스 40% 할인",
    "start": "2026-11-19",
    "end": "2026-11-30",
    "conditions": "테이블당 수험생 1명만 적용돼요. 동반인 할인·다른 할인과 중복은 안 돼요.",
    "area": "서울",
    "place": "서울 영등포",
    "sourceUrl": "https://newsway.co.kr/news/view?ud=2026111315254931805",
    "sourceDate": "2026-11-14",
    "highlight": "40%",
    "bring": [
      "2027학년도 수험표",
      "신분증"
    ],
    "howTo": "사전 예약",
    "branches": "63빌딩 워킹온더클라우드·슈치쿠·백리향"
  },
  {
    "brand": "쿠우쿠우",
    "category": "음식·카페",
    "benefit": "식사 금액 7,000원 할인",
    "start": "2026-11-19",
    "end": "2026-11-23",
    "conditions": "2027학년도 수능 응시자 본인만 돼요. 쿠폰은 11/16~23에 앱에서 받아요.",
    "area": "전국",
    "place": "",
    "sourceUrl": "https://www.nbntv.co.kr/news/articleView.html?idxno=4027530",
    "sourceDate": "2026-11-16",
    "highlight": "7천원",
    "bring": [
      "앱 할인 쿠폰",
      "실물 수험표",
      "신분증"
    ],
    "howTo": "앱·온라인",
    "branches": "전국 매장"
  },
  {
    "brand": "올웨이즈샤브",
    "category": "음식·카페",
    "benefit": "식사 금액 7,000원 할인",
    "start": "2026-11-19",
    "end": "2026-11-23",
    "conditions": "2027학년도 수능 응시자 본인만 돼요. 쿠폰은 쿠우쿠우 앱에서 11/16~23에 받아요.",
    "area": "전국",
    "place": "",
    "sourceUrl": "https://www.nbntv.co.kr/news/articleView.html?idxno=4027530",
    "sourceDate": "2026-11-16",
    "highlight": "7천원",
    "bring": [
      "앱 할인 쿠폰",
      "실물 수험표",
      "신분증"
    ],
    "howTo": "앱·온라인",
    "branches": "전국 매장"
  },
  {
    "brand": "이스타항공",
    "category": "여행·숙박",
    "benefit": "국내선 25%, 국제선 최대 10% 할인",
    "start": "2026-11-19",
    "end": "2026-12-31",
    "conditions": "탑승은 2027년 3월 27일까지예요. 국내선은 일반 운임, 국제선은 할인 운임 기준이에요.",
    "area": "전국",
    "place": "",
    "sourceUrl": "https://biz.heraldcorp.com/article/10938345",
    "sourceDate": "2026-11-16",
    "highlight": "25%",
    "bring": [
      "수험표 등 수험생 증빙"
    ],
    "howTo": "앱·온라인",
    "companions": "동반 1인 같은 할인",
    "branches": "전 노선(홈페이지 예매)"
  },
  {
    "brand": "트리니티항공",
    "category": "여행·숙박",
    "benefit": "국내선 25%, 국제선 최대 20% 할인",
    "start": "2026-11-12",
    "end": "2027-01-31",
    "conditions": "탑승은 2026년 11월 20일~2027년 2월 21일이에요. 국제선은 미주·동남아 20%, 유럽 15%, 대양주·동북아 7%, 일본 5%예요. 노선별 제외 기간이 있어요.",
    "area": "전국",
    "place": "",
    "sourceUrl": "https://www.lawissue.co.kr/view.php?ud=20261112132810575767191f6c6e_12",
    "sourceDate": "2026-11-12",
    "highlight": "25%",
    "bring": [
      "2027학년도 수험표·대입 원서 접수증·대입 지원서 중 1개 원본"
    ],
    "howTo": "앱·온라인",
    "companions": "동반 1인(함께 체크인)",
    "branches": "한국 출발 편도·왕복",
    "image": "https://contents-image.trinityairways.com/mobile/images/common/trinityairways.png",
    "imageSource": "https://www.twayair.com"
  },
  {
    "brand": "제주항공",
    "category": "여행·숙박",
    "benefit": "국내선 정규운임(플렉스) 20% 할인",
    "start": null,
    "end": "2026-12-16",
    "conditions": "탑승은 2027년 2월 25일까지이고 성수기는 빠져요. 예매는 홈페이지·앱에서 '개인 신분 할인'을 골라요.",
    "area": "전국",
    "place": "",
    "sourceUrl": "https://www.insightkorea.co.kr/news/articleView.html?idxno=259085",
    "sourceDate": "2026-11-17",
    "highlight": "20%",
    "bring": [
      "2027학년도 대입 지원서·원서 접수증·수능 수험표 중 1개 원본"
    ],
    "howTo": "앱·온라인",
    "companions": "동반 성인 1명(같은 예약번호)",
    "branches": "국내선 전 노선"
  },
  {
    "brand": "태백시시설관리공단 체육시설",
    "category": "운동·건강",
    "benefit": "수영장·헬스장 월 회원권 50% 할인(수영 성인 3만원)",
    "start": "2026-11-19",
    "end": "2026-12-31",
    "conditions": "수영장 월 회원권 성인 3만원·청소년 22,500원, 헬스장 성인 2만원·청소년 15,000원이에요. 근로자종합복지관 헬스장 1개월권은 15,000원이에요.",
    "area": "강원",
    "place": "강원 태백",
    "sourceUrl": "https://www.kwtotalnews.kr/70140",
    "sourceDate": "2026-11-17",
    "highlight": "50%",
    "bring": [
      "수험표",
      "신분증"
    ],
    "howTo": "현장",
    "branches": "태백·장성국민체육센터, 태백시근로자종합복지관"
  },
  {
    "brand": "태백작은영화관 매점",
    "category": "영화·공연",
    "benefit": "팝콘 3~4천원, 음료 2천원 할인가",
    "start": "2026-11-19",
    "end": "2026-12-31",
    "conditions": "방문할 때마다 수험생 1명당 팝콘·음료 각 1개씩 돼요.",
    "area": "강원",
    "place": "강원 태백",
    "sourceUrl": "https://www.kwtotalnews.kr/70140",
    "sourceDate": "2026-11-17",
    "highlight": "2천원",
    "bring": [
      "수험표",
      "신분증"
    ],
    "howTo": "현장",
    "branches": "태백작은영화관"
  },
  {
    "brand": "월미바다열차",
    "category": "놀이·체험",
    "benefit": "평일 이용요금 50% 할인(성인 5,500원)",
    "start": "2026-11-19",
    "end": "2026-12-18",
    "conditions": "평일만 돼요. 다른 할인과 중복은 안 돼요. 청소년 4,000원, 어린이 3,500원이에요.",
    "area": "인천",
    "place": "인천 중구",
    "sourceUrl": "https://www.surprisenews.kr/news/articleView.html?idxno=726395",
    "sourceDate": "2026-11-17",
    "highlight": "50%",
    "bring": [
      "수험표"
    ],
    "howTo": "현장",
    "companions": "동반 최대 2명 같은 할인",
    "branches": "월미바다열차"
  },
  {
    "brand": "동해시시설관리공단 체육시설",
    "category": "운동·건강",
    "benefit": "공공체육시설 이용료 50% 할인",
    "start": "2026-11-20",
    "end": "2026-12-19",
    "conditions": "수영장 일일 2천원, 월 회원권 2만5천~3만원, 스크린골프 1시간 3,500원 등이에요.",
    "area": "강원",
    "place": "강원 동해",
    "sourceUrl": "https://www.sisazoom.co.kr/122487",
    "sourceDate": "2026-11-17",
    "highlight": "50%",
    "bring": [
      "수험표",
      "신분증"
    ],
    "howTo": "현장",
    "branches": "웰빙레포츠타운, 근로자종합복지관, 해오름스포츠센터"
  },
  {
    "brand": "동해 해오름스포츠센터 수영 특강",
    "category": "운동·건강",
    "benefit": "수험생 무료 수영 특강(8회)",
    "start": "2026-12-01",
    "end": "2026-12-10",
    "conditions": "신청은 11월 20일~30일이고, 선정 절차를 거쳐요.",
    "area": "강원",
    "place": "강원 동해",
    "sourceUrl": "https://www.sisazoom.co.kr/122487",
    "sourceDate": "2026-11-17",
    "highlight": "무료",
    "howTo": "현장",
    "branches": "해오름스포츠센터"
  },
  {
    "brand": "국립광주과학관",
    "category": "놀이·체험",
    "benefit": "상설전시관·인공지능관·어린이과학관 무료(트리플 패스)",
    "start": "2026-11-20",
    "end": "2026-12-31",
    "conditions": "기념품도 줘요. 고3 단체는 인솔자도 같은 혜택이에요.",
    "area": "광주",
    "place": "광주 북구",
    "sourceUrl": "https://www.enewstoday.co.kr/news/articleView.html?idxno=2492691",
    "sourceDate": "2026-11-16",
    "highlight": "무료",
    "bring": [
      "수험표",
      "신분증"
    ],
    "howTo": "현장",
    "branches": "국립광주과학관 정문 매표소"
  },
  {
    "brand": "국립대구과학관",
    "category": "놀이·체험",
    "benefit": "상설전시관·꿈나무과학관 무료입장",
    "start": "2026-11-20",
    "end": "2026-12-31",
    "conditions": "특수영상관·특별전·교육은 따로 내요. 주차료도 정상이에요. 선착순 50명에게 여행용 파우치를 줘요.",
    "area": "대구",
    "place": "대구 달성",
    "sourceUrl": "https://www.webeconomy.co.kr/news/articleView.html?idxno=2373503",
    "sourceDate": "2026-11-12",
    "highlight": "무료",
    "bring": [
      "수험표"
    ],
    "howTo": "현장",
    "companions": "동반 1인 무료",
    "branches": "국립대구과학관"
  },
  {
    "brand": "김해서부문화센터",
    "category": "영화·공연",
    "benefit": "HYNN 콘서트 30%, 'THE HARMONY' 40% 할인",
    "start": "2026-11-11",
    "end": "2026-12-19",
    "conditions": "수험생 본인만 돼요. HYNN 공연은 12/19, THE HARMONY는 12/11까지 예매해요. 매진되면 일찍 끝나요.",
    "area": "경남",
    "place": "경남 김해",
    "sourceUrl": "https://www.idomin.com/news/articleView.html?idxno=2019391",
    "sourceDate": "2026-11-11",
    "highlight": "40%",
    "bring": [
      "수험표"
    ],
    "howTo": "앱·온라인",
    "branches": "김해서부문화센터"
  },
  {
    "brand": "김해시립김영원미술관",
    "category": "영화·공연",
    "benefit": "관람료 면제(동반 1인 포함)",
    "start": "2026-11-19",
    "end": "2026-12-31",
    "conditions": "",
    "area": "경남",
    "place": "경남 김해",
    "sourceUrl": "https://www.idomin.com/news/articleView.html?idxno=2019391",
    "sourceDate": "2026-11-11",
    "highlight": "무료",
    "bring": [
      "수험표 실물"
    ],
    "howTo": "현장",
    "companions": "동반 1인 무료",
    "branches": "김해시립김영원미술관"
  },
  {
    "brand": "통영관광개발공사",
    "category": "놀이·체험",
    "benefit": "통영케이블카·어드벤처타워·디피랑 50% 할인",
    "start": "2026-11-19",
    "end": "2027-01-31",
    "conditions": "다른 할인과 중복은 안 돼요. 통영시 주소 수험생은 케이블카·어드벤처타워에서 시민 할인과 겹쳐 받을 수 있어요.",
    "area": "경남",
    "place": "경남 통영",
    "sourceUrl": "https://www.newscj.com/news/articleView.html?idxno=3448326",
    "sourceDate": "2026-11-12",
    "highlight": "50%",
    "bring": [
      "2027학년도 수험표"
    ],
    "howTo": "현장",
    "branches": "통영케이블카, 통영어드벤처타워, 남망산 디지털파크 디피랑"
  },
  {
    "brand": "소노 워터파크·삼악산 케이블카",
    "category": "놀이·체험",
    "benefit": "수험생 본인 50%, 동반 최대 2명 45% 할인",
    "start": "2026-11-20",
    "end": "2026-12-31",
    "conditions": "이용권은 11월 19일~12월 9일에 소노호텔앤리조트 홈페이지에서만 팔아요.",
    "area": "전국",
    "place": "",
    "sourceUrl": "https://www.slist.kr/news/articleView.html?idxno=782352",
    "sourceDate": "2026-11-17",
    "highlight": "50%",
    "bring": [
      "2027학년도 수험표"
    ],
    "howTo": "앱·온라인",
    "companions": "동반 최대 2명 45% 할인",
    "branches": "오션월드, 오션어드벤처(거제·천안), 오션플레이(델피노·양양·삼척·단양·변산), 춘천 삼악산 호수 케이블카",
    "image": "https://www.sonohotelsresorts.com/assets/og01.png",
    "imageSource": "https://www.sonohotelsresorts.com"
  },
  {
    "brand": "쏠비치 남해",
    "category": "여행·숙박",
    "benefit": "리스토란테 저녁 뷔페 50%, 아이스비치·인피니티풀 무료",
    "start": "2026-11-19",
    "end": "2026-12-31",
    "conditions": "카페 메리디오네 음료·베이커리는 20% 할인이에요.",
    "area": "경남",
    "place": "경남 남해",
    "sourceUrl": "https://www.slist.kr/news/articleView.html?idxno=782352",
    "sourceDate": "2026-11-17",
    "highlight": "50%",
    "bring": [
      "2027학년도 수험표"
    ],
    "howTo": "현장",
    "branches": "쏠비치 남해",
    "image": "https://www.sonohotelsresorts.com/assets/og01.png",
    "imageSource": "https://www.sonohotelsresorts.com"
  },
  {
    "brand": "쏠비치 진도",
    "category": "여행·숙박",
    "benefit": "셰프스키친 조식 뷔페 50%, 인피니티풀 무료",
    "start": "2026-11-19",
    "end": "2026-12-31",
    "conditions": "스크린 스포츠 '레전드히어로즈'도 무료예요.",
    "area": "전남",
    "place": "전남 진도",
    "sourceUrl": "https://www.slist.kr/news/articleView.html?idxno=782352",
    "sourceDate": "2026-11-17",
    "highlight": "50%",
    "bring": [
      "2027학년도 수험표"
    ],
    "howTo": "현장",
    "branches": "쏠비치 진도",
    "image": "https://www.sonohotelsresorts.com/assets/og01.png",
    "imageSource": "https://www.sonohotelsresorts.com"
  },
  {
    "brand": "소노 셰프스키친 뷔페",
    "category": "음식·카페",
    "benefit": "셰프스키친 뷔페 50% 할인",
    "start": "2026-11-19",
    "end": "2026-12-31",
    "conditions": "",
    "area": "전국",
    "place": "",
    "sourceUrl": "https://www.slist.kr/news/articleView.html?idxno=782352",
    "sourceDate": "2026-11-17",
    "highlight": "50%",
    "bring": [
      "2027학년도 수험표"
    ],
    "howTo": "현장",
    "branches": "소노캄 여수, 소노캄 제주, 소노벨 제주",
    "image": "https://www.sonohotelsresorts.com/assets/og01.png",
    "imageSource": "https://www.sonohotelsresorts.com"
  },
  {
    "brand": "한국산림복지진흥원",
    "category": "여행·숙박",
    "benefit": "비수기·주중 숙박 30%, 성수기·주말 10% 할인",
    "start": "2026-11-20",
    "end": "2027-02-28",
    "conditions": "숲e랑에서 미리 예약해요. 다음 달 예약은 매달 15일 오전 9시에 열려요.",
    "area": "전국",
    "place": "",
    "sourceUrl": "https://www.vegannews.co.kr/news/article.html?no=404519",
    "sourceDate": "2026-11-13",
    "highlight": "30%",
    "bring": [
      "수험표"
    ],
    "howTo": "사전 예약",
    "branches": "국립산림치유원 2곳·국립숲체원 8곳"
  },
  {
    "brand": "롯데시네마",
    "category": "영화·공연",
    "benefit": "청소년 영화 관람 9,900원, 매점 할인 쿠폰",
    "start": "2026-11-13",
    "end": "2026-11-30",
    "conditions": "수험생·청소년 대상이에요. '폭설' 예매 시 2+1 쿠폰 선착순 증정도 있어요.",
    "area": "전국",
    "place": "",
    "sourceUrl": "https://www.joongboo.com/news/articleView.html?idxno=363742362",
    "sourceDate": "2026-11-12",
    "highlight": "9,900원",
    "howTo": "앱·온라인",
    "branches": "전국 롯데시네마"
  },
  {
    "brand": "상무초밥",
    "category": "음식·카페",
    "benefit": "수험생 50% 할인",
    "start": "2026-11-19",
    "end": "2026-11-30",
    "conditions": "",
    "area": "전국",
    "place": "",
    "sourceUrl": "https://www.enetnews.co.kr/news/articleView.html?idxno=56126",
    "sourceDate": "2026-11-06",
    "highlight": "50%",
    "bring": [
      "2027학년도 수험표"
    ],
    "howTo": "현장",
    "branches": "전국 매장"
  },
  {
    "brand": "쿠우쿠우 블루레일",
    "category": "음식·카페",
    "benefit": "결제 금액 5,000원 할인",
    "start": "2026-11-19",
    "end": "2026-11-23",
    "conditions": "",
    "area": "전국",
    "place": "",
    "sourceUrl": "https://www.sidae.com/article/2026111617265290440",
    "sourceDate": "2026-11-16",
    "highlight": "5천원",
    "bring": [
      "2027학년도 실물 수험표",
      "신분증(학생증·주민등록증·운전면허증·여권)"
    ],
    "howTo": "현장"
  },
  {
    "brand": "에듀피디",
    "category": "교육",
    "benefit": "공무원·자격증 강의 20% 할인 쿠폰",
    "start": "2026-11-16",
    "end": null,
    "conditions": "아이디당 1회, 선착순이에요. 쿠폰은 인증 후 최대 3일 안에 나오고 3일 동안 써요.",
    "area": "전국",
    "place": "",
    "sourceUrl": "https://www.abcn.kr/news/articleView.html?idxno=94620",
    "sourceDate": "2026-11-16",
    "highlight": "20%",
    "bring": [
      "수험표 사진",
      "가입 아이디"
    ],
    "howTo": "앱·온라인",
    "branches": "에듀피디 홈페이지"
  },
  {
    "brand": "JW 메리어트 호텔 서울 플레이버즈",
    "category": "음식·카페",
    "benefit": "뷔페 2+1(성인 3명 중 1명 무료)",
    "start": "2026-11-19",
    "end": "2026-11-30",
    "conditions": "평일 점심·저녁만 돼요. 전화 예약 고객만 적용돼요.",
    "area": "서울",
    "place": "서울 서초",
    "sourceUrl": "https://www.onews.tv/news/articleView.html?idxno=290860",
    "sourceDate": "2026-11-05",
    "highlight": "2+1",
    "bring": [
      "수험표 또는 수험생 증빙 서류"
    ],
    "howTo": "전화 예약",
    "companions": "수험생 포함 성인 3명 중 1명 무료",
    "branches": "JW 메리어트 호텔 서울(반포)"
  },
  {
    "brand": "대전교통공사 도시철도",
    "category": "여행·숙박",
    "benefit": "수능 당일 도시철도 무료",
    "start": "2026-11-19",
    "end": "2026-11-19",
    "conditions": "역무실에서 수험표를 보여 주고 우대권을 받아요.",
    "area": "대전",
    "place": "대전",
    "sourceUrl": "https://www.wikitree.co.kr/articles/1174922",
    "sourceDate": "2026-11-16",
    "highlight": "무료",
    "bring": [
      "수험표"
    ],
    "howTo": "현장",
    "branches": "대전 도시철도 전 역"
  }
]
