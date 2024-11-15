<template>
  <div class="data-analysis-container tech-container">
    <div class="tech-header">
      <h2>数据分析</h2>
      <div class="filter-section tech-filter">
        <el-select v-model="selectedType" placeholder="分析类型" style="width: 200px">
          <el-option label="位移趋势分析" value="displacement" />
          <el-option label="倾角变化分析" value="tilt" />
          <el-option label="应力分布分析" value="stress" />
        </el-select>
        <el-select v-model="selectedDevice" placeholder="选择设备" style="width: 200px">
          <el-option
            v-for="device in devices"
            :key="device.id"
            :label="device.name"
            :value="device.id"
          />
        </el-select>
        <el-date-picker
          v-model="analysisDate"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :shortcuts="dateShortcuts"
        />
        <el-button type="primary" class="tech-button" @click="generateAnalysis">
          <el-icon><DataAnalysis /></el-icon>生成分析
        </el-button>
      </div>
    </div>

    <div class="analysis-content">
      <!-- 分析概览卡片 -->
      <div class="overview-cards">
        <el-row :gutter="20">
          <el-col :span="6" v-for="stat in analysisStats" :key="stat.title">
            <el-card class="stat-card tech-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-icon" :class="stat.type">
                  <el-icon><component :is="stat.icon" /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-label">{{ stat.title }}</div>
                  <div class="stat-value">{{ stat.value }}</div>
                  <div class="stat-trend" :class="{ up: stat.trend > 0, down: stat.trend < 0 }">
                    {{ Math.abs(stat.trend) }}% 较上期
                    <el-icon><component :is="stat.trend > 0 ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 分析图表 -->
      <div class="analysis-charts">
        <el-row :gutter="24">
          <el-col :span="16">
            <el-card class="chart-card tech-card">
              <template #header>
                <div class="chart-header">
                  <span class="title">
                    <el-icon><TrendCharts /></el-icon>
                    趋势分析
                  </span>
                  <div class="chart-tools">
                    <el-radio-group v-model="chartTimeRange" size="small">
                      <el-radio-button label="day">日</el-radio-button>
                      <el-radio-button label="week">周</el-radio-button>
                      <el-radio-button label="month">月</el-radio-button>
                    </el-radio-group>
                    <el-button-group class="ml-2">
                      <el-button size="small" @click="exportChart">
                        <el-icon><Download /></el-icon>
                      </el-button>
                      <el-button size="small" @click="refreshChart">
                        <el-icon><RefreshRight /></el-icon>
                      </el-button>
                    </el-button-group>
                  </div>
                </div>
              </template>
              <div class="chart trend-chart" ref="trendChartRef"></div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="chart-card tech-card">
              <template #header>
                <div class="chart-header">
                  <span class="title">
                    <el-icon><PieChart /></el-icon>
                    数据分布
                  </span>
                </div>
              </template>
              <div class="chart distribution-chart" ref="distributionChartRef"></div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 异常分析 -->
      <el-card class="anomaly-card tech-card">
        <template #header>
          <div class="card-header">
            <span class="title">
              <el-icon><Warning /></el-icon>
              异常分析
            </span>
            <el-button-group>
              <el-button size="small" type="primary" @click="exportAnomaly">
                导出报告
              </el-button>
            </el-button-group>
          </div>
        </template>
        <el-table :data="anomalyList" border style="width: 100%">
          <el-table-column prop="time" label="时间" width="180" />
          <el-table-column prop="type" label="异常类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getAnomalyType(row.level)">{{ row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="value" label="异常值" width="120" />
          <el-table-column prop="threshold" label="阈值" width="120" />
          <el-table-column prop="duration" label="持续时间" width="120" />
          <el-table-column prop="description" label="描述" />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="showAnomalyDetail(row)">
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 分析结论 -->
      <el-card class="conclusion-card tech-card">
        <template #header>
          <div class="card-header">
            <span class="title">
              <el-icon><Document /></el-icon>
              分析结论
            </span>
          </div>
        </template>
        <div class="conclusion-content">
          <el-timeline>
            <el-timeline-item
              v-for="(conclusion, index) in conclusions"
              :key="index"
              :type="conclusion.type"
              :color="getTimelineColor(conclusion.type)"
              :timestamp="conclusion.time"
              :hollow="conclusion.type === 'primary'"
            >
              <div class="conclusion-item">
                <h4 :class="conclusion.type">{{ conclusion.title }}</h4>
                <p>{{ conclusion.content }}</p>
                <div class="conclusion-tags" v-if="conclusion.tags">
                  <el-tag
                    v-for="tag in conclusion.tags"
                    :key="tag"
                    size="small"
                    :type="conclusion.type"
                    effect="plain"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </el-card>
    </div>

    <!-- 异常详情对话框 -->
    <el-dialog
      v-model="anomalyDetailVisible"
      title="异常详情"
      width="600px"
      class="tech-dialog"
    >
      <div v-if="selectedAnomaly" class="anomaly-detail">
        <div class="detail-chart" ref="detailChartRef"></div>
        <div class="detail-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="异常类型">
              <el-tag :type="getAnomalyType(selectedAnomaly.level)">
                {{ selectedAnomaly.type }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="发生时间">
              {{ selectedAnomaly.time }}
            </el-descriptions-item>
            <el-descriptions-item label="异常值">
              {{ selectedAnomaly.value }}
            </el-descriptions-item>
            <el-descriptions-item label="阈值">
              {{ selectedAnomaly.threshold }}
            </el-descriptions-item>
            <el-descriptions-item label="持续时间">
              {{ selectedAnomaly.duration }}
            </el-descriptions-item>
            <el-descriptions-item label="影响程度">
              <el-rate
                v-model="selectedAnomaly.impact"
                disabled
                show-score
                text-color="#ff9900"
              />
            </el-descriptions-item>
          </el-descriptions>
          <div class="detail-description">
            <h4>异常描述</h4>
            <p>{{ selectedAnomaly.description }}</p>
          </div>
          <div class="detail-suggestion">
            <h4>处理建议</h4>
            <ul>
              <li v-for="(suggestion, index) in selectedAnomaly.suggestions" :key="index">
                {{ suggestion }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 在图表下方添加数据列表 -->
    <el-card class="data-list-card tech-card">
      <template #header>
        <div class="card-header">
          <span class="title">
            <el-icon><List /></el-icon>
            监测数据列表
          </span>
          <div class="header-tools">
            <el-button-group>
              <el-button size="small" @click="refreshData">
                <el-icon><RefreshRight /></el-icon>刷新
              </el-button>
              <el-button size="small" type="primary" @click="exportData">
                <el-icon><Download /></el-icon>导出
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <el-table
        :data="monitoringData"
        border
        stripe
        style="width: 100%"
        height="400"
        :header-cell-style="{ background: '#f5f7fa' }"
      >
        <template v-for="col in currentColumns" :key="col.prop">
          <el-table-column
            :prop="col.prop"
            :label="col.label"
            :width="col.width"
            align="center"
          >
            <template #default="{ row }" v-if="col.formatter">
              <span :class="getValueClass(row[col.prop], col.thresholds)">
                {{ col.formatter(row[col.prop]) }}
              </span>
            </template>
          </el-table-column>
        </template>
        
        <template #empty>
          <el-empty description="暂无数据" />
        </template>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { 
  DataAnalysis,
  TrendCharts,
  PieChart,
  Warning,
  Document,
  Download,
  RefreshRight,
  ArrowUp,
  ArrowDown,
  List
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 首先定义常量
const DEVICE_TYPES = {
  GNSS: 'gnss',
  STRESS: 'stress',
  CRACK: 'crack',
  TILT: 'tilt',
  SETTLEMENT: 'settlement'
}

// 然后再使用这个常量
const selectedType = ref(DEVICE_TYPES.GNSS)


const analysisDate = ref([new Date(), new Date()])
const trendChartRef = ref(null)
const distributionChartRef = ref(null)
let trendChart = null
let distributionChart = null



// 添加分析统计数据
const analysisStats = ref([
  {
    title: '数据采集率',
    value: '98.5%',
    trend: 2.1,
    type: 'success',
    icon: 'DataLine'
  },
  {
    title: '异常数据率',
    value: '2.3%',
    trend: -1.5,
    type: 'warning',
    icon: 'Warning'
  },
  {
    title: '预警触发次数',
    value: '5',
    trend: -3.2,
    type: 'danger',
    icon: 'Bell'
  },
  {
    title: '数据总量',
    value: '12,456',
    trend: 15.8,
    type: 'primary',
    icon: 'DataAnalysis'
  }
])

// 添加分析结论数据
const conclusions = ref([
  {
    type: 'success',
    time: '2024-03-20 10:00',
    title: '整体状态稳定',
    content: '监测点位整体稳定，各项指标在正常范围内波动。',
    tags: ['稳定运行', '正常监测']
  },
  {
    type: 'warning',
    time: '2024-03-20 09:30',
    title: '局部异常波动',
    content: '监测点A-3出现轻微位移异常，建议加强监测。',
    tags: ['位移监测', '需要关注']
  },
  {
    type: 'danger',
    time: '2024-03-20 09:00',
    title: '预警信息',
    content: '监测点B-2倾角变化超出阈值，已触发预警。',
    tags: ['倾角异常', '立即处理']
  }
])

// 添加异常数据列表
const anomalyList = ref([
  {
    time: '2024-03-20 10:00',
    type: '位移异常',
    level: 'warning',
    value: '25mm',
    threshold: '20mm',
    duration: '30分钟',
    description: '位移超出预警阈值',
    suggestions: [
      '检查传感器安装状态',
      '核实数据采集精度',
      '增加采样频率'
    ],
    impact: 3
  },
  // ... 更多异常数据
])

const getTimelineColor = (type) => {
  const colors = {
    success: '#67C23A',
    warning: '#E6A23C',
    danger: '#F56C6C'
  }
  return colors[type]
}

// 修改趋势图初始化函数
const initTrendChart = () => {
  if (!trendChartRef.value) return
  
  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value)
  }

  const option = {
    backgroundColor: '#ffffff',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: '#409EFF',
          width: 2
        }
      },
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#eee',
      borderWidth: 1,
      padding: [10, 15],
      textStyle: {
        color: '#666'
      },
      extraCssText: 'box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);'
    },
    legend: {
      data: ['实测值', '预警值', '安全范围'],
      icon: 'roundRect',
      textStyle: {
        color: '#666'
      },
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 25
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#666',
        fontSize: 12,
        margin: 12
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#666',
        fontSize: 12,
        margin: 12
      },
      splitLine: {
        lineStyle: {
          color: '#eee',
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: '总位移',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        showSymbol: false,
        lineStyle: {
          width: 3,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#409EFF' },
            { offset: 1, color: '#36cfc9' }
          ])
        },
        itemStyle: {
          color: '#409EFF',
          borderWidth: 2,
          borderColor: '#fff'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64,158,255,0.35)' },
            { offset: 1, color: 'rgba(54,207,201,0.1)' }
          ])
        },
        emphasis: {
          scale: true,
          focus: 'series'
        },
        data: generateTrendData()
      },
      {
        name: '预警值',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: {
          width: 2,
          type: 'dashed',
          color: '#E6A23C'
        },
        data: Array(24).fill(25)
      },
      {
        name: '报警值',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: {
          width: 2,
          type: 'dashed',
          color: '#F56C6C'
        },
        data: Array(24).fill(30)
      }
    ]
  }

  trendChart.setOption(option)
}

