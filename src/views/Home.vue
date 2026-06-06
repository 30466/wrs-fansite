<template>
  <div class="home-page">
    
    <!-- 顶部说明卡片 -->
    <el-card class="notice-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">💡 检索说明</span>
          <div class="header-actions">
            <!-- 1. 新增的上传按钮 -->
            <router-link to="/upload" class="upload-link">
              <el-button type="warning" plain size="large">
                <!-- 这里的 Upload 图标会自动导入，不用管 script -->
                <el-icon class="el-icon--left"><Upload /></el-icon>
                上传切片本
              </el-button>
            </router-link>

            <!-- 批量下载按钮 -->
            <el-button 
              type="primary" 
              size="large" 
              class="batch-download-btn"
              :loading="downloading"
              @click="handleBatchDownload"
            >
              <el-icon class="el-icon--left"><Download /></el-icon>
              批量下载当前列表切片本 ({{ fileCount }})
            </el-button>
          </div>
        </div>
      </template>
      <div class="notice-content">
        <p>1. 本站日期以<b>第二天凌晨 06:00</b>为界，归档为前一天。本站只有从<b>2025-11-01</b>及其之后的记录</p>
        <p>2. 点击<b>“去听歌”</b>会自动复制搜索词并跳转，请在音乐网站搜索框<b>粘贴(Ctrl+V)</b></p>
        <p>3. 本网站仅支持<b>歌名</b>和<b>日期</b>搜索。如要<b>精确搜索</b>如<b>歌手</b>,<b>语种</b>等，请到小偶像音乐网站搜索</p>
        <p>4. 本站<b>切片本</b>可在<b>"功能区"</b>的<b>批量剪切</b>一键导入后批量剪切</p>
      </div>
    </el-card>

    <!-- 模式切换：增加了 日历视图 -->
    <div class="mode-switch">
      <el-radio-group v-model="viewMode" size="large" fill="#409EFF">
        <el-radio-button label="songs">
          <el-icon><Microphone /></el-icon> 切片列表
        </el-radio-button>
        <el-radio-button label="dates">
          <el-icon><CopyDocument /></el-icon> 日期卡片
        </el-radio-button>
        <el-radio-button label="calendar">
          <el-icon><Calendar /></el-icon> 日历视图
        </el-radio-button>
      </el-radio-group>
    </div>

    <!-- 模式 A: 切片列表 -->
    <div v-show="viewMode === 'songs'">
      <div class="search-section">
        <el-input
          v-model="searchText"
          placeholder="输入歌名 或 日期 (例如: 2025-11-23)..."
          size="large"
          prefix-icon="Search"
          clearable
        />
      </div>

      <div class="song-list" v-loading="loading">
        <div v-if="filteredList.length === 0 && !loading" class="empty-tip">
          没有找到相关记录 🍃
        </div>

        <el-card v-for="item in filteredList" :key="item.id" class="song-card" shadow="hover">
          <div class="card-body">
            <div class="info">
              <h3 class="song-title">{{ item.cleanName }}</h3>
              <div class="meta">
                <el-tag size="small" effect="plain">{{ item.date }}</el-tag>
                <span class="time-range">⏰ {{ item.startTime }} - {{ item.endTime }}</span>
              </div>
            </div>
            <div class="actions">
              <el-button type="primary" round @click="copyAndJump(item)">
                <el-icon><Headset /></el-icon> 去听歌
              </el-button>
              <el-button plain round @click="openTxtModal(item)">
                <el-icon><Document /></el-icon> 查看切片本
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 模式 B: 日期卡片归档 -->
    <div v-show="viewMode === 'dates'" v-loading="loading">
      <div class="date-grid">
        <div v-for="(group, date) in dateGroups" :key="date" class="date-card" @click="selectDate(date)">
          <div class="date-header">{{ date }}</div>
          <div class="date-count">🎵 共 {{ group.length }} 首</div>
          <div class="date-preview">
            <span v-for="song in group.slice(0, 3)" :key="song.id">{{ song.cleanName }}</span>
            <span v-if="group.length > 3">...</span>
          </div>
        </div>
      </div>
    </div>

