import type { HomeContent, WorkItem } from "../types";

export const fallbackWorks: WorkItem[] = [
  {
    id: "fallback-01",
    slug: "rush-hour-app",
    title: "Rush Hour App UI 기획 및 디자인",
    category: "UI/UX",
    summary: "출퇴근 시간대 이동 경험을 더 빠르게 판단할 수 있도록 설계한 앱 UI 프로젝트.",
    client: "개인 프로젝트",
    year: "2023",
    role: "Figma + Adobe Illustrator",
    featured: true,
    published: true,
    sortOrder: 1,
    blocks: [
      {
        id: "fallback-block-01",
        type: "heading",
        content: { text: "Project Overview" },
        sortOrder: 1
      },
      {
        id: "fallback-block-02",
        type: "paragraph",
        content: {
          html: "<p>Rush Hour App은 복잡한 이동 선택지를 빠르게 판단할 수 있도록 정보 우선순위와 인터페이스 흐름을 정리한 개인 프로젝트입니다.</p>"
        },
        sortOrder: 2
      },
      {
        id: "fallback-block-03",
        type: "quote",
        content: {
          html: "<blockquote>주어진 답에 머물지 않고, 더 나은 방향을 계속해서 설계합니다.</blockquote>"
        },
        sortOrder: 3
      }
    ]
  },
  {
    id: "fallback-02",
    slug: "orbit-brand",
    title: "Orbit Brand",
    category: "BI/BX",
    summary: "유연한 궤도와 선명한 기준을 가진 브랜드 아이덴티티 시스템.",
    client: "Concept",
    year: "2025",
    role: "Brand Identity",
    featured: true,
    published: true,
    sortOrder: 2
  },
  {
    id: "fallback-03",
    slug: "daily-commerce",
    title: "Daily Commerce",
    category: "UI/UX",
    summary: "반복 구매 여정을 짧고 명확하게 만든 커머스 앱 리디자인.",
    client: "Selected Client",
    year: "2025",
    role: "Product Design",
    featured: true,
    published: true,
    sortOrder: 3
  },
  {
    id: "fallback-04",
    slug: "north-archive",
    title: "North Archive",
    category: "BI/BX",
    summary: "아카이브형 브랜드의 콘텐츠 구조와 시각 시스템 설계.",
    client: "Selected Client",
    year: "2024",
    role: "BX Design",
    featured: true,
    published: true,
    sortOrder: 4
  },
  {
    id: "fallback-05",
    slug: "field-dashboard",
    title: "Field Dashboard",
    category: "UI/UX",
    summary: "운영 데이터를 빠르게 스캔하고 조치하는 업무형 대시보드.",
    client: "Selected Client",
    year: "2024",
    role: "UX/UI",
    featured: true,
    published: true,
    sortOrder: 5
  },
  {
    id: "fallback-06",
    slug: "studio-index",
    title: "Studio Index",
    category: "BI/BX",
    summary: "스튜디오의 작업 방식을 색, 그리드, 모션 원칙으로 정리한 아이덴티티.",
    client: "Concept",
    year: "2023",
    role: "Identity System",
    featured: false,
    published: true,
    sortOrder: 6
  }
];

export const fallbackContent: HomeContent = {
  profile: {
    headline: "Beyond the Answer.",
    name: "Sihyeon Ham, 함시현",
    role: "UIUX 디자이너, 기획자",
    intro:
      "<p>안녕하세요,</p><p><em>UIUX 디자이너, 기획자 </em><strong>함시현</strong><em>입니다.</em></p><p>주어진 답에 머물지 않고, 더 나은 방향을 계속해서 설계합니다.</p>",
    bio: "초등학교 방과 후 교실에서 포토샵에 흥미를 가진 이후, 2014년부터 계속 활동하고 있습니다.",
    links: [
      { label: "hampenta@icloud.com", url: "mailto:hampenta@icloud.com" },
      { label: "010-2672-1912", url: "tel:010-2672-1912" },
      { label: "서울특별시, 강서구", url: "#profile" }
    ]
  },
  timeline: [
    {
      id: "timeline-figma-01",
      period: "2001.02",
      title: "디자인에 관심을 갖기 시작",
      organization: "",
      description: "",
      sortOrder: 1
    },
    {
      id: "timeline-figma-02",
      period: "2016.10",
      title: "디자인 활동 확장",
      organization: "",
      description: "",
      sortOrder: 2
    },
    {
      id: "timeline-figma-03",
      period: "2017.04",
      title: "12회 AppJam 장려상 수상",
      organization: "SK플래닛, SK텔레콤 및 중소벤쳐기업부 주최 해커톤",
      description: "",
      sortOrder: 3
    },
    {
      id: "timeline-figma-04",
      period: "2018.09",
      title: "프로젝트 경험 확장",
      organization: "",
      description: "",
      sortOrder: 4
    },
    {
      id: "timeline-figma-05",
      period: "2020.03 ~ 2020.09",
      title: "실무형 프로젝트 참여",
      organization: "",
      description: "",
      sortOrder: 5
    }
  ],
  featuredWorks: fallbackWorks.filter((work) => work.featured).slice(0, 5),
  works: fallbackWorks
};