// 修改分布图初始化函数
const initDistributionChart = () => {
  if (!distributionChartRef.value) return
  
  if (!distributionChart) {
    distributionChart = echarts.init(distributionChartRef.value)
  }

  const option = {
    backgroundColor: '#ffffff',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#eee',
      borderWidth: 1,
      padding: [10, 15],
      textStyle: {
        color: '#666'
      },
      formatter: '{b}: {c} ({d}%)',
      extraCssText: 'box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      padding: 20,
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 15,
      textStyle: {
        color: '#666',
        fontSize: 12
      }
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { 
            value: Math.floor(Math.random() * 300 + 600), 
            name: '正常数据',
            itemStyle: { 
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#67C23A' },
                { offset: 1, color: '#95D475' }
              ])
            }
          },
          { 
            value: Math.floor(Math.random() * 100 + 100), 
            name: '轻微异常',
            itemStyle: { 
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#E6A23C' },
                { offset: 1, color: '#F3D19E' }
              ])
            }
          },
          { 
            value: Math.floor(Math.random() * 50 + 50), 
            name: '严重异常',
            itemStyle: { 
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#F56C6C' },
                { offset: 1, color: '#FAB6B6' }
              ])
            }
          }
        ]
      }
    ]
  }

  distributionChart.setOption(option)
}

