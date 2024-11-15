<template>
  <div class="settings-container">
    <div class="header">
      <h2>系统设置</h2>
    </div>

    <el-tabs v-model="activeTab">
      <!-- 基本设置 -->
      <el-tab-pane label="基本设置" name="basic">
        <el-form :model="basicSettings" label-width="120px">
          <el-form-item label="系统名称">
            <el-input v-model="basicSettings.systemName" />
          </el-form-item>
          <el-form-item label="系统Logo">
            <el-upload
              class="avatar-uploader"
              action="#"
              :show-file-list="false"
              :before-upload="beforeLogoUpload"
            >
              <img v-if="basicSettings.logo" :src="basicSettings.logo" class="avatar" />
              <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
            </el-upload>
          </el-form-item>
          <el-form-item label="数据刷新间隔">
            <el-input-number v-model="basicSettings.refreshInterval" :min="1" :max="60" />
            <span class="unit">分钟</span>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 预警设置 -->
      <el-tab-pane label="预警设置" name="alert">
        <el-form :model="alertSettings" label-width="120px">
          <el-form-item label="预警方式">
            <el-checkbox-group v-model="alertSettings.methods">
              <el-checkbox label="email">邮件通知</el-checkbox>
              <el-checkbox label="sms">短信通知</el-checkbox>
              <el-checkbox label="wechat">微信通知</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="预警阈值设置">
            <el-table :data="alertSettings.thresholds" border style="width: 100%">
              <el-table-column prop="type" label="监测类型" width="180" />
              <el-table-column prop="level1" label="一级预警阈值">
                <template #default="{ row }">
                  <el-input v-model="row.level1" />
                </template>
              </el-table-column>
              <el-table-column prop="level2" label="二级预警阈值">
                <template #default="{ row }">
                  <el-input v-model="row.level2" />
                </template>
              </el-table-column>
              <el-table-column prop="level3" label="三级预警阈值">
                <template #default="{ row }">
                  <el-input v-model="row.level3" />
                </template>
              </el-table-column>
            </el-table>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 用户管理 -->
      <el-tab-pane label="用户管理" name="user">
        <div class="table-header">
          <el-button type="primary" @click="handleAddUser">
            <el-icon><Plus /></el-icon>添加用户
          </el-button>
        </div>
        <el-table :data="users" border style="width: 100%">
          <el-table-column prop="username" label="用户名" width="180" />
          <el-table-column prop="role" label="角色" width="120">
            <template #default="{ row }">
              <el-tag :type="getRoleType(row.role)">{{ getRoleText(row.role) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="email" label="邮箱" />
          <el-table-column prop="lastLogin" label="最后登录时间" width="180" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button-group>
                <el-button size="small" @click="handleEditUser(row)">编辑</el-button>
                <el-button 
                  size="small" 
                  type="danger" 
                  @click="handleDeleteUser(row)"
                  :disabled="row.role === 'admin'"
                >
                  删除
                </el-button>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 保存按钮 -->
    <div class="actions">
      <el-button type="primary" @click="saveSettings">保存设置</el-button>
    </div>

    <!-- 用户编辑对话框 -->
    <el-dialog
      v-model="userDialogVisible"
      :title="userDialogType === 'add' ? '添加用户' : '编辑用户'"
      width="500px"
    >
      <el-form :model="userForm" label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="userForm.username" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="userForm.role" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="操作员" value="operator" />
            <el-option label="查看者" value="viewer" />
          </el-select>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="userForm.email" />
        </el-form-item>
        <el-form-item label="密码" v-if="userDialogType === 'add'">
          <el-input v-model="userForm.password" type="password" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUser">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('basic')

// 基本设置
const basicSettings = ref({
  systemName: '北斗星物联云',
  logo: '',
  refreshInterval: 5
})

// 预警设置
const alertSettings = ref({
  methods: ['email', 'sms'],
  thresholds: [
    { type: '位移监测', level1: '10mm', level2: '20mm', level3: '30mm' },
    { type: '倾角监测', level1: '1°', level2: '2°', level3: '3°' },
    { type: '应力监测', level1: '100kPa', level2: '200kPa', level3: '300kPa' }
  ]
})

// 用户管理
const users = ref([
  {
    username: 'admin',
    role: 'admin',
    email: 'admin@example.com',
    lastLogin: '2024-03-20 10:00:00'
  },
  {
    username: 'operator1',
    role: 'operator',
    email: 'operator1@example.com',
    lastLogin: '2024-03-19 15:30:00'
  }
])

const userDialogVisible = ref(false)
const userDialogType = ref('add')
const userForm = ref({
  username: '',
  role: '',
  email: '',
  password: ''
})

// Logo上传
const beforeLogoUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('上传文件只能是图片格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('上传图片大小不能超过 2MB!')
    return false
  }

  // 这里应该调用实际的上传接口
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = () => {
    basicSettings.value.logo = reader.result
  }
  return false
}

// 角色相关
const getRoleType = (role) => {
  const types = {
    admin: 'danger',
    operator: 'warning',
    viewer: 'info'
  }
  return types[role]
}

const getRoleText = (role) => {
  const texts = {
    admin: '管理员',
    operator: '操作员',
    viewer: '查看者'
  }
  return texts[role]
}

// 用户管理相关
const handleAddUser = () => {
  userDialogType.value = 'add'
  userForm.value = {
    username: '',
    role: '',
    email: '',
    password: ''
  }
  userDialogVisible.value = true
}

const handleEditUser = (row) => {
  userDialogType.value = 'edit'
  userForm.value = { ...row }
  userDialogVisible.value = true
}

const handleDeleteUser = (row) => {
  ElMessageBox.confirm(
    `确定要删除用户 ${row.username} 吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    users.value = users.value.filter(user => user.username !== row.username)
    ElMessage.success('删除成功')
  })
}

const submitUser = () => {
  if (userDialogType.value === 'add') {
    users.value.push({
      ...userForm.value,
      lastLogin: '-'
    })
  } else {
    const index = users.value.findIndex(user => user.username === userForm.value.username)
    users.value[index] = { ...users.value[index], ...userForm.value }
  }
  userDialogVisible.value = false
  ElMessage.success(userDialogType.value === 'add' ? '添加成功' : '修改成功')
}

// 保存设置
const saveSettings = () => {
  // 这里添加实际的保存逻辑
  console.log('保存设置:', {
    basic: basicSettings.value,
    alert: alertSettings.value
  })
  ElMessage.success('保存成功')
}
</script>

<style scoped>
.settings-container {
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  margin: 0;
  font-weight: 500;
  color: #1f2f3d;
}

.unit {
  margin-left: 8px;
  color: #909399;
}

.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 178px;
  height: 178px;
}

.avatar-uploader:hover {
  border-color: #409EFF;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}

.avatar {
  width: 178px;
  height: 178px;
  display: block;
}

.table-header {
  margin-bottom: 16px;
}

.actions {
  margin-top: 24px;
  text-align: center;
}
</style> 