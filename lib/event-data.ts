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

const organizationSeeds = [
  ["星浜大学 科学探究会", "体験", "教室", "岡田 玲奈", "science", "A-204"],
  ["海街フードラボ", "飲食", "模擬店", "宮本 航", "foodlab", "F-03"],
  ["劇団ポラリス", "ステージ", "屋外ステージ", "長谷川 葵", "polaris", "MAIN STAGE"],
  ["写真部 Lumen", "展示", "教室", "石井 悠", "lumen", "B-106"],
  ["アカペラサークル Ripple", "ステージ", "屋外ステージ", "藤原 真央", "ripple", "SUNSET STAGE"],
  ["天文研究会 Astra", "体験", "教室", "佐々木 湊", "astra", "A-305"],
  ["茶道部 汐風会", "飲食", "教室", "前田 千紘", "shiokaze", "和室 1"],
  ["ロボティクス研究会", "体験", "教室", "福田 陽斗", "robotics", "C-201"],
  ["ダンスサークル Nebula", "ステージ", "屋外ステージ", "竹内 莉子", "nebula", "MAIN STAGE"],
  ["国際交流会 Harbor", "交流", "教室", "小川 エマ", "harbor", "B-202"],
  ["文芸部 青栞", "展示", "教室", "後藤 澪", "aoshiori", "A-102"],
  ["軽音楽部 Breakwater", "ステージ", "屋外ステージ", "石川 蓮", "breakwater", "SUNSET STAGE"],
  ["美術部 Palette", "展示", "教室", "原田 結月", "palette", "B-105"],
  ["eスポーツ研究会", "体験", "教室", "中島 颯", "esports", "C-304"],
  ["環境ボランティア Blue Earth", "展示", "教室", "三浦 さくら", "blueearth", "A-205"],
  ["放送研究会 Wave", "ステージ", "屋外ステージ", "村上 遥", "wave", "MAIN STAGE"],
  ["鉄道研究会 Railways", "展示", "教室", "近藤 大和", "railways", "C-102"],
  ["漫画研究会 Canvas", "展示", "教室", "遠藤 彩", "canvas", "B-304"],
  ["和太鼓サークル 潮音", "ステージ", "屋外ステージ", "青木 奏", "shione", "潮風広場"],
  ["起業研究会 Seaside Lab", "体験", "教室", "坂本 晴", "seasidelab", "A-301"],
] as const satisfies ReadonlyArray<
  readonly [string, string, EventDepartment, string, string, string]
>

const organizationStatuses: OrganizationStatus[] = ["承認済み", "確認中", "申請中", "要対応"]

export const initialOrganizations: EventOrganization[] = organizationSeeds.map(
  ([name, category, department, representative, contact, booth], index) => ({
    id: `org-${index + 1}`,
    name,
    category,
    department,
    representative,
    contact: `${contact}@hoshihama.example`,
    status: organizationStatuses[index % organizationStatuses.length],
    booth,
    note: department === "屋外ステージ"
      ? "音響・転換時間を事前確認"
      : department === "模擬店"
        ? "衛生管理・アレルギー表示を確認"
        : "電源・備品・教室レイアウトを確認",
  }),
)

const projectTitlePairs = [
  ["きらめく鉱石ラボ", "空気と光のサイエンスショー"],
  ["星浜ご当地バーガー", "潮風レモネードスタンド"],
  ["青春ショートシアター", "即興劇・星浜物語"],
  ["蒼海キャンパス光景展", "ポートレート撮影体験"],
  ["Sunset A Cappella Live", "みんなで歌うハーモニー講座"],
  ["昼間の星空プラネタリウム", "秋の星座観察ガイド"],
  ["潮風茶席", "はじめての茶筅体験"],
  ["レスキューロボ操縦体験", "自律走行ロボレース"],
  ["Nebula Dance Showcase", "初心者ダンスワークショップ"],
  ["世界のおやつ交流会", "留学生トークセッション"],
  ["星浜掌編文庫", "三行小説づくり"],
  ["Breakwater Live", "楽器ふれあいセッション"],
  ["海を描く合同作品展", "ライブペインティング"],
  ["キャンパス対抗ゲーム大会", "はじめてのeスポーツ体験"],
  ["海岸クリーンアップ展示", "アップサイクル工作教室"],
  ["星浜祭公開ラジオ", "アナウンス体験ブース"],
  ["港町ジオラマ鉄道", "鉄道クイズラリー"],
  ["オリジナル漫画展示", "キャラクター作画講座"],
  ["潮音・和太鼓演舞", "和太鼓体験会"],
  ["学生アイデアピッチ", "大学発スタートアップ相談室"],
] as const

const projectStatuses: ProjectStatus[] = ["確定", "準備中", "当日対応", "要確認"]

export const initialProjects: EventProject[] = initialOrganizations.flatMap((organization, organizationIndex) =>
  projectTitlePairs[organizationIndex].map((title, projectIndex) => {
    const projectNumber = organizationIndex * 2 + projectIndex + 1
    const isStage = organization.department === "屋外ステージ"
    const isFood = organization.department === "模擬店"
    return {
      id: `project-${projectNumber}`,
      title,
      organizationName: organization.name,
      department: organization.department,
      venue: isStage
        ? organization.booth
        : isFood
          ? `潮風広場 ${organization.booth}`
          : `${organization.booth}教室`,
      startTime: isStage ? (projectIndex === 0 ? "11:00" : "15:00") : "10:00",
      endTime: isStage ? (projectIndex === 0 ? "11:45" : "15:45") : "17:00",
      owner: isStage ? "演出局" : isFood ? "参加団体局" : "運営局",
      status: projectStatuses[(projectNumber - 1) % projectStatuses.length],
      note: `${organization.name}が届ける「${title}」です。来場者が参加しやすい運営と安全な導線を準備します。`,
    }
  }),
)