const generateAnalysis = () => {
  // 这里添加实际的分析生成逻辑
  console.log('生成分析:', {
    type: selectedType.value,
    date: analysisDate.value
  })
  initTrendChart()
  initDistributionChart()
}

// 监听窗口大小变化
window.addEventListener('resize', () => {
  trendChart?.resize()
  distributionChart?.resize()
})

onMounted(() => {
  // 生成统计数据
  generateStats()
  
  // 生成并显示图表
  initTrendChart()
  initDistributionChart()
  
  // 生成并显示数据列表
  refreshData()
  
  // 设置定时刷新
  const timer = setInterval(() => {
    refreshData()
    generateStats()
    initTrendChart()
    initDistributionChart()
  }, 60000) // 每分钟刷新一次
  
  // 组件卸载时清除定时器
  onUnmounted(() => {
    clearInterval(timer)
  })
})

// 添加图表导出功能
const exportChart = () => {
  const canvas = document.createElement('canvas')
  canvas.width = trendChartRef.value.clientWidth
  canvas.height = trendChartRef.value.clientHeight
  
  const dataURL = trendChart.getDataURL({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: '#fff'
  })
  
  const link = document.createElement('a')
  link.download = '趋势分析图.png'
  link.href = dataURL
  link.click()
}

// 添加异常报告导出功能
const exportAnomaly = () => {
  // 这里可以添加导出PDF或Excel的逻辑
  ElMessage.success('报告导出成功')
}

