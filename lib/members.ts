export type Member = {
  id: string
  name: string
  email: string
  department: string
  role: string
}

export const memberDepartments = [
  "執行部",
  "運営局・第1部門",
  "運営局・第2部門",
  "運営局・第3部門",
  "演出局・第1部門",
  "演出局・第2部門",
  "演出局・第3部門",
  "参加団体局・第1部門",
  "参加団体局・第2部門",
  "参加団体局・第3部門",
  "開発局・第1部門",
  "開発局・第2部門",
  "開発局・第3部門",
  "制作局・第1部門",
  "制作局・第2部門",
  "制作局・第3部門",
  "財務局・第1部門",
  "財務局・第2部門",
  "財務局・第3部門",
  "総務局・第1部門",
  "総務局・第2部門",
  "総務局・第3部門",
  "渉外局・第1部門",
  "渉外局・第2部門",
  "渉外局・第3部門",
  "広報局・第1部門",
  "広報局・第2部門",
  "広報局・第3部門",
]
export const memberRoles = ["委員長", "副委員長", "局長・役員", "副局長", "3年会", "部門長", "2年継続", "1年新規"]

export const initialMembers: Member[] = [
  { id: "1", name: "田中 太郎", email: "tanaka.taro@hoshihama.example", department: "執行部", role: "委員長" },
  { id: "2", name: "佐藤 花子", email: "sato.hanako@hoshihama.example", department: "執行部", role: "副委員長" },
  { id: "3", name: "鈴木 一郎", email: "suzuki.ichiro@hoshihama.example", department: "運営局・第1部門", role: "局長・役員" },
  { id: "4", name: "高橋 美咲", email: "takahashi.misaki@hoshihama.example", department: "演出局・第1部門", role: "局長・役員" },
  { id: "5", name: "伊藤 健", email: "ito.ken@hoshihama.example", department: "開発局・第1部門", role: "局長・役員" },
  { id: "6", name: "渡辺 由美", email: "watanabe.yumi@hoshihama.example", department: "参加団体局・第1部門", role: "局長・役員" },
  { id: "7", name: "山本 翔", email: "yamamoto.sho@hoshihama.example", department: "運営局・第2部門", role: "副局長" },
  { id: "8", name: "中村 葵", email: "nakamura.aoi@hoshihama.example", department: "渉外局・第1部門", role: "副局長" },
  { id: "9", name: "小林 優", email: "kobayashi.yu@hoshihama.example", department: "総務局・第1部門", role: "副局長" },
  { id: "10", name: "加藤 直人", email: "kato.naoto@hoshihama.example", department: "広報局・第1部門", role: "局長・役員" },
  { id: "11", name: "吉田 紗希", email: "yoshida.saki@hoshihama.example", department: "制作局・第1部門", role: "局長・役員" },
  { id: "12", name: "山田 陸", email: "yamada.riku@hoshihama.example", department: "運営局・第3部門", role: "3年会" },
  { id: "13", name: "松本 凛", email: "matsumoto.rin@hoshihama.example", department: "演出局・第2部門", role: "部門長" },
  { id: "14", name: "井上 大輔", email: "inoue.daisuke@hoshihama.example", department: "参加団体局・第2部門", role: "2年継続" },
  { id: "15", name: "木村 菜月", email: "kimura.natsuki@hoshihama.example", department: "開発局・第2部門", role: "部門長" },
  { id: "16", name: "林 拓海", email: "hayashi.takumi@hoshihama.example", department: "演出局・第3部門", role: "2年継続" },
  { id: "17", name: "清水 結衣", email: "shimizu.yui@hoshihama.example", department: "総務局・第2部門", role: "2年継続" },
  { id: "18", name: "斎藤 悠真", email: "saito.yuma@hoshihama.example", department: "制作局・第2部門", role: "1年新規" },
  { id: "19", name: "森 美月", email: "mori.mizuki@hoshihama.example", department: "財務局・第1部門", role: "1年新規" },
  { id: "20", name: "池田 蓮", email: "ikeda.ren@hoshihama.example", department: "広報局・第2部門", role: "1年新規" },
]

export type SortKey = keyof Omit<Member, "id">
export type SortOrder = "asc" | "desc"

export function exportToCsv(members: Member[]): void {
  const headers = ["氏名", "メールアドレス", "所属局", "役職"]
  const rows = members.map((m) => [m.name, m.email, m.department, m.role])
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
  const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n")
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `メンバー名簿_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
