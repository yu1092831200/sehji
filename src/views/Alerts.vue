<template>
  <div class="alerts-container tech-container">
    <div class="tech-header">
      <h2>预警信息</h2>
      <div class="filter-section tech-filter">
        <el-select v-model="alertLevel" placeholder="预警等级" style="width: 150px">
          <el-option label="全部" value="" />
          <el-option label="一级预警" value="high">
            <template #default="{ option }">
              <el-tag type="danger" size="small" effect="dark">一级预警</el-tag>
            </template>
          </el-option>
          <el-option label="二级预警" value="medium">
            <template #default="{ option }">
              <el-tag type="warning" size="small" effect="dark">二级预警</el-tag>
            </template>
          </el-option>
          <el-option label="三级预警" value="low">
            <template #default="{ option }">
              <el-tag type="info" size="small" effect="dark">三级预警</el-tag>
            </template>
          </el-option>
        </el-select>
        <el-select v-model="alertStatus" placeholder="处理状态" style="width: 150px">
          <el-option label="全部" value="" />
          <el-option label="未处理" value="pending">
            <el-tag type="danger" size="small">未处理</el-tag>
          </el-option>
          <el-option label="处理中" value="processing">
            <el-tag type="warning" size="small">处理中</el-tag>
          </el-option>
          <el-option label="已处理" value="resolved">
            <el-tag type="success" size="small">已处理</el-tag>
          </el-option>
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :shortcuts="dateShortcuts"
        />
        <el-button type="primary" class="tech-button" @click="handleSearch">
          <el-icon><Search /></el-icon>查询
        </el-button>
      </div>
    </div>

    <!-- 预警统计卡片 -->
    <div class="alert-stats">
      <el-row :gutter="20">
        <el-col :span="6" v-for="stat in alertStats" :key="stat.title">
          <el-card class="stat-card tech-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon" :class="stat.type">
                <el-icon><component :is="stat.icon" /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">{{ stat.title }}</div>
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-trend" :class="{ up: stat.trend > 0, down: stat.trend < 0 }">
                  {{ Math.abs(stat.trend) }}% 较昨日
                  <el-icon><component :is="stat.trend > 0 ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 预警列表 -->
    <el-card class="alert-table tech-card">
      <template #header>
        <div class="table-header">
          <div class="title">
            <el-icon><Warning /></el-icon>
            预警列表
          </div>
          <div class="actions">
            <el-button-group>
              <el-button size="small" @click="exportAlerts">
                <el-icon><Download /></el-icon>导出
              </el-button>
              <el-button size="small" @click="refreshAlerts">
                <el-icon><RefreshRight /></el-icon>刷新
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <el-table 
        :data="alerts" 
        style="width: 100%" 
        border 
        class="tech-table"
        :header-cell-style="{
          background: '#f5f7fa',
          color: '#606266',
          fontWeight: 'bold'
        }"
      >
        <el-table-column prop="time" label="预警时间" width="180" sortable />
        <el-table-column prop="device" label="设备名称" width="150" />
        <el-table-column prop="type" label="预警类型" width="120" />
        <el-table-column prop="level" label="预警等级" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="getAlertLevelType(row.level)" 
              effect="dark"
              class="alert-level-tag"
            >
              {{ getAlertLevelText(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="处理状态" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="getStatusType(row.status)"
              class="status-tag"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="预警描述" show-overflow-tooltip />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button 
                size="small" 
                type="primary" 
                :disabled="row.status === 'resolved'"
                @click="handleProcess(row)"
              >
                <el-icon><SetUp /></el-icon>处理
              </el-button>
              <el-button size="small" @click="handleDetail(row)">
                <el-icon><View /></el-icon>详情
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
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

    <!-- 处理预警对话框 -->
    <el-dialog 
      v-model="processDialogVisible" 
      title="处理预警" 
      width="600px"
      class="tech-dialog"
      destroy-on-close
    >
      <div class="alert-info" v-if="currentAlert">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备名称">{{ currentAlert.device }}</el-descriptions-item>
          <el-descriptions-item label="预警时间">{{ currentAlert.time }}</el-descriptions-item>
          <el-descriptions-item label="预警类型">{{ currentAlert.type }}</el-descriptions-item>
          <el-descriptions-item label="预警等级">
            <el-tag :type="getAlertLevelType(currentAlert.level)" effect="dark">
              {{ getAlertLevelText(currentAlert.level) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <el-form :model="processForm" label-width="100px" class="tech-form">
        <el-form-item label="处理方式" required>
          <el-select v-model="processForm.method" style="width: 100%">
            <el-option label="远程处理" value="remote">
              <el-icon><Connection /></el-icon>
              <span style="margin-left: 8px">远程处理</span>
            </el-option>
            <el-option label="现场处理" value="onsite">
              <el-icon><Position /></el-icon>
              <span style="margin-left: 8px">现场处理</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="处理说明" required>
          <el-input
            v-model="processForm.description"
            type="textarea"
            rows="4"
            placeholder="请输入处理说明"
          />
        </el-form-item>
        <el-form-item label="处理结果">
          <el-radio-group v-model="processForm.result">
            <el-radio label="resolved">已解决</el-radio>
            <el-radio label="pending">待观察</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="附件">
          <el-upload
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            multiple
          >
            <template #trigger>
              <el-button type="primary">选择文件</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">
                支持jpg/png/pdf文件，单个不超过5MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="processDialogVisible = false">取消</el-button>
        <el-button type="primary" class="tech-button" @click="submitProcess">确定</el-button>
      </template>
    </el-dialog>

    <!-- 预警详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="预警详情"
      width="800px"
      class="tech-dialog"
    >
      <div v-if="currentAlert" class="alert-detail">
        <el-tabs v-model="detailActiveTab">
          <el-tab-pane label="基本信息" name="basic">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="设备名称" :span="2">
                {{ currentAlert.device }}
              </el-descriptions-item>
              <el-descriptions-item label="预警时间">
                {{ currentAlert.time }}
              </el-descriptions-item>
              <el-descriptions-item label="预警类型">
                {{ currentAlert.type }}
              </el-descriptions-item>
              <el-descriptions-item label="预警等级">
                <el-tag :type="getAlertLevelType(currentAlert.level)" effect="dark">
                  {{ getAlertLevelText(currentAlert.level) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="处理状态">
                <el-tag :type="getStatusType(currentAlert.status)">
                  {{ getStatusText(currentAlert.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="预警描述" :span="2">
                {{ currentAlert.description }}
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          
          <el-tab-pane label="处理记录" name="process">
            <el-timeline>
              <el-timeline-item
                v-for="(record, index) in processRecords"
                :key="index"
                :type="record.type"
                :timestamp="record.time"
                :hollow="record.type === 'primary'"
              >
                <h4>{{ record.title }}</h4>
                <p>{{ record.content }}</p>
              </el-timeline-item>
            </el-timeline>
          </el-tab-pane>

          <el-tab-pane label="相关数据" name="data">
            <div class="detail-chart" ref="detailChartRef"></div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

// 查询条件
const alertLevel = ref('')
const alertStatus = ref('')
const dateRange = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

// 预警列表数据
const alerts = ref([
  {
    time: '2024-03-20 10:00:00',
    device: '设备1',
    type: '位移异常',
    level: 'high',
    status: 'pending',
    description: '设备位移超过预警阈值'
  },
  {
    time: '2024-03-20 09:30:00',
    device: '设备2',
    type: '倾角异常',
    level: 'medium',
    status: 'processing',
    description: '设备倾角变化异常'
  },
  {
    time: '2024-03-20 09:00:00',
    device: '设备3',
    type: '应力异常',
    level: 'low',
    status: 'resolved',
    description: '设备应力超出正常范围'
  }
])

// 处理预警相关
const processDialogVisible = ref(false)
const processForm = ref({
  method: '',
  description: ''
})
const currentAlert = ref(null)

// 获取预警等级样式
const getAlertLevelType = (level) => {
  const types = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return types[level]
}

const getAlertLevelText = (level) => {
  const texts = {
    high: '一级预警',
    medium: '二级预警',
    low: '三级预警'
  }
  return texts[level]
}

// 获取状态样式
const getStatusType = (status) => {
  const types = {
    pending: 'danger',
    processing: 'warning',
    resolved: 'success'
  }
  return types[status]
}

const getStatusText = (status) => {
  const texts = {
    pending: '未处理',
    processing: '处理中',
    resolved: '已处理'
  }
  return texts[status]
}

// 查询
const handleSearch = () => {
  console.log('查询条件:', {
    level: alertLevel.value,
    status: alertStatus.value,
    dateRange: dateRange.value
  })
}

// 处理预警
const handleProcess = (row) => {
  currentAlert.value = row
  processForm.value = {
    method: '',
    description: ''
  }
  processDialogVisible.value = true
}

// 查看详情
const handleDetail = (row) => {
  console.log('查看详情:', row)
}

// 提交处理
const submitProcess = () => {
  if (!processForm.value.method || !processForm.value.description) {
    ElMessage.warning('请填写完整的处理信息')
    return
  }
  
  // 这里添加实际的处理逻辑
  console.log('处理预警:', {
    alert: currentAlert.value,
    process: processForm.value
  })
  
  processDialogVisible.value = false
  ElMessage.success('处理成功')
}

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  // 重新加载数据
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  // 重新加载数据
}

// 添加预警统计数据
const alertStats = ref([
  {
    title: '今日预警',
    value: '12',
    trend: 20,
    type: 'warning',
    icon: 'Warning'
  },
  {
    title: '待处理',
    value: '5',
    trend: -15,
    type: 'danger',
    icon: 'Bell'
  },
  {
    title: '处理中',
    value: '3',
    trend: 0,
    type: 'primary',
    icon: 'Loading'
  },
  {
    title: '已处理',
    value: '4',
    trend: 33.3,
    type: 'success',
    icon: 'CircleCheck'
  }
])

// 添加处理记录数据
const processRecords = ref([
  {
    time: '2024-03-20 10:30:00',
    type: 'warning',
    title: '系统自动预警',
    content: '检测到设备数据异常，触发预警'
  },
  {
    time: '2024-03-20 10:35:00',
    type: 'primary',
    title: '开始处理',
    content: '工程师开始远程诊断'
  },
  {
    time: '2024-03-20 11:00:00',
    type: 'success',
    title: '处理完成',
    content: '完成设备参数调整，恢复正常'
  }
])

// 添加文件上传处理
const handleFileChange = (file) => {
  console.log('选择文件:', file)
}

// 添加导出功能
const exportAlerts = () => {
  ElMessage.success('开始导出预警数据')
}

// 添加刷新功能
const refreshAlerts = () => {
  // 这里添加刷新数据的逻辑
  ElMessage.success('数据已更新')
}

// 日期快捷选项
const dateShortcuts = [
  {
    text: '最近一天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24)
      return [start, end]
    }
  },
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
  }
]
</script>

<style scoped>
.alerts-container {
  height: 100%;
  overflow-y: auto;
}

.alert-stats {
  margin-bottom: 24px;
}

.stat-card {
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
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

.stat-icon.warning { background: linear-gradient(135deg, #E6A23C 0%, #F3D19E 100%); }
.stat-icon.danger { background: linear-gradient(135deg, #F56C6C 0%, #FAB6B6 100%); }
.stat-icon.primary { background: linear-gradient(135deg, #409EFF 0%, #A0CFFF 100%); }
.stat-icon.success { background: linear-gradient(135deg, #67C23A 0%, #95D475 100%); }

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
  margin-bottom: 4px;
}

.stat-trend {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-trend.up { color: #67C23A; }
.stat-trend.down { color: #F56C6C; }

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

.alert-level-tag,
.status-tag {
  min-width: 65px;
  text-align: center;
}

.alert-info {
  margin-bottom: 20px;
}

.detail-chart {
  height: 300px;
  margin: 20px 0;
}

:deep(.el-descriptions) {
  margin-bottom: 20px;
}

:deep(.el-timeline-item__content h4) {
  margin: 0;
  font-size: 14px;
  color: #303133;
}

:deep(.el-timeline-item__content p) {
  margin: 4px 0 0;
  font-size: 13px;
  color: #606266;
}

.upload-demo {
  margin-top: 8px;
}
</style> 