// 添加图表刷新功能
const refreshChart = () => {
  initTrendChart()
  initDistributionChart()
  ElMessage.success('数据已更新')
}

// 添加异常详情查看功能
const showAnomalyDetail = (anomaly) => {
  selectedAnomaly.value = anomaly
  anomalyDetailVisible.value = true
  
  // 初始化详情图表
  nextTick(() => {
    initDetailChart()
  })
}

// 初始化异常详情图表
const initDetailChart = () => {
  if (!detailChartRef.value) return
  
  const detailChart = echarts.init(detailChartRef.value)
  
  const option = {
    // ... 详情图表配置
  }
  
  detailChart.setOption(option)
}

// 日期快捷选项
const dateShortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    }
  },
  {
    text: '最近一月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    }
  },
  {
    text: '最近三月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return [start, end]
    }
  }
]

// 添加设备类型和数据映射的常量
// const DEVICE_TYPES = {
//   GNSS: 'gnss',
//   STRESS: 'stress',
//   CRACK: 'crack',
//   TILT: 'tilt',
//   SETTLEMENT: 'settlement'
// }

// 添加设备类型对应的数据列定义
const COLUMNS_MAP = {
  [DEVICE_TYPES.GNSS]: [
    { 
      prop: 'time', 
      label: '采集时间', 
      width: '180'
    },
    { 
      prop: 'x_cumulative', 
      label: 'X方向累计位移(mm)', 
      width: '160',
      formatter: (value) => `${value}`,
      thresholds: { warning: 15, danger: 25 }
    },
    { 
      prop: 'y_cumulative', 
      label: 'Y方向累计位移(mm)', 
      width: '160',
      formatter: (value) => `${value}`,
      thresholds: { warning: 20, danger: 30 }
    },
    { 
      prop: 'z_cumulative', 
      label: 'Z方向累计位移(mm)', 
      width: '160',
      formatter: (value) => `${value}`,
      thresholds: { warning: 10, danger: 15 }
    },
    { 
      prop: 'x_diff', 
      label: 'X方向差值(mm)', 
      width: '140',
      formatter: (value) => {
        const num = parseFloat(value)
        return `${num >= 0 ? '+' : ''}${value}`
      },
      thresholds: { warning: 0.3, danger: 0.5 }
    },
    { 
      prop: 'y_diff', 
      label: 'Y方向差值(mm)', 
      width: '140',
      formatter: (value) => {
        const num = parseFloat(value)
        return `${num >= 0 ? '+' : ''}${value}`
      },
      thresholds: { warning: 0.3, danger: 0.5 }
    },
    { 
      prop: 'z_diff', 
      label: 'Z方向差值(mm)', 
      width: '140',
      formatter: (value) => {
        const num = parseFloat(value)
        return `${num >= 0 ? '+' : ''}${value}`
      },
      thresholds: { warning: 0.2, danger: 0.4 }
    },
    { 
      prop: 'total_displacement', 
      label: '总位移(mm)', 
      width: '140',
      formatter: (value) => `${value}`,
      thresholds: { warning: 20, danger: 30 }
    },
    {
      prop: 'status',
      label: '状态',
      width: '100',
      formatter: (value) => {
        const statusMap = {
          normal: '正常',
          warning: '预警',
          danger: '报警'
        }
        return statusMap[value] || value
      }
    }
  ],
  [DEVICE_TYPES.STRESS]: [
    { prop: 'time', label: '采集时间', width: '180' },
    { prop: 'stress_value', label: '应力值(kPa)', width: '140' },
    { prop: 'stress_diff', label: '应力变化(kPa)', width: '140' },
    { prop: 'temperature', label: '温度(℃)', width: '120' }
  ],
  [DEVICE_TYPES.CRACK]: [
    { prop: 'time', label: '采集时间', width: '180' },
    { prop: 'width', label: '裂缝宽度(mm)', width: '140' },
    { prop: 'width_diff', label: '宽度变化(mm)', width: '140' },
    { prop: 'temperature', label: '温度(℃)', width: '120' }
  ],
  [DEVICE_TYPES.TILT]: [
    { prop: 'time', label: '采集时间', width: '180' },
    { prop: 'x_angle', label: 'X方向倾角(°)', width: '140' },
    { prop: 'y_angle', label: 'Y方向倾角(°)', width: '140' },
    { prop: 'x_diff', label: 'X方向变化(°)', width: '140' },
    { prop: 'y_diff', label: 'Y方向变化(°)', width: '140' }
  ],
  [DEVICE_TYPES.SETTLEMENT]: [
    { prop: 'time', label: '采集时间', width: '180' },
    { prop: 'settlement', label: '沉降量(mm)', width: '140' },
    { prop: 'settlement_diff', label: '沉降变化(mm)', width: '140' },
    { prop: 'settlement_rate', label: '沉降速率(mm/d)', width: '140' }
  ]
}

