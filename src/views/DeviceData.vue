<template>
  <div class="device-data-container">
    <div class="header">
      <h2>设备数据</h2>
      <div class="filter-section tech-filter">
        <el-select v-model="selectedDevice" placeholder="选择设备" style="width: 200px">
          <el-option
            v-for="device in devices"
            :key="device.id"
            :label="device.name"
            :value="device.id"
          />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :shortcuts="dateShortcuts"
        />
        <el-button type="primary" class="tech-button" @click="queryData">查询</el-button>
      </div>
    </div>

    <div class="content-container">
      <!-- 左侧趋势图 -->
      <div class="chart-section">
        <el-card class="chart-card tech-card">
          <template #header>
            <div class="chart-header">
              <span class="title">
                <el-icon><DataLine /></el-icon>
                数据趋势图
              </span>
              <el-radio-group v-model="chartType" size="small">
                <el-radio-button label="hour">小时</el-radio-button>
                <el-radio-button label="day">天</el-radio-button>
                <el-radio-button label="month">月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart" ref="chartRef"></div>
        </el-card>

        <!-- 数据统计卡片 -->
        <div class="data-stats">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-card class="stat-card tech-card" shadow="hover">
                <div class="stat-content">
                  <div class="stat-icon normal">
                    <el-icon><TrendCharts /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-label">最大值</div>
                    <div class="stat-value">98.5</div>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="stat-card tech-card" shadow="hover">
                <div class="stat-content">
                  <div class="stat-icon warning">
                    <el-icon><TrendCharts /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-label">最小值</div>
                    <div class="stat-value">23.1</div>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="stat-card tech-card" shadow="hover">
                <div class="stat-content">
                  <div class="stat-icon primary">
                    <el-icon><TrendCharts /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-label">平均值</div>
                    <div class="stat-value">67.8</div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- 右侧数据表格 -->
      <div class="table-section">
        <el-card class="tech-card">
          <template #header>
            <div class="table-header">
              <span class="title">
                <el-icon><List /></el-icon>
                数据列表
              </span>
              <el-button-group>
                <el-button size="small" type="primary">
                  <el-icon><Download /></el-icon>导出
                </el-button>
                <el-button size="small">
                  <el-icon><RefreshRight /></el-icon>刷新
                </el-button>
              </el-button-group>
            </div>
          </template>
          <el-table :data="tableData" border style="width: 100%" height="calc(100vh - 380px)">
            <el-table-column prop="timestamp" label="时间" width="160" />
            <el-table-column prop="value" label="数值" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" />
          </el-table>
          <div class="pagination">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next"
              :total="total"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import { DataLine, TrendCharts, List, Download, RefreshRight } from '@element-plus/icons-vue'

// 设备列表
const devices = ref([
  { id: '001', name: '设备1' },
  { id: '002', name: '设备2' },
  { id: '003', name: '设备3' },
])

// 查询条件
const selectedDevice = ref('')
const dateRange = ref([])
const chartType = ref('hour')

// 图表相关
const chartRef = ref(null)
let chart = null

// 表格数据
const tableData = ref([
  {
    timestamp: '2024-03-20 10:00:00',
    value: 23.5,
    status: 'normal',
    description: '正常监测数据'
  },
  // 更多数据...
])

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

// 日期快捷选项
const dateShortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    },
  },
  {
    text: '最近一月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    },
  },
]

// 状态样式
const getStatusType = (status) => {
  const types = {
    normal: 'success',
    warning: 'warning',
    error: 'danger'
  }
  return types[status]
}

const getStatusText = (status) => {
  const texts = {
    normal: '正常',
    warning: '警告',
    error: '错误'
  }
  return texts[status]
}

