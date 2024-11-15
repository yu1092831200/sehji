<template>
  <div class="home-container">
    <!-- 设备状态统计卡片 -->
    <div class="status-cards">
      <div class="status-card-wrapper">
        <el-card class="status-card tech-card">
          <div class="card-content">
            <div class="icon-wrapper normal">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="info">
              <div class="card-title">正常设备</div>
              <div class="card-number normal">{{ deviceStats.normal }}</div>
            </div>
          </div>
          <div class="card-footer">
            <span>设备运行正常</span>
            <el-icon><ArrowRight /></el-icon>
          </div>
        </el-card>
      </div>
      <div class="status-card-wrapper">
        <el-card class="status-card tech-card">
          <div class="card-content">
            <div class="icon-wrapper warning">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="info">
              <div class="card-title">异常设备</div>
              <div class="card-number warning">{{ deviceStats.warning }}</div>
            </div>
          </div>
          <div class="card-footer">
            <span>需要关注</span>
            <el-icon><ArrowRight /></el-icon>
          </div>
        </el-card>
      </div>
      <div class="status-card-wrapper">
        <el-card class="status-card tech-card">
          <div class="card-content">
            <div class="icon-wrapper offline">
              <el-icon><Connection /></el-icon>
            </div>
            <div class="info">
              <div class="card-title">离线设备</div>
              <div class="card-number offline">{{ deviceStats.offline }}</div>
            </div>
          </div>
          <div class="card-footer">
            <span>请检查设备</span>
            <el-icon><ArrowRight /></el-icon>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 地图容器 -->
    <div class="map-container tech-card">
      <div class="map-header">
        <div class="title">
          <el-icon><Location /></el-icon>
          <span>监测点位分布</span>
        </div>
        <div class="map-tools">
          <el-radio-group v-model="mapView" size="small">
            <el-radio-button label="2D">2D视图</el-radio-button>
            <el-radio-button label="3D">3D视图</el-radio-button>
          </el-radio-group>
        </div>
      </div>
      <div id="map"></div>
      <!-- 地图图例 -->
      <div class="map-legend">
        <div class="legend-item">
          <span class="dot normal"></span>
          <span>正常</span>
        </div>
        <div class="legend-item">
          <span class="dot warning"></span>
          <span>异常</span>
        </div>
        <div class="legend-item">
          <span class="dot offline"></span>
          <span>离线</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Monitor, Warning, Connection, Location, ArrowRight } from '@element-plus/icons-vue'

const map = ref(null)
const mapView = ref('2D')
const deviceStats = ref({
  normal: 42,
  warning: 3,
  offline: 5
})

// 更新监测点位数据，添加更多信息
const monitoringPoints = [
  { 
    id: 1, 
    name: '监测点1', 
    status: 'normal', 
    position: [116.397428, 39.90923],
    type: '位移监测',
    value: '0.5mm',
    updateTime: '2024-03-20 10:00:00'
  },
  { 
    id: 2, 
    name: '监测点2', 
    status: 'warning', 
    position: [116.387428, 39.91923],
    type: '倾角监测',
    value: '2.3°',
    updateTime: '2024-03-20 09:55:00'
  },
  { 
    id: 3, 
    name: '监测点3', 
    status: 'offline', 
    position: [116.407428, 39.89923],
    type: '应力监测',
    value: '离线',
    updateTime: '2024-03-20 08:30:00'
  }
]

// 监听视图切换
watch(mapView, (newVal) => {
  if (map.value) {
    map.value.setViewMode(newVal)
  }
})

// 修改标记图标生成函数
const getMarkerIcon = (status) => {
  const colors = {
    normal: '#67C23A',
    warning: '#E6A23C',
    offline: '#F56C6C'
  }
  // 使用更现代的科技感标记样式
  return new window.AMap.Icon({
    size: new window.AMap.Size(40, 40),
    imageSize: new window.AMap.Size(40, 40),
    image: `data:image/svg+xml;charset=utf-8,
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="90" fill="${colors[status]}" opacity="0.2"/>
        <circle cx="100" cy="100" r="70" fill="${colors[status]}" opacity="0.4"/>
        <circle cx="100" cy="100" r="50" fill="${colors[status]}" opacity="0.6"/>
        <circle cx="100" cy="100" r="30" fill="${colors[status]}" opacity="0.8"/>
        <circle cx="100" cy="100" r="15" fill="${colors[status]}"/>
        <circle cx="100" cy="100" r="5" fill="white"/>
      </svg>`
  })
}

// 修改信息窗体显示
const showPointInfo = (point) => {
  const content = `
    <div class="info-window">
      <div class="info-header" style="background-color: ${getStatusColor(point.status)}">
        <h4>${point.name}</h4>
        <span class="status">${getStatusText(point.status)}</span>
      </div>
      <div class="info-content">
        <p><strong>监测类型：</strong>${point.type}</p>
        <p><strong>当前数值：</strong>${point.value}</p>
        <p><strong>更新时间：</strong>${point.updateTime}</p>
        <p><strong>位置：</strong>[${point.position.join(', ')}]</p>
      </div>
    </div>
  `
  
  const infoWindow = new window.AMap.InfoWindow({
    content: content,
    offset: new window.AMap.Pixel(0, -30),
    isCustom: true
  })
  
  infoWindow.open(map.value, point.position)
}