// 添加 GNSS 数据生成相关的辅助函数
const generateGNSSData = (baseTime, index) => {
  // 基准值设定 - 添加周期性变化
  const time = new Date(baseTime - index * 3600 * 1000)
  const hour = time.getHours()
  const dayTrend = Math.sin(hour / 24 * Math.PI * 2) * 2 // 添加日变化

  const baseValues = {
    x: 10 + dayTrend,
    y: 15 + dayTrend,
    z: 5 + dayTrend
  }
  
  // 添加随机波动和趋势
  const trend = index * 0.05 // 减小趋势变化幅度
  const noise = (amplitude = 1) => (Math.random() - 0.5) * amplitude
  
  // 生成累计位移
  const x_cumulative = (baseValues.x + trend + noise(1)).toFixed(2)
  const y_cumulative = (baseValues.y + trend + noise(1)).toFixed(2)
  const z_cumulative = (baseValues.z + trend + noise(0.5)).toFixed(2)
  
  // 计算差值
  const x_diff = (noise(0.2)).toFixed(2)
  const y_diff = (noise(0.2)).toFixed(2)
  const z_diff = (noise(0.1)).toFixed(2)
  
  // 计算总位移
  const total_displacement = (Math.sqrt(
    Math.pow(parseFloat(x_cumulative), 2) +
    Math.pow(parseFloat(y_cumulative), 2) +
    Math.pow(parseFloat(z_cumulative), 2)
  )).toFixed(2)
  
  // 状态判断
  const status = total_displacement > 30 ? 'danger' :
                 total_displacement > 25 ? 'warning' : 'normal'
  
  return {
    time: time.toLocaleString(),
    x_cumulative,
    y_cumulative,
    z_cumulative,
    x_diff,
    y_diff,
    z_diff,
    total_displacement,
    status
  }
}

