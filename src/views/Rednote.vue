<template>
  <div class="rednote-page">
    <div class="page-header">
      <p class="page-stats">共 <b>{{ allNotes.length }}</b> 条作品 · 来自 <b>{{ accounts.length }}</b> 个账号
        <span v-if="activeAccount"> · 当前账号：<b>{{ activeAccount }}</b>（{{ accountFilteredCount }} 条）</span>
      </p>
      <p class="page-stats">所有发布时间均为北京时间</p>
    </div>

    <el-card class="account-filter-card" shadow="never">
      <div class="account-filter-area">
        <span class="account-chip" :class="{ active: activeAccount === null }" @click="activeAccount = null">全部（{{ allNotes.length }}）</span>
        <span v-for="account in accounts" :key="account.red_id || account.user_id" class="account-chip"
          :class="{ active: activeAccount === account.nickname }" @click="toggleAccount(account.nickname)">
          {{ account.nickname }}（{{ account.note_count }}）
        </span>
      </div>
    </el-card>

    <el-card class="toolbar-card" shadow="never">
      <div class="toolbar">
        <div class="search-area">
          <el-input v-model="searchText" placeholder="搜索作品标题、描述、标签或账号..." size="large" clearable
            :prefix-icon="Search" class="search-input" />
          <el-radio-group v-model="searchMode" size="default" class="search-mode">
            <el-radio-button label="exact"><el-icon><Connection /></el-icon> 精确</el-radio-button>
            <el-radio-button label="fuzzy"><el-icon><Menu /></el-icon> 模糊</el-radio-button>
          </el-radio-group>
        </div>
        <div class="sort-area">
          <span class="sort-label">排序：</span>
          <el-select v-model="sortField" size="default" style="width:130px">
            <el-option label="发布时间" value="created" /><el-option label="点赞" value="like" />
            <el-option label="收藏" value="collect" /><el-option label="评论" value="comment" /><el-option label="分享" value="share" />
          </el-select>
          <el-button :icon="sortAsc ? SortUp : SortDown" @click="sortAsc = !sortAsc" class="sort-order-btn">{{ sortAsc ? '升序' : '降序' }}</el-button>
        </div>
      </div>
    </el-card>

    <div v-if="searchText && !loading" class="search-summary">搜索“<b>{{ searchText }}</b>”找到 <b>{{ filteredNotes.length }}</b> 个结果
      <span class="mode-badge">{{ searchMode === 'fuzzy' ? '模糊匹配' : '精确匹配' }}</span>
    </div>

    <div v-if="pagedNotes.length" class="note-grid">
      <article v-for="note in pagedNotes" :key="note.note_id" class="note-card" @click="openNote(note)">
        <div class="note-head"><div><strong class="account-name">{{ note.author_name || defaultAccountName }}</strong>
          <div class="note-time">{{ formatDateTime(note.published_at) }}</div></div>
        </div>
        <h3 class="note-title" v-html="highlightMatches(note.title || '无标题作品')"></h3>
        <div v-if="note.description && note.description !== note.title" class="note-description" v-html="highlightMatches(note.description)"></div>
        <div v-if="note.tags?.length" class="tags"><span v-for="tag in note.tags" :key="tag">#{{ tag }}</span></div>
        <div class="note-details"><span>{{ mediaLabel(note) }}</span></div>
        <div class="note-stats"><span>点赞 {{ formatNumber(note.liked_count) }}</span><span>收藏 {{ formatNumber(note.collected_count) }}</span>
          <span>评论 {{ formatNumber(note.comment_count) }}</span><span>分享 {{ formatNumber(note.share_count) }}</span></div>
      </article>
    </div>
    <div v-if="totalPages > 1" class="pagination-area"><el-pagination v-model:current-page="currentPage" :page-size="pageSize"
      :total="filteredNotes.length" layout="prev, pager, next, total" background @current-change="scrollToTop" /></div>
    <el-empty v-else-if="!loading && !pagedNotes.length" description="没有找到匹配的小红书作品 🍃" />
    <div v-if="loading" class="loading-state"><el-skeleton :rows="8" animated /></div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { Connection, Menu, Search, SortDown, SortUp } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const allNotes = ref([]), accounts = ref([]), loading = ref(true)
