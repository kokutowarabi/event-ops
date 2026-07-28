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
    name: "星浜大学 科学探究会",
    category: "体験",
    department: "教室",
    representative: "岡田 玲奈",
    contact: "science@hoshihama.example",
    status: "承認済み",
    booth: "A-204",
    note: "電源2口、給排水設備を使用",
  },
  {
    id: "org-2",
    name: "海街フードラボ",
    category: "飲食",
    department: "模擬店",
    representative: "宮本 航",
    contact: "foodlab@hoshihama.example",
    status: "確認中",
    booth: "F-03",
    note: "アレルギー表示確認済み",
  },
  {
    id: "org-3",
    name: "劇団ポラリス",
    category: "ステージ",
    department: "屋外ステージ",
    representative: "長谷川 葵",
    contact: "polaris@hoshihama.example",
    status: "承認済み",
    booth: "MAIN STAGE",
    note: "転換10分、ワイヤレスマイク3本",
  },
  {
    id: "org-4",
    name: "写真部 Lumen",
    category: "展示",
    department: "教室",
    representative: "石井 悠",
    contact: "lumen@hoshihama.example",
    status: "承認済み",
    booth: "B-106",
    note: "展示パネル12枚、暗幕を使用",
  },
  {
    id: "org-5",
    name: "アカペラサークル Ripple",
    category: "ステージ",
    department: "屋外ステージ",
    representative: "藤原 真央",
    contact: "ripple@hoshihama.example",
    status: "承認済み",
    booth: "SUNSET STAGE",
    note: "モニタースピーカー4台を使用",
  },
]

export const initialProjects: EventProject[] = [
  {
    id: "project-1",
    title: "きらめく鉱石ラボ",
    organizationName: "星浜大学 科学探究会",
    department: "教室",
    venue: "A棟 204教室",
    startTime: "10:30",
    endTime: "12:00",
    owner: "企画運営",
    status: "確定",
    note: "偏光板と鉱石標本を使い、光が生み出す色の不思議を体験するワークショップです。",
  },
  {
    id: "project-2",
    title: "星浜ご当地バーガー",
    organizationName: "海街フードラボ",
    department: "模擬店",
    venue: "潮風広場 F-03",
    startTime: "10:00",
    endTime: "17:00",
    owner: "出展者対応",
    status: "要確認",
    note: "地元野菜と特製ソースを使った、星浜祭限定のグルメバーガーを販売します。",
  },
  {
    id: "project-3",
    title: "青春ショートシアター",
    organizationName: "劇団ポラリス",
    department: "屋外ステージ",
    venue: "メインステージ",
    startTime: "13:30",
    endTime: "14:15",
    owner: "ステージ",
    status: "当日対応",
    note: "大学生活の一瞬を切り取った、笑って泣ける三つの短編を上演します。",
  },
  {
    id: "project-4",
    title: "蒼海キャンパス光景展",
    organizationName: "写真部 Lumen",
    department: "教室",
    venue: "B棟 106教室",
    startTime: "10:00",
    endTime: "17:30",
    owner: "展示",
    status: "準備中",
    note: "学生が一年かけて撮影したキャンパスと港町の風景を、時間帯ごとに展示します。",
  },
  {
    id: "project-5",
    title: "Sunset A Cappella Live",
    organizationName: "アカペラサークル Ripple",
    department: "屋外ステージ",
    venue: "サンセットステージ",
    startTime: "16:00",
    endTime: "16:45",
    owner: "ステージ",
    status: "確定",
    note: "夕暮れの海を背に、人気曲とオリジナルメドレーをアカペラで届けます。",
  },
]