// 修改 generateMockData 函数中的 GNSS 数据生成部分
const generateMockData = (type) => {
  const now = new Date()
  const data = []
  
  switch (type) {
    case DEVICE_TYPES.GNSS:
      for (let i = 0; i < pageSize.value; i++) {
        data.push(generateGNSSData(now, i))
      }
      break
    // ... 其他设备类型的数据生成保持不变
  }
  
  return data
}

// 添加数据列表相关的响应式数据
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const monitoringData = ref([])
const currentColumns = computed(() => COLUMNS_MAP[selectedType.value] || [])

// 添加数据处理方法
const refreshData = () => {
  const data = []
  const now = new Date()
  
  // 生成一页数据
  for (let i = 0; i < pageSize.value; i++) {
    data.push(generateGNSSData(now, i))
  }
  
  monitoringData.value = data
  total.value = 100 // 假设总共有100条数据
}

const exportData = () => {
  // 实现数据导出逻辑
  ElMessage.success('数据导出成功')
}

const handleSizeChange = (val) => {
  pageSize.value = val
  refreshData()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  refreshData()
}

// 修改值的样式判断函数
const getValueClass = (value, thresholds) => {
  if (!thresholds) return ''
  const num = parseFloat(value)
  if (num > thresholds.danger) return 'danger-value'
  if (num > thresholds.warning) return 'warning-value'
  return 'normal-value'
}

// 监听设备类型变化
watch(selectedType, () => {
  refreshData()
})

// 初始化数据
onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.data-analysis-container {
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}

.tech-header {
  margin-bottom: 24px;
}

.tech-header h2 {
  margin: 0 0 16px 0;
  font-weight: 500;
  color: #1f2f3d;
}

.tech-filter {
  display: flex;
  gap: 16px;
  align-items: center;
}

.overview-cards {
  margin-bottom: 24px;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 16px;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-weight: 500;
  color: #1f2f3d;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #606266;
  margin-top: 8px;
}

.stat-trend {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}

.stat-trend.up {
  color: #67C23A;
}

.stat-trend.down {
  color: #F56C6C;
}

.analysis-charts {
  margin-bottom: 24px;
}

.chart-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.chart {
  height: 400px;
  padding: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.chart-header .title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.chart-tools {
  display: flex;
  gap: 12px;
}

.analysis-conclusion {
  margin-bottom: 24px;
}

.conclusion-content {
  padding: 20px;
}

.detail-chart {
  height: 300px;
  margin-bottom: 20px;
}

.detail-info {
  padding: 20px;
}

.detail-description {
  margin-top: 20px;
}

.detail-description h4,
.detail-suggestion h4 {
  margin-bottom: 10px;
  color: #303133;
  font-weight: 500;
}

.detail-suggestion {
  margin-top: 20px;
}

.detail-suggestion ul {
  padding-left: 20px;
  color: #606266;
}

.detail-suggestion li {
  margin-bottom: 8px;
}

.conclusion-item h4 {
  margin: 0 0 8px 0;
  font-weight: 500;
}

.conclusion-item h4.success { color: #67C23A; }
.conclusion-item h4.warning { color: #E6A23C; }
.conclusion-item h4.danger { color: #F56C6C; }

.conclusion-tags {
  margin-top: 8px;
}

.conclusion-tags .el-tag {
  margin-right: 8px;
}

.ml-2 {
  margin-left: 8px;
}

/* 添加数据列表相关样式 */
.data-list-card {
  margin-top: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-tools {
  display: flex;
  gap: 12px;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.danger-value {
  color: #F56C6C;
  font-weight: bold;
}

.warning-value {
  color: #E6A23C;
  font-weight: bold;
}

.normal-value {
  color: #67C23A;
}

:deep(.el-table) {
  margin-top: 16px;
}

:deep(.el-table__header) {
  font-weight: 600;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa !important;
}
</style> 