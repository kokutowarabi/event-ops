import { downloadCsv } from "@/lib/csv"

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
export const memberRoles = ["委員長", "副委員長", "局長", "役員", "副局長", "3年会", "部門長", "2年継続", "1年新規"]

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
  { id: "21", name: "近藤 彩香", email: "kondo.ayaka@hoshihama.example", department: "執行部", role: "副委員長" },
  { id: "23", name: "阿部 颯太", email: "abe.sota@hoshihama.example", department: "運営局・第1部門", role: "役員" },
  { id: "24", name: "橋本 莉子", email: "hashimoto.riko@hoshihama.example", department: "運営局・第1部門", role: "3年会" },
  { id: "25", name: "石川 湊", email: "ishikawa.minato@hoshihama.example", department: "運営局・第2部門", role: "副局長" },
  { id: "26", name: "前田 陽菜", email: "maeda.hina@hoshihama.example", department: "運営局・第2部門", role: "副局長" },
  { id: "27", name: "藤田 悠斗", email: "fujita.yuto@hoshihama.example", department: "運営局・第3部門", role: "3年会" },
  { id: "28", name: "岡田 心春", email: "okada.koharu@hoshihama.example", department: "運営局・第3部門", role: "3年会" },
  { id: "29", name: "後藤 玲奈", email: "goto.reina@hoshihama.example", department: "演出局・第1部門", role: "役員" },
  { id: "30", name: "長谷川 蒼", email: "hasegawa.ao@hoshihama.example", department: "演出局・第1部門", role: "3年会" },
  { id: "31", name: "村上 琴音", email: "murakami.kotone@hoshihama.example", department: "演出局・第2部門", role: "部門長" },
  { id: "32", name: "近藤 陽介", email: "kondo.yosuke@hoshihama.example", department: "演出局・第2部門", role: "部門長" },
  { id: "33", name: "石井 美空", email: "ishii.misora@hoshihama.example", department: "演出局・第3部門", role: "2年継続" },
  { id: "34", name: "坂本 大和", email: "sakamoto.yamato@hoshihama.example", department: "演出局・第3部門", role: "2年継続" },
  { id: "35", name: "遠藤 七海", email: "endo.nanami@hoshihama.example", department: "参加団体局・第1部門", role: "役員" },
  { id: "36", name: "青木 智也", email: "aoki.tomoya@hoshihama.example", department: "参加団体局・第1部門", role: "3年会" },
  { id: "37", name: "藤井 咲良", email: "fujii.sakura@hoshihama.example", department: "参加団体局・第2部門", role: "2年継続" },
  { id: "38", name: "西村 海斗", email: "nishimura.kaito@hoshihama.example", department: "参加団体局・第2部門", role: "2年継続" },
  { id: "39", name: "福田 結菜", email: "fukuda.yuna@hoshihama.example", department: "開発局・第1部門", role: "役員" },
  { id: "40", name: "太田 亮", email: "ota.ryo@hoshihama.example", department: "開発局・第1部門", role: "3年会" },
  { id: "41", name: "三浦 愛", email: "miura.ai@hoshihama.example", department: "開発局・第2部門", role: "部門長" },
  { id: "42", name: "藤原 俊介", email: "fujiwara.shunsuke@hoshihama.example", department: "開発局・第2部門", role: "部門長" },
  { id: "43", name: "松田 千尋", email: "matsuda.chihiro@hoshihama.example", department: "制作局・第1部門", role: "役員" },
  { id: "44", name: "原田 凌", email: "harada.ryo@hoshihama.example", department: "制作局・第1部門", role: "3年会" },
  { id: "45", name: "小川 真央", email: "ogawa.mao@hoshihama.example", department: "制作局・第2部門", role: "1年新規" },
  { id: "46", name: "中島 陽向", email: "nakajima.hinata@hoshihama.example", department: "制作局・第2部門", role: "1年新規" },
  { id: "47", name: "金子 莉央", email: "kaneko.rio@hoshihama.example", department: "財務局・第1部門", role: "1年新規" },
  { id: "48", name: "和田 樹", email: "wada.itsuki@hoshihama.example", department: "財務局・第1部門", role: "1年新規" },
  { id: "49", name: "中川 遼", email: "nakagawa.ryo@hoshihama.example", department: "総務局・第1部門", role: "副局長" },
  { id: "50", name: "原 美羽", email: "hara.miu@hoshihama.example", department: "総務局・第1部門", role: "副局長" },
  { id: "51", name: "竹内 結月", email: "takeuchi.yuzuki@hoshihama.example", department: "総務局・第2部門", role: "2年継続" },
  { id: "52", name: "田村 朝陽", email: "tamura.asahi@hoshihama.example", department: "総務局・第2部門", role: "2年継続" },
  { id: "53", name: "酒井 杏奈", email: "sakai.anna@hoshihama.example", department: "渉外局・第1部門", role: "副局長" },
  { id: "54", name: "工藤 蓮斗", email: "kudo.rento@hoshihama.example", department: "渉外局・第1部門", role: "副局長" },
  { id: "55", name: "横山 美緒", email: "yokoyama.mio@hoshihama.example", department: "広報局・第1部門", role: "役員" },
  { id: "56", name: "宮崎 陸斗", email: "miyazaki.rikuto@hoshihama.example", department: "広報局・第1部門", role: "3年会" },
  { id: "57", name: "宮本 彩乃", email: "miyamoto.ayano@hoshihama.example", department: "広報局・第2部門", role: "1年新規" },
  { id: "58", name: "内田 奏太", email: "uchida.sota@hoshihama.example", department: "広報局・第2部門", role: "1年新規" },
]

export type SortKey = keyof Omit<Member, "id">
export type SortOrder = "asc" | "desc"

export function exportToCsv(members: Member[]): void {
  const headers = ["氏名", "メールアドレス", "所属", "役職"]
  const rows = members.map((m) => [m.name, m.email, m.department, m.role])
  downloadCsv("メンバー名簿", headers, rows)
}