const activeAccount = ref(null), searchText = ref(''), searchMode = ref('exact'), sortField = ref('created'), sortAsc = ref(false), currentPage = ref(1)
const pageSize = 24
const defaultAccountName = computed(() => accounts.value[0]?.nickname || '')
const accountFilteredCount = computed(() => activeAccount.value ? allNotes.value.filter(note => (note.author_name || defaultAccountName.value) === activeAccount.value).length : allNotes.value.length)
const matchFn = computed(() => searchMode.value === 'exact' ? exactMatch : fuzzyMatch)
const filteredNotes = computed(() => {
  const query = searchText.value.trim(); let notes = allNotes.value
  if (activeAccount.value) notes = notes.filter(note => (note.author_name || defaultAccountName.value) === activeAccount.value)
  if (query) notes = notes.filter(note => matchFn.value([note.title, note.description, note.author_name, ...(note.tags ?? [])].join(' '), query))
  return [...notes].sort((a, b) => { const left = sortValue(a, sortField.value), right = sortValue(b, sortField.value); return sortAsc.value ? left - right : right - left })
})
const totalPages = computed(() => Math.ceil(filteredNotes.value.length / pageSize))
const pagedNotes = computed(() => filteredNotes.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize))
function exactMatch(text, query) { return String(text || '').toLowerCase().includes(query.toLowerCase()) }
function fuzzyMatch(text, query) { const source = String(text || '').toLowerCase(), target = query.toLowerCase(); let index = 0; for (const char of source) if (char === target[index]) index += 1; return index === target.length }
function parseCount(value) { const text = String(value ?? '').trim().toLowerCase(); if (!text) return 0; const number = Number.parseFloat(text.replace(/[,，]/g, '')); if (!Number.isFinite(number)) return 0; if (text.includes('万') || text.includes('w')) return number * 10000; if (text.includes('k')) return number * 1000; return number }
function parseDate(value) { if (!value) return 0; const normalized = String(value).replace('_', 'T'); return Date.parse(/[zZ]|[+-]\d\d:\d\d$/.test(normalized) ? normalized : `${normalized}+08:00`) || 0 }
function sortValue(note, field) { if (field === 'created') return parseDate(note.published_at); return parseCount({ like: note.liked_count, collect: note.collected_count, comment: note.comment_count, share: note.share_count }[field]) }
function toggleAccount(name) { activeAccount.value = activeAccount.value === name ? null : name }
function openNote(note) { window.open(note.url, '_blank', 'noopener') }
function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }) }
function formatDateTime(value) { return value ? String(value).replace('_', ' ') : '发布时间暂无记录' }
function formatNumber(value) { const number = parseCount(value); if (number >= 10000) return `${(number / 10000).toFixed(1)}万`; if (number >= 1000) return `${(number / 1000).toFixed(1)}k`; return String(Math.round(number)) }
function mediaLabel(note) { return String(note.type || '').includes('视频') ? '🎬 视频' : '🖼️ 图文' }
function escapeHtml(value = '') { return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }
function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
function highlightMatches(value = '') { const escaped = escapeHtml(value), query = searchText.value.trim(); if (!query || searchMode.value === 'fuzzy') return escaped.replace(/\n/g, '<br>'); return escaped.replace(new RegExp(`(${escapeRegex(query)})`, 'gi'), '<mark class="highlight">$1</mark>').replace(/\n/g, '<br>') }
watch([searchText, searchMode, activeAccount, sortField, sortAsc], () => { currentPage.value = 1 })
onMounted(async () => { try { const response = await fetch('/data/rednote-merged.json'); if (!response.ok) throw new Error(`HTTP ${response.status}`); const data = await response.json(); allNotes.value = data.notes ?? []; accounts.value = data.accounts ?? [] } catch (error) { console.error('加载小红书数据失败:', error); ElMessage.error('加载小红书数据失败，请先运行合并脚本') } finally { loading.value = false } })
</script>

<style scoped>
.rednote-page{max-width:1300px;margin:0 auto;padding:0 16px 40px;overflow-x:hidden}.page-header{text-align:center;margin-bottom:20px}.page-stats{color:#909399;font-size:14px;margin:0}.page-stats b{color:#303133}.account-filter-card,.toolbar-card{margin-bottom:16px;border-radius:12px}.account-filter-area{display:flex;flex-wrap:nowrap;gap:8px;overflow-x:auto;padding-bottom:2px}.account-chip{display:inline-block;padding:6px 14px;border-radius:20px;background:#f5f5f5;color:#606266;font-size:13px;cursor:pointer;transition:.2s;white-space:nowrap;user-select:none}.account-chip:hover{background:#fff0f3;color:#ff2442}.account-chip.active{background:#409eff;color:#fff;font-weight:600}.toolbar{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px}.search-area{display:flex;align-items:center;gap:12px;flex:1;min-width:300px}.search-input{max-width:400px}.search-mode{display:inline-flex;flex-wrap:nowrap;flex-shrink:0}.sort-area{display:flex;align-items:center;gap:10px;flex-shrink:0}.sort-label{color:#909399;font-size:14px}.sort-order-btn{white-space:nowrap}.search-summary{margin-bottom:16px;font-size:14px;color:#606266}.mode-badge{display:inline-block;margin-left:8px;padding:1px 8px;border-radius:10px;font-size:12px;background:#fff0f4;color:#e94f87}.note-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.note-card{display:flex;flex-direction:column;min-width:0;background:#fff;border-radius:12px;padding:18px;box-shadow:0 2px 8px #0000000f;cursor:pointer;transition:.2s}.note-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px #0000001a}.note-head{display:flex;justify-content:space-between;gap:12px;margin-bottom:12px}.account-name{color:#e94f87}.note-time{font-size:12px;color:#a8abb2;margin-top:4px}.note-title{font-size:15px;line-height:1.75;color:#303133;word-break:break-word;margin:0;font-weight:600}.note-description{font-size:14px;line-height:1.7;color:#606266;margin-top:8px;word-break:break-word}.tags{display:flex;flex-wrap:wrap;gap:4px 10px;color:#e94f87;font-size:12px;margin-top:10px}.note-details{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:12px;color:#909399;font-size:12px}.note-stats{display:flex;justify-content:flex-end;gap:24px;padding-top:12px;margin-top:auto;border-top:1px solid #f0f0f0;color:#909399;font-size:13px}.pagination-area{display:flex;justify-content:center;margin-top:28px}.loading-state{background:#fff;padding:24px;border-radius:12px}:deep(.highlight){background:#fff2a8;color:#c45600;padding:0 2px;border-radius:2px}:deep(.search-mode .el-radio-button__inner){white-space:nowrap}
@media(max-width:768px){.rednote-page{padding:0 4px 30px}.search-area{min-width:100%;flex-wrap:wrap}.search-input{max-width:none}.toolbar,.sort-area{width:100%}.note-grid{grid-template-columns:1fr}.note-card{padding:14px}.note-stats{justify-content:space-between;gap:8px}.pagination-area{overflow-x:auto;justify-content:flex-start}}
</style>