// 添加获取状态颜色的辅助函数
const getStatusColor = (status) => {
  const colors = {
    normal: '#67C23A',
    warning: '#E6A23C',
    offline: '#F56C6C'
  }
  return colors[status]
}

// 修改地图初始化函数，添加点位动画
const initMap = () => {
  if (window.AMap) {
    map.value = new window.AMap.Map('map', {
      zoom: 11,
      center: [116.397428, 39.90923],
      viewMode: mapView.value,
      mapStyle: 'amap://styles/normal',
      pitch: mapView.value === '3D' ? 45 : 0,
      resizeEnable: true,
      features: ['bg', 'road', 'building'],
      skyColor: '#C9E6FF'
    })
    
    // 添加地图控件
    map.value.addControl(new window.AMap.Scale({
      position: 'LB'
    }))
    map.value.addControl(new window.AMap.ToolBar({
      position: 'RB',
      liteStyle: true
    }))

    // 添加监测点位标记
    monitoringPoints.forEach(point => {
      const marker = new window.AMap.Marker({
        position: point.position,
        title: point.name,
        icon: getMarkerIcon(point.status),
        offset: new window.AMap.Pixel(-20, -20),
        animation: 'AMAP_ANIMATION_PULSE' // 添加跳动动画
      })

      // 添加鼠标悬停效果
      marker.on('mouseover', () => {
        marker.setAnimation('AMAP_ANIMATION_BOUNCE')
      })
      
      marker.on('mouseout', () => {
        marker.setAnimation('AMAP_ANIMATION_PULSE')
      })

      // 添加点击事件
      marker.on('click', () => {
        showPointInfo(point)
      })

      map.value.add(marker)
    })
  }
}

const getStatusText = (status) => {
  const texts = {
    normal: '正常',
    warning: '异常',
    offline: '离线'
  }
  return texts[status]
}

onMounted(() => {
  initMap()
})
</script>

<style scoped>
.home-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
}

.status-cards {
  display: flex;
  gap: 24px;
  flex-shrink: 0;
}

.status-card-wrapper {
  flex: 1;
  min-width: 0;
}

.tech-card {
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  border: 1px solid #e4e7ed;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
}

.status-card {
  transition: all 0.3s ease;
  overflow: hidden;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.status-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.card-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  position: relative;
  overflow: hidden;
}

.icon-wrapper::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: inherit;
  filter: blur(8px);
  opacity: 0.5;
}

.icon-wrapper.normal { 
  background: linear-gradient(135deg, #67C23A 0%, #95D475 100%);
}
.icon-wrapper.warning { 
  background: linear-gradient(135deg, #E6A23C 0%, #F3D19E 100%);
}
.icon-wrapper.offline { 
  background: linear-gradient(135deg, #F56C6C 0%, #FAB6B6 100%);
}

.icon-wrapper :deep(svg) {
  width: 24px;
  height: 24px;
  color: white;
}

.normal { color: #67C23A; }
.warning { color: #E6A23C; }
.offline { color: #F56C6C; }

.info {
  flex: 1;
}

.card-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.card-number {
  font-size: 32px;
  font-weight: bold;
  background: linear-gradient(45deg, #1a1a1a, #4a4a4a);
  -webkit-background-clip: text;
  color: transparent;
}

.card-footer {
  border-top: 1px solid #f0f2f5;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #909399;
  font-size: 13px;
  background: #fafafa;
}

.card-footer :deep(svg) {
  transition: transform 0.3s;
}

.status-card:hover .card-footer :deep(svg) {
  transform: translateX(4px);
}

.map-container {
  flex: 1;
  min-height: 0;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e4e7ed;
}

.map-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 12px;
  padding: 2px;
  background: linear-gradient(45deg, rgba(255,255,255,0.1), transparent);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.map-header {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.map-header .title {
  display: flex;
  align-items: center;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.map-header .title :deep(svg) {
  margin-right: 8px;
  color: #409EFF;
}

#map {
  height: 100%;
  width: 100%;
}

.map-legend {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  gap: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.legend-item {
  display: flex;
  align-items: center;
  color: #303133;
  font-size: 13px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
  position: relative;
}

.dot::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 50%;
  background: inherit;
  opacity: 0.3;
}

:deep(.info-window) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid #e4e7ed;
}

:deep(.info-header) {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  background: linear-gradient(135deg, #409EFF, #36cfc9);
}

:deep(.info-header h4) {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

:deep(.info-header .status) {
  font-size: 12px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  backdrop-filter: blur(4px);
}

:deep(.info-content) {
  padding: 16px;
  background: white;
}

:deep(.info-content p) {
  margin: 8px 0;
  font-size: 14px;
  color: #606266;
  display: flex;
  align-items: center;
}

:deep(.info-content strong) {
  color: #303133;
  margin-right: 8px;
  min-width: 80px;
}

/* 添加地图工具栏样式 */
:deep(.amap-toolbar) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e4e7ed;
}

/* 添加地图缩放控件样式 */
:deep(.amap-scale) {
  background-color: rgba(255, 255, 255, 0.9);
  padding: 2px 4px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}
</style> 