import { describe, expect, it } from "vitest"
import { serializeCsv } from "@/lib/csv"

describe("serializeCsv", () => {
  it("quotes cells and escapes embedded quotes", () => {
    expect(
      serializeCsv(
        ["企画名", "メモ"],
        [["星浜祭,ライブ", "来場者に「歓迎」と案内"], ['"特別"企画', ""]],
      ),
    ).toBe(
      '"企画名","メモ"\r\n"星浜祭,ライブ","来場者に「歓迎」と案内"\r\n"""特別""企画",""',
    )
  })

  it("keeps numeric values and empty cells", () => {
    expect(serializeCsv(["順位", "票数"], [[1, 12], [2, null]])).toBe(
      '"順位","票数"\r\n"1","12"\r\n"2",""',
    )
  })

  it("neutralizes spreadsheet formulas from edited text", () => {
    expect(serializeCsv(["メモ"], [["=HYPERLINK(\"https://example.com\")"]])).toBe(
      '"メモ"\r\n"\'=HYPERLINK(""https://example.com"")"',
    )
  })
})
