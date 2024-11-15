<template>
  <div class="devices-container tech-container">
    <div class="tech-header">
      <h2>设备管理</h2>
      <el-button type="primary" class="tech-button" @click="handleAdd">
        <el-icon><Plus /></el-icon>添加设备
      </el-button>
    </div>

    <!-- 设备统计卡片 -->
    <div class="device-stats">
      <el-row :gutter="20">
        <el-col :span="6" v-for="stat in deviceStats" :key="stat.title">
          <el-card class="stat-card tech-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon" :class="stat.type">
                <el-icon><component :is="stat.icon" /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">{{ stat.title }}</div>
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-trend" :class="{ up: stat.trend > 0, down: stat.trend < 0 }">
                  {{ Math.abs(stat.trend) }}% 较上周
                  <el-icon><component :is="stat.trend > 0 ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 设备筛选 -->
    <div class="filter-section tech-filter">
      <el-input
        v-model="searchQuery"
        placeholder="搜索设备"
        prefix-icon="Search"
        style="width: 200px"
      />
      <el-select v-model="filterType" placeholder="设备类型" style="width: 150px">
        <el-option label="全部类型" value="" />
        <el-option label="位移传感器" value="displacement" />
        <el-option label="倾角传感器" value="tilt" />
        <el-option label="应力传感器" value="stress" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="设备状态" style="width: 150px">
        <el-option label="全部状态" value="" />
        <el-option label="正常" value="normal" />
        <el-option label="异常" value="warning" />
        <el-option label="离线" value="offline" />
      </el-select>
    </div>

    <!-- 设备表格 -->
    <el-card class="table-card tech-card">
      <el-table 
        :data="filteredDevices" 
        border 
        style="width: 100%"
        class="tech-table"
        :header-cell-style="{
          background: '#f5f7fa',
          color: '#606266',
          fontWeight: 'bold'
        }"
      >
        <el-table-column prop="id" label="设备ID" width="120" />
        <el-table-column prop="name" label="设备名称" width="150" />
        <el-table-column prop="type" label="设备类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getDeviceTypeTag(row.type)" effect="plain">
              {{ getDeviceTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="安装位置" width="180" />
        <el-table-column prop="lastUpdate" label="最后更新" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="dark">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button size="small" type="primary" plain @click="handleView(row)">
                <el-icon><View /></el-icon>查看
              </el-button>
              <el-button size="small" @click="handleEdit(row)">
                <el-icon><Edit /></el-icon>编辑
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                plain
                @click="handleDelete(row)"
              >
                <el-icon><Delete /></el-icon>删除
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

    <!-- 添加/编辑设备对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加设备' : '编辑设备'"
      width="600px"
      class="tech-dialog"
    >
      <el-form :model="deviceForm" label-width="100px" class="tech-form">
        <el-form-item label="设备名称" required>
          <el-input v-model="deviceForm.name" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="设备类型" required>
          <el-select v-model="deviceForm.type" style="width: 100%">
            <el-option label="位移传感器" value="displacement" />
            <el-option label="倾角传感器" value="tilt" />
            <el-option label="应力传感器" value="stress" />
          </el-select>
        </el-form-item>
        <el-form-item label="安装位置" required>
          <el-input v-model="deviceForm.location" placeholder="请输入安装位置" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="deviceForm.description"
            type="textarea"
            rows="3"
            placeholder="请输入设备描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" class="tech-button" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { 
  Plus, 
  View, 
  Edit, 
  Delete, 
  Search,
  Monitor,
  Warning,
  Connection,
  Refresh,
  ArrowUp,
  ArrowDown
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 设备统计数据
const deviceStats = [
  {
    title: '设备总数',
    value: '125',
    trend: 5.2,
    type: 'primary',
    icon: 'Monitor'
  },
  {
    title: '在线设备',
    value: '108',
    trend: 3.1,
    type: 'success',
    icon: 'Connection'
  },
  {
    title: '异常设备',
    value: '12',
    trend: -2.5,
    type: 'warning',
    icon: 'Warning'
  },
  {
    title: '今日新增',
    value: '5',
    trend: 8.4,
    type: 'info',
    icon: 'Plus'
  }
]

// 筛选条件
const searchQuery = ref('')
const filterType = ref('')
const filterStatus = ref('')

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

// 设备列表数据
const devices = ref([
  {
    id: 'DEV001',
    name: '位移传感器01',
    type: 'displacement',
    location: '监测点A-01',
    lastUpdate: '2024-03-20 10:00:00',
    status: 'normal',
    description: '用于监测位移变化'
  },
  // ... 更多设备数据
])

// 过滤后的设备列表
const filteredDevices = computed(() => {
  return devices.value.filter(device => {
    const matchQuery = device.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                      device.id.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchType = !filterType.value || device.type === filterType.value
    const matchStatus = !filterStatus.value || device.status === filterStatus.value
    return matchQuery && matchType && matchStatus
  })
})

// 对话框相关
const dialogVisible = ref(false)
const dialogType = ref('add')
const deviceForm = ref({
  name: '',
  type: '',
  location: '',
  description: ''
})

// 获取设备类型样式
const getDeviceTypeTag = (type) => {
  const types = {
    displacement: 'primary',
    tilt: 'success',
    stress: 'warning'
  }
  return types[type]
}

const getDeviceTypeText = (type) => {
  const texts = {
    displacement: '位移传感器',
    tilt: '倾角传感器',
    stress: '应力传感器'
  }
  return texts[type]
}

// 获取状态样式
const getStatusType = (status) => {
  const types = {
    normal: 'success',
    warning: 'warning',
    offline: 'danger'
  }
  return types[status]
}

const getStatusText = (status) => {
  const texts = {
    normal: '正常',
    warning: '异常',
    offline: '离线'
  }
  return texts[status]
}

// 操作处理函数
const handleView = (row) => {
  console.log('查看设备:', row)
}

const handleAdd = () => {
  dialogType.value = 'add'
  deviceForm.value = {
    name: '',
    type: '',
    location: '',
    description: ''
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogType.value = 'edit'
  deviceForm.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除设备 ${row.name} 吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    devices.value = devices.value.filter(item => item.id !== row.id)
    ElMessage.success('删除成功')
  })
}

const handleSubmit = () => {
  if (!deviceForm.value.name || !deviceForm.value.type || !deviceForm.value.location) {
    ElMessage.warning('请填写必要信息')
    return
  }

  if (dialogType.value === 'add') {
    devices.value.push({
      id: `DEV${String(Date.now()).slice(-3)}`,
      ...deviceForm.value,
      status: 'normal',
      lastUpdate: new Date().toLocaleString()
    })
  } else {
    const index = devices.value.findIndex(item => item.id === deviceForm.value.id)
    devices.value[index] = { ...devices.value[index], ...deviceForm.value }
  }
  dialogVisible.value = false
  ElMessage.success(dialogType.value === 'add' ? '添加成功' : '修改成功')
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
</script>

<style scoped>
.devices-container {
  height: 100%;
  overflow-y: auto;
}

.device-stats {
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

.stat-icon.primary { background: linear-gradient(135deg, #409EFF, #36cfc9); }
.stat-icon.success { background: linear-gradient(135deg, #67C23A, #95D475); }
.stat-icon.warning { background: linear-gradient(135deg, #E6A23C, #F3D19E); }
.stat-icon.info { background: linear-gradient(135deg, #909399, #C8C9CC); }

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

.table-card {
  margin-top: 24px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-button-group) .el-button {
  margin-left: -1px !important;
}

:deep(.el-dialog__body) {
  padding-top: 20px;
}
</style> 