<!-- 模式 C: 日历视图 (修改版) -->
    <div v-show="viewMode === 'calendar'" v-loading="loading" class="calendar-wrapper">
      <el-calendar v-model="calendarDate" ref="calendarRef">
        <!-- 自定义头部：年份选择 + 月份选择 -->
        <template #header>
          <div class="calendar-custom-header">
            <!-- 年份选择器 -->
            <el-select v-model="selectedYear" placeholder="年份" style="width: 120px" @change="updateCalendar">
              <el-option
                v-for="year in yearList"
                :key="year"
                :label="year + '年'"
                :value="year"
              />
            </el-select>

            <!-- 月份选择器 -->
            <el-select v-model="selectedMonth" placeholder="月份" style="width: 100px; margin-left: 10px;" @change="updateCalendar">
              <el-option
                v-for="month in 12"
                :key="month"
                :label="month + '月'"
                :value="month"
              />
            </el-select>
            
            <el-button size="small" style="margin-left: auto" @click="resetToToday">回到今天</el-button>
          </div>
        </template>

        <template #date-cell="{ data }">
          <!-- 自定义单元格内容 (保持之前的逻辑不变) -->
          <div 
            class="custom-cell" 
            :class="{ 'is-singing-day': hasSong(data.day) }"
            @click.stop="handleCalendarClick(data.day)"
          >
            <div class="cell-date">
              {{ data.day.split('-').slice(2).join('') }} 
            </div>
            
            <div v-if="hasSong(data.day)" class="cell-content">
              <span>🎵 唱了 {{ getSongCount(data.day) }} 首</span>
            </div>
          </div>
        </template>
      </el-calendar>
    </div>

    <!-- TXT 弹窗 -->
    <el-dialog v-model="dialogVisible" :title="currentFile.filename" width="80%" top="5vh">
      <pre class="txt-content">{{ currentFile.content }}</pre>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="downloadSingleTxt">下载该切片本</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import JSZip from 'jszip'; 
import { ElMessage } from 'element-plus';

const MUSIC_SITE_URL = "https://abm48.com/#/pages/index/index"; 
// 默认模式改成 calendar 或者是 dates，看你喜好
const viewMode = ref('dates'); 

const allSongs = ref([]);
const searchText = ref('');
const loading = ref(true);
const downloading = ref(false);
const dialogVisible = ref(false);
const currentFile = ref({ filename: '', content: '' });

// --- 日历控制变量 ---
const calendarDate = ref(new Date()); // 当前日历显示的日期对象
const currentYearNum = new Date().getFullYear();

// 生成年份列表 (例如：2023 ~ 2030)
const yearList = computed(() => {
  const years = [];
  // 从2023年开始，直到明年 (你可以根据需要修改起始年份)
  for (let y = 2025; y <= currentYearNum ; y++) {
    years.push(y);
  }
  return years;
});

// 绑定的选择器变量
const selectedYear = ref(currentYearNum);
const selectedMonth = ref(new Date().getMonth() + 1); // 1-12

// 当下拉框变化时，更新日历
const updateCalendar = () => {
  // 设置日历时间为：选中的年-选中的月-1号
  calendarDate.value = new Date(selectedYear.value, selectedMonth.value - 1, 1);
};

// 回到今天
const resetToToday = () => {
  const today = new Date();
  calendarDate.value = today;
  selectedYear.value = today.getFullYear();
  selectedMonth.value = today.getMonth() + 1;
};

onMounted(async () => {
  document.title = '吴睿莎 ✽ 直播唱歌记录';
  try {
    const res = await fetch(`/data.json?t=${new Date().getTime()}`);
    if (res.ok) {
      allSongs.value = await res.json();
    }
  } catch (e) { console.error(e); } 
  finally { loading.value = false; }
});

const filteredList = computed(() => {
  if (!searchText.value) return allSongs.value;
  const query = searchText.value.toLowerCase().trim();
  return allSongs.value.filter(song => {
    return song.cleanName.toLowerCase().includes(query) || 
           song.rawName.toLowerCase().includes(query) || 
           song.date.includes(query);
  });
});

const fileCount = computed(() => {
  const files = new Set(filteredList.value.map(item => item.filename));
  return files.size;
});

const dateGroups = computed(() => {
  const groups = {};
  allSongs.value.forEach(song => {
    if (!groups[song.date]) groups[song.date] = [];
    groups[song.date].push(song);
  });
  return groups;
});

// --- 日历相关的逻辑 ---

// 1. 判断某天是否有歌
const hasSong = (dayStr) => {
  return !!dateGroups.value[dayStr];
};

// 2. 获取某天歌曲数量
const getSongCount = (dayStr) => {
  return dateGroups.value[dayStr] ? dateGroups.value[dayStr].length : 0;
};

// 3. 处理日历点击
const handleCalendarClick = (dayStr) => {
  if (hasSong(dayStr)) {
    // 如果有歌：跳转到列表并搜索该日期
    selectDate(dayStr);
  } else {
    // 如果没歌：提示用户
    ElMessage.info(`${dayStr} 小偶像没有唱歌哦 ~`);
  }
};

const selectDate = (date) => {
  searchText.value = date; 
  viewMode.value = 'songs'; // 切回列表模式
  window.scrollTo({ top: 0, behavior: 'smooth' });
  ElMessage.success(`已定位到 ${date} 的记录`);
};

// --- 其他逻辑保持不变 ---
const copyAndJump = async (item) => {
  const dateForSearch = item.date.replace(/-/g, '');
  const keywords = `${item.cleanName} 吴睿莎 ${dateForSearch}`;
  try {
    await navigator.clipboard.writeText(keywords);
    ElMessage({
      message: `已复制: "${keywords}"，正在跳转...`,
      type: 'success',
      duration: 3000,
      showClose: true
    });
    setTimeout(() => { window.open(MUSIC_SITE_URL, '_blank'); }, 500);
  } catch (err) {
    ElMessage.warning('复制失败，请手动输入');
    window.open(MUSIC_SITE_URL, '_blank');
  }
};

