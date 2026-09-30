import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_SRC = '/Users/cbj/Documents/code/rednote-core/data'
const DATA_OUT = path.join(__dirname, '..', 'public', 'data', 'rednote-merged.json')
const ACCOUNT_ID = 'Ailsasha977'
const ACCOUNT_NAME = '吴睿莎'

function listJsonFiles(directory) {
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name)
    return entry.isDirectory() ? listJsonFiles(target) : entry.isFile() && entry.name.endsWith('.json') ? [target] : []
  })
}

const candidates = listJsonFiles(DATA_SRC).flatMap(file => {
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'))
    return String(data.profile?.red_id ?? '').toLowerCase() === ACCOUNT_ID.toLowerCase() && Array.isArray(data.notes)
      ? [{ file, data }]
      : []
  } catch (error) {
    console.warn(`⚠️  ${file}: 读取失败，跳过 (${error.message})`)
    return []
  }
}).sort((a, b) => Date.parse(b.data.exported_at ?? 0) - Date.parse(a.data.exported_at ?? 0))

const latest = candidates[0]?.data
if (!latest) console.warn(`⚠️  未找到小红书号 ${ACCOUNT_ID} 的导出 JSON，将生成空数据文件`)
const profile = { user_id: '', nickname: ACCOUNT_NAME, red_id: ACCOUNT_ID, description: '', avatar: '', ...(latest?.profile ?? {}) }
const notes = [...(latest?.notes ?? [])].filter(note => note.note_id).sort((a, b) =>
  String(b.published_at ?? '').localeCompare(String(a.published_at ?? '')) || String(b.note_id).localeCompare(String(a.note_id))
)
const output = {
  generated_at: new Date().toISOString(),
  source: 'rednote-core/data',
  source_exported_at: latest?.exported_at ?? null,
  account_id: ACCOUNT_ID,
  account_count: 1,
  accounts: [{ ...profile, note_count: notes.length }],
  total_notes: notes.length,
  notes,
}

fs.mkdirSync(path.dirname(DATA_OUT), { recursive: true })
fs.writeFileSync(DATA_OUT, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
console.log('✅ 小红书合并完成！')
console.log(`   账号: ${profile.nickname}（${ACCOUNT_ID}）`)
console.log(`   作品数量: ${notes.length}`)
console.log(`   输出文件: ${DATA_OUT}`)

