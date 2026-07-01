<template>
  <!-- 1. 包裹 ElConfigProvider 并绑定中文包 -->
  <el-config-provider :locale="zhCn">
    <div class="app-wrapper" :style="{ backgroundImage: `url(${bgImage})` }">
      <nav class="nav-bar">
        <!-- ... 导航栏代码保持不变 ... -->
        <div class="nav-content">
          <span class="logo">BEJ48 吴睿莎</span>
          <div class="links">
            <!-- 唱歌 - 下拉菜单 -->
            <el-dropdown class="tool-dropdown" :show-timeout="100">
              <span class="el-dropdown-link">
                唱歌
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item>
                    <router-link to="/" class="dropdown-item-link">
                    🎤 直播唱歌切片记录
                    </router-link>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <a href="https://abm48.com" target="_blank" class="dropdown-item-link">
                    🎤 小偶像音乐网站(abm48)
                    </a>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <a href="https://tools.abm48.com/clip" target="_blank" class="dropdown-item-link">
                    ✂️ 批量剪切（可导入切片本剪切）
                    </a>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

            <!-- 口袋48 - 下拉菜单 -->
            <el-dropdown class="tool-dropdown" :show-timeout="100">
              <span class="el-dropdown-link">
                口袋48
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item>
                    <a href="https://msg48.org/live/83099892" target="_blank" class="dropdown-item-link">
                    📺 口袋48录播回放
                    </a>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <a href="https://msg48.org" target="_blank" class="dropdown-item-link">
                    🗂️ 口袋48历史记录搜索
                    </a>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <a href="https://github.com/duan602728596/48tools/releases" target="_blank" class="dropdown-item-link">
                    💾 48tools
                    </a>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <!-- 简介 -->
            <router-link to="/profile">简介</router-link>

            <!-- 工具 - 直接跳转 -->
            <a href="https://tools.abm48.com/" target="_blank">工具</a>

            <!-- 关于 -->
            <router-link to="/about">关于</router-link>
          </div>
        </div>
      </nav>

      <div class="main-container">
        <router-view />
      </div>

    </div>
  </el-config-provider>
</template>

<script setup>
import bgImage from './assets/bg.jpg'
import { ArrowDown } from '@element-plus/icons-vue'
// 2. 引入 Element Plus 中文语言包
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import { ElConfigProvider } from 'element-plus'
</script>

<style>
/* 全局字体设置，模仿一般个人主页的清爽字体 */
body { 
  margin: 0; 
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
}

.app-wrapper {
  min-height: 100vh;
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  background-repeat: no-repeat;
}

.nav-bar {
  background: rgba(255, 255, 255, 0.95); /* 背景稍微白一点，更像门户站 */
  backdrop-filter: blur(10px);
  padding: 1rem 0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05); /* 阴影变淡 */
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-content {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  flex-wrap: wrap; 
}

/* Logo 改成红色 */
.logo { 
  font-weight: bold; 
  font-size: 1.3rem; 
  color: #6600ffc6; 
  margin-right: 20px;
}

.links {
  display: flex;
  gap: 30px; /* 间距拉大 */
  align-items: center;
}

/* --- 核心修改：模仿你个人网站的导航链接样式 --- */
.links a {
  text-decoration: none;
  color: #303133; /* 深灰色，显专业 */
  font-weight: 600; /* 加粗 */
  font-size: 16px;
  position: relative;
  padding-bottom: 5px;
  transition: color 0.3s;
}

/* 鼠标悬停变蓝 */
.links a:hover, .links a.router-link-active { 
  color: #409EFF; /* 经典的 Element Plus 蓝 */
}

/* 简单的底部蓝色条效果（可选） */
.links a::after {
  content: '';
  position: absolute;
  width: 0;
  height: 2px;
  bottom: 0;
  left: 50%;
  background-color: #409EFF;
  transition: all 0.3s;
}
.links a:hover::after {
  width: 100%;
  left: 0;
}

.main-container {
  max-width: 900px;
  margin: 30px auto;
  padding: 0 20px;
  min-height: 80vh;
}

/* 下拉触发文字的样式 (模仿其他链接) */
.el-dropdown-link {
  cursor: pointer;
  color: #303133;
  font-weight: 600;
  font-size: 16px;
  display: flex;
  align-items: center;
  outline: none; /* 去掉点击时的蓝框 */
}

/* 鼠标悬停变蓝 */
.el-dropdown-link:hover {
  color: #409EFF;
}

/* 下拉菜单里的链接样式 */
.dropdown-item-link {
  text-decoration: none;
  color: #606266;
  display: block;
  width: 100%;
  height: 100%;
}

.dropdown-item-link:hover {
  color: #409EFF;
}
</style>