import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"
import { initialOrganizations, initialProjects } from "@/lib/event-data"
import { initialMembers } from "@/lib/members"

const dataPath = path.join(process.cwd(), "data", "app-data.json")

async function readData() {
  try {
    const text = await readFile(dataPath, "utf8")
    return JSON.parse(text)
  } catch {
    const initialData = {
      members: initialMembers,
      organizations: initialOrganizations,
      projects: initialProjects,
      updatedAt: new Date().toISOString(),
    }
    await mkdir(path.dirname(dataPath), { recursive: true })
    await writeFile(dataPath, JSON.stringify(initialData, null, 2), "utf8")
    return initialData
  }
}

export async function GET() {
  return NextResponse.json(await readData())
}

export async function PUT(request: Request) {
  const body = await request.json()
  const nextData = { ...body, updatedAt: new Date().toISOString() }
  await mkdir(path.dirname(dataPath), { recursive: true })
  await writeFile(dataPath, JSON.stringify(nextData, null, 2), "utf8")
  return NextResponse.json(nextData)
}
