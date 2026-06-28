export type OrganizationStatus = "申請中" | "確認中" | "承認済み" | "要対応"
export type EventDepartment = "模擬店" | "屋外ステージ" | "教室"

export type EventOrganization = {
  id: string
  name: string
  category: string
  department: EventDepartment
  representative: string
  contact: string
  status: OrganizationStatus
  booth: string
  note: string
}

export type ProjectStatus = "準備中" | "確定" | "当日対応" | "要確認"

export type EventProject = {
  id: string
  title: string
  organizationName: string
  department: EventDepartment
  venue: string
  startTime: string
  endTime: string
  owner: string
  status: ProjectStatus
  note: string
}

export const initialOrganizations: EventOrganization[] = [
  {
    id: "org-1",
    name: "青空ワークショップ",
    category: "体験",
    department: "教室",
    representative: "岡田 玲奈",
    contact: "aosora@example.com",
    status: "承認済み",
    booth: "A-01",
    note: "電源 2 口、長机 2 台",
  },
  {
    id: "org-2",
    name: "北町フードクラブ",
    category: "飲食",
    department: "模擬店",
    representative: "宮本 航",
    contact: "kitamachi-food@example.com",
    status: "確認中",
    booth: "F-03",
    note: "保健所書類確認中",
  },
  {
    id: "org-3",
    name: "学生演劇サークル灯",
    category: "ステージ",
    department: "屋外ステージ",
    representative: "長谷川 葵",
    contact: "tomoshibi@example.com",
    status: "承認済み",
    booth: "STAGE",
    note: "転換 10 分、マイク 3 本",
  },
  {
    id: "org-4",
    name: "まちの写真部",
    category: "展示",
    department: "教室",
    representative: "石井 悠",
    contact: "photo-town@example.com",
    status: "要対応",
    booth: "B-06",
    note: "展示パネル枚数を再確認",
  },
  {
    id: "org-5",
    name: "こども科学ラボ",
    category: "体験",
    department: "教室",
    representative: "藤原 真央",
    contact: "science-lab@example.com",
    status: "申請中",
    booth: "A-05",
    note: "水場利用希望あり",
  },
]

export const initialProjects: EventProject[] = [
  {
    id: "project-1",
    title: "開場受付",
    organizationName: "運営本部",
    department: "教室",
    venue: "正面入口",
    startTime: "9:00",
    endTime: "11:00",
    owner: "受付",
    status: "確定",
    note: "チケット確認、パンフレット配布",
  },
  {
    id: "project-2",
    title: "こども実験教室",
    organizationName: "こども科学ラボ",
    department: "教室",
    venue: "体験エリア A",
    startTime: "11:30",
    endTime: "13:00",
    owner: "企画運営",
    status: "要確認",
    note: "水場利用と安全導線を確認",
  },
  {
    id: "project-3",
    title: "演劇ショーケース",
    organizationName: "学生演劇サークル灯",
    department: "屋外ステージ",
    venue: "メインステージ",
    startTime: "14:00",
    endTime: "14:45",
    owner: "ステージ",
    status: "確定",
    note: "転換補助 2 名",
  },
  {
    id: "project-4",
    title: "地域グルメ販売",
    organizationName: "北町フードクラブ",
    department: "模擬店",
    venue: "飲食エリア F",
    startTime: "10:00",
    endTime: "16:00",
    owner: "出展者対応",
    status: "準備中",
    note: "火気使用なし",
  },
  {
    id: "project-5",
    title: "クロージング誘導",
    organizationName: "運営本部",
    department: "屋外ステージ",
    venue: "全館",
    startTime: "17:00",
    endTime: "18:00",
    owner: "会場誘導",
    status: "当日対応",
    note: "出口案内、落とし物確認",
  },
]