const openTxtModal = (item) => {
  currentFile.value = { filename: item.filename, content: item.fullContent };
  dialogVisible.value = true;
};

const downloadSingleTxt = () => {
  const blob = new Blob([currentFile.value.content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = currentFile.value.filename;
  link.click();
  URL.revokeObjectURL(url);
};

const handleBatchDownload = async () => {
  if (filteredList.value.length === 0) { ElMessage.warning('列表为空'); return; }
  downloading.value = true;
  const zip = new JSZip();
  const processedFiles = new Set();
  filteredList.value.forEach(song => {
    if (!processedFiles.has(song.filename)) {
      zip.file(song.filename, song.fullContent);
      processedFiles.add(song.filename);
    }
  });
  try {
    const content = await zip.generateAsync({ type: 'blob' });
    const dateStr = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `Sihui_Archive_${dateStr}.zip`;
    link.click();
    ElMessage.success(`成功打包下载 ${processedFiles.size} 个文件！`);
  } catch (err) { ElMessage.error('打包下载失败'); } 
  finally { downloading.value = false; }
};
</script>

<style scoped>
.home-page { padding-bottom: 50px; }
.notice-card { margin-bottom: 20px; background: rgba(255, 255, 255, 0.95); }
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap; /* 允许换行，防止手机端挤爆 */
  gap: 10px;       /* 上下左右的间距 */
}

/* --- 新增以下样式 --- */
.header-actions {
  display: flex;
  align-items: center;
  gap: 10px; /* 两个按钮之间的间距 */
  flex-wrap: wrap;
}

.upload-link {
  text-decoration: none; /* 去掉 router-link 默认的下划线 */
}
.header-title { font-weight: bold; font-size: 18px; color: #333; }
.batch-download-btn { font-weight: bold; font-size: 16px; box-shadow: 0 4px 10px rgba(64, 158, 255, 0.3); }
.notice-content p { margin: 5px 0; font-size: 14px; color: #555; }
.mode-switch { display: flex; justify-content: center; margin-bottom: 25px; }

/* 列表样式 */
.search-section { margin-bottom: 20px; }
.song-card { margin-bottom: 15px; background: rgba(255, 255, 255, 0.9); }
.card-body { display: flex; justify-content: space-between; align-items: center; }
@media (max-width: 600px) {
  .card-body { flex-direction: column; align-items: flex-start; }
  .actions { margin-top: 15px; width: 100%; display: flex; justify-content: space-between; }
  .card-header { flex-direction: column; align-items: flex-start; gap: 10px; }
}
.song-title { margin: 0 0 8px 0; font-size: 18px; color: #333; }
.meta { color: #666; font-size: 14px; }
.time-range { margin-left: 10px; }
.txt-content { white-space: pre-wrap; font-family: monospace; background: #f5f5f5; padding: 15px; max-height: 60vh; overflow-y: auto; }

/* 日期卡片归档样式 */
.date-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
.date-card { background: rgba(255, 255, 255, 0.9); padding: 15px; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
.date-card:hover { transform: translateY(-3px); background: #fff; border: 1px solid #409EFF; box-shadow: 0 5px 15px rgba(64, 158, 255, 0.2); }
.date-header { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 5px; }
.date-count { font-size: 13px; color: #ff6b81; font-weight: bold; margin-bottom: 10px; }
.date-preview span { background: #f0f2f5; padding: 2px 6px; border-radius: 4px; font-size: 12px; color: #888; margin-right: 5px;}

/* --- 日历视图样式 (核心修改) --- */
/* 日历自定义头部样式 */
.calendar-custom-header {
  display: flex;
  align-items: center;
  width: 100%;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}
.calendar-wrapper {
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border-radius: 8px;
}

/* 强制让 element-plus 的日历单元格内容撑满，方便点击 */
:deep(.el-calendar-table .el-calendar-day) {
  padding: 0;
  height: 85px; /* 设置单元格高度 */
}

.custom-cell {
  height: 100%;
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.2s;
}

.cell-date {
  font-size: 14px;
}

/* 有歌的日子：黑体加粗，背景微蓝 */
.is-singing-day {
  background-color: #ecf5ff; /* 浅蓝背景 */
  color: #409EFF;
  font-weight: bold;
  cursor: pointer;
}

.is-singing-day:hover {
  background-color: #d9ecff; /* 悬浮加深 */
}

.cell-content {
  font-size: 12px;
  color: #ff6b81; /* 粉色显示歌曲数 */
  margin-top: 4px;
}

/* 没歌的日子 (默认样式其实就是透明，但为了保险可以写一下) */
/* Element Plus 默认非本月日期是灰色的，这里不需要额外处理 */
</style>