// 查询数据
const queryData = () => {
  // 这里添加实际的数据查询逻辑
  console.log('查询条件:', {
    device: selectedDevice.value,
    dateRange: dateRange.value,
    chartType: chartType.value
  })
  initChart()
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return
  
  if (!chart) {
    chart = echarts.init(chartRef.value)
  }

  const { xData, data } = generateGnssData(chartType.value)
  const longitudeData = data.map(item => item[0])
  const latitudeData = data.map(item => item[1])

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        return `时间：${params[0].axisValue}<br/>
                经度：${params[0].data.toFixed(6)}°<br/>
                纬度：${params[1].data.toFixed(6)}°`
      }
    },
    legend: {
      data: ['经度', '纬度'],
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xData,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#ddd' } }
    },
    yAxis: [
      {
        type: 'value',
        name: '经度',
        axisLine: { lineStyle: { color: '#409EFF' } },
        splitLine: { lineStyle: { color: '#eee' } }
      },
      {
        type: 'value',
        name: '纬度',
        axisLine: { lineStyle: { color: '#67C23A' } },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '经度',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: longitudeData,
        lineStyle: {
          width: 3,
          color: '#409EFF'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64,158,255,0.3)' },
            { offset: 1, color: 'rgba(64,158,255,0.1)' }
          ])
        }
      },
      {
        name: '纬度',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: latitudeData,
        lineStyle: {
          width: 3,
          color: '#67C23A'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103,194,58,0.3)' },
            { offset: 1, color: 'rgba(103,194,58,0.1)' }
          ])
        }
      }
    ]
  }

  chart.setOption(option)
}

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  queryData()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  queryData()
}

// 监听窗口大小变化
window.addEventListener('resize', () => {
  chart?.resize()
})

onMounted(() => {
  initChart()
})

// 在 script setup 部分添加以下数据生成函数
const generateGnssData = (type) => {
  const now = new Date()
  let data = []
  let xData = []
  
  switch(type) {
    case 'hour':
      // 生成24小时的数据
      for(let i = 0; i < 24; i++) {
        xData.push(`${i.toString().padStart(2, '0')}:00`)
        // 模拟经度数据: 基准值 + 随机偏移
        const longitude = 120.5 + (Math.random() - 0.5) * 0.1
        // 模拟纬度数据: 基准值 + 随机偏移
        const latitude = 30.3 + (Math.random() - 0.5) * 0.1
        data.push([longitude, latitude])
      }
      break
    case 'day':
      // 生成最近7天的数据
      for(let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        xData.push(date.toLocaleDateString())
        const longitude = 120.5 + (Math.random() - 0.5) * 0.2
        const latitude = 30.3 + (Math.random() - 0.5) * 0.2
        data.push([longitude, latitude])
      }
      break
    case 'month':
      // 生成最近30天的数据
      for(let i = 29; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        xData.push(date.toLocaleDateString())
        const longitude = 120.5 + (Math.random() - 0.5) * 0.3
        const latitude = 30.3 + (Math.random() - 0.5) * 0.3
        data.push([longitude, latitude])
      }
      break
  }
  
  return { xData, data }
}

// 添加对 chartType 的监听
watch(chartType, () => {
  initChart()
})
</script>

<style scoped>
.device-data-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  margin: 0 0 16px 0;
  font-weight: 500;
  color: #1f2f3d;
}

.content-container {
  flex: 1;
  display: flex;
  gap: 24px;
  min-height: 0;
}

.chart-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}

.chart-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-header .title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
}

.chart {
  flex: 1;
  min-height: 0;
}

.table-section {
  width: 45%;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-header .title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
}

.data-stats {
  margin-top: auto;
}

.stat-card {
  padding: 16px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon :deep(svg) {
  width: 24px;
  height: 24px;
  color: white;
}

.stat-icon.normal {
  background: linear-gradient(135deg, #67C23A 0%, #95D475 100%);
}

.stat-icon.warning {
  background: linear-gradient(135deg, #E6A23C 0%, #F3D19E 100%);
}

.stat-icon.primary {
  background: linear-gradient(135deg, #409EFF 0%, #36cfc9 100%);
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style> 