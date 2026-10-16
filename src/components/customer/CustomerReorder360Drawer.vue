<template>
  <el-drawer
    v-model="visible"
    title="客户 360° 全景管家"
    size="85%"
    :destroy-on-close="true"
    class="customer-360-drawer"
  >
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="8" animated />
    </div>
    <div v-else-if="!customer" class="empty-state">
      <el-empty description="无法加载客户信息" />
    </div>
    <div v-else class="drawer-content">
      <!-- Top Dashboard -->
      <div class="dashboard-header">
        <div class="dash-avatar">
          {{ (customer.companyName || customer.customerName || '?').substring(0, 1) }}
        </div>
        <div class="dash-info">
          <h2>{{ customer.companyName || customer.customerName }}</h2>
          <p>
            联系人: <strong>{{ customer.customerName }}</strong> | 
            电话: <strong>{{ customer.contactInfo || '-' }}</strong> | 
            类型: <strong>{{ customer.customerType || '-' }}</strong> |
            状态: 
            <el-tag :type="displayCooperationStatus === '已合作' ? 'success' : 'info'" size="small" style="font-weight: bold; margin-left: 2px;">
              {{ displayCooperationStatus }}
            </el-tag>
          </p>
        </div>
        <div class="dash-stats">
          <div class="stat-box">
            <div class="lbl">累计合作总额</div>
            <div class="val">¥{{ computedTotalAmount.toLocaleString() }}</div>
          </div>
          <div class="stat-box" :class="{ danger: computedArrears > 0 }">
            <div class="lbl">当前欠款</div>
            <div class="val">¥{{ computedArrears.toLocaleString() }}</div>
          </div>
        </div>
        <div class="dash-actions" style="display: flex; flex-direction: column; gap: 8px; margin-left: 20px; padding-left: 20px; border-left: 1px solid var(--border-color);">
          <AppButton type="primary" plain size="small" @click="$emit('invoice', customer)">开票信息</AppButton>
          <AppButton variant="edit" @click="$emit('edit', customer)">编辑</AppButton>
        </div>
      </div>

      <!-- Tabs Section -->
      <el-tabs v-model="activeTab" class="dashboard-tabs" type="border-card">
        
        <el-tab-pane label="历次订单与复购" name="reorders">
          <div class="tab-content-scroll">
            <!-- 顶部统计概览条 (极简清爽) -->
            <div class="order-summary-bar">
              <div class="summary-kpis">
                <div class="kpi-item">
                  <span class="kpi-num">{{ displayFinanceOrders.length }}</span>
                  <span class="kpi-label">全部订单</span>
                </div>
                <div class="kpi-divider"></div>
                <div class="kpi-item">
                  <span class="kpi-num warning">{{ producingCount }}</span>
                  <span class="kpi-label">车间生产中</span>
                </div>
                <div class="kpi-divider"></div>
                <div class="kpi-item">
                  <span class="kpi-num info">{{ waitingInstallCount }}</span>
                  <span class="kpi-label">待现场安装</span>
                </div>
                <div class="kpi-divider"></div>
                <div class="kpi-item">
                  <span class="kpi-num" :class="{ danger: computedArrears > 0, success: computedArrears === 0 && computedTotalAmount > 0 }">
                    {{ computedArrears > 0 ? `¥${computedArrears.toLocaleString()}` : '已结清 ✓' }}
                  </span>
                  <span class="kpi-label">当前总欠款</span>
                </div>
              </div>
              <AppButton variant="add" size="small" @click="openFinanceAddDialog">登记新复购订单</AppButton>
            </div>

            <!-- 复购订单明细清单表格 -->
            <el-table :data="displayFinanceOrders" border style="width: 100%" stripe class="reorder-table">
              <AutoFitColumn :data="displayFinanceOrders" prop="orderName" label="订单/项目名称" :min="160" :max="360">
                <template #default="{ row }">
                  <div class="order-name-cell">
                    <span class="name-text">{{ row.orderName }}</span>
                    <span class="date-text" v-if="row.createdAt">
                      {{ new Date(row.createdAt).toLocaleDateString() }}
                    </span>
                    <el-tag v-if="row.isContractVirtual" size="small" type="warning" effect="plain" style="margin-left: 6px;">同步中</el-tag>
                  </div>
                </template>
              </AutoFitColumn>

              <AutoFitColumn :data="displayFinanceOrders" prop="orderStatus" label="车间生产状态" :min="130" :max="150" align="center">
                <template #default="{ row }">
                  <el-dropdown
                    v-if="!row.isContractVirtual"
                    trigger="click"
                    @command="(val: string) => quickUpdateOrderStatus(row, 'orderStatus', val)"
                  >
                    <el-tag
                      size="small"
                      class="clickable-status-tag"
                      :type="row.orderStatus === '生产完成' ? 'success' : (row.orderStatus === '生产中' ? 'warning' : 'info')"
                    >
                      {{ row.orderStatus || '生产中' }} ▾
                    </el-tag>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="待排产">待排产</el-dropdown-item>
                        <el-dropdown-item command="生产中">生产中</el-dropdown-item>
                        <el-dropdown-item command="生产完成">生产完成</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                  <el-tag v-else size="small" type="info">待排产</el-tag>
                </template>
              </AutoFitColumn>

              <AutoFitColumn :data="displayFinanceOrders" prop="installationStatus" label="现场安装状态" :min="130" :max="150" align="center">
                <template #default="{ row }">
                  <el-dropdown
                    v-if="!row.isContractVirtual"
                    trigger="click"
                    @command="(val: string) => quickUpdateOrderStatus(row, 'installationStatus', val)"
                  >
                    <el-tag
                      size="small"
                      class="clickable-status-tag"
                      :type="row.installationStatus === '已安装' ? 'success' : (row.installationStatus === '待安装' ? 'primary' : 'info')"
                    >
                      {{ row.installationStatus || '待安装' }} ▾
                    </el-tag>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="待安装">待安装</el-dropdown-item>
                        <el-dropdown-item command="已安装">已安装</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                  <el-tag v-else size="small" type="info">待安装</el-tag>
                </template>
              </AutoFitColumn>

              <AutoFitColumn :data="displayFinanceOrders" prop="orderAmount" label="订单金额" :min="110" :max="140" align="center">
                <template #default="{ row }">
                  <span style="font-weight: 600;">¥{{ Number(row.orderAmount || 0).toLocaleString() }}</span>
                </template>
              </AutoFitColumn>

              <AutoFitColumn :data="displayFinanceOrders" label="回款与欠款" :min="160" :max="220" align="center">
                <template #default="{ row }">
                  <div class="payment-progress-cell">
                    <div class="progress-labels">
                      <span class="paid-text">已收 ¥{{ Number(row.paidAmount || 0).toLocaleString() }}</span>
                      <span v-if="Math.max(0, (row.orderAmount || 0) - (row.paidAmount || 0)) > 0" class="debt-text">
                        欠 ¥{{ Math.max(0, (row.orderAmount || 0) - (row.paidAmount || 0)).toLocaleString() }}
                      </span>
                      <el-tag v-else size="small" type="success" effect="plain">已结清</el-tag>
                    </div>
                    <el-progress
                      :percentage="Math.min(100, Math.round(((row.paidAmount || 0) / (row.orderAmount || 1)) * 100))"
                      :show-text="false"
                      :stroke-width="5"
                      :status="((row.paidAmount || 0) >= (row.orderAmount || 0) && (row.orderAmount || 0) > 0) ? 'success' : undefined"
                    />
                  </div>
                </template>
              </AutoFitColumn>

              <AutoFitColumn :data="displayFinanceOrders" label="工期与预计交期" :min="210" :max="320">
                <template #default="{ row }">
                  <div class="delivery-schedule-cell">
                    <!-- 车间工期与推算完工日 -->
                    <div v-if="row.workshopDeliveryDays" class="schedule-line workshop-line">
                      <span class="schedule-title">车间:</span>
                      <span class="days-badge">{{ row.workshopDeliveryDays }}天</span>
                      <span class="arrow-sep">→</span>
                      <span class="target-date">{{ getDeliveryInfo(row.workshopDeliveryDays, row.workshopDeliveryStartDate || row.createdAt)?.targetStr }}</span>
                      <template v-if="row.orderStatus === '生产完成'">
                        <el-tag size="small" type="success" effect="plain" class="mini-status-tag">完工✓</el-tag>
                      </template>
                      <template v-else>
                        <el-tag
                          v-if="(getDeliveryInfo(row.workshopDeliveryDays, row.workshopDeliveryStartDate || row.createdAt)?.remaining ?? 0) >= 0"
                          size="small"
                          type="warning"
                          effect="plain"
                          class="mini-status-tag"
                        >
                          剩{{ getDeliveryInfo(row.workshopDeliveryDays, row.workshopDeliveryStartDate || row.createdAt)?.remaining }}天
                        </el-tag>
                        <el-tag v-else size="small" type="danger" effect="dark" class="mini-status-tag">
                          超期{{ Math.abs(getDeliveryInfo(row.workshopDeliveryDays, row.workshopDeliveryStartDate || row.createdAt)?.remaining ?? 0) }}天
                        </el-tag>
                      </template>
                    </div>

                    <!-- 实际工期与推算交付日 -->
                    <div v-if="row.deliveryDays" class="schedule-line actual-line">
                      <span class="schedule-title">实际:</span>
                      <span class="days-badge">{{ row.deliveryDays }}天</span>
                      <span class="arrow-sep">→</span>
                      <span class="target-date">{{ getDeliveryInfo(row.deliveryDays, row.deliveryStartDate || row.createdAt)?.targetStr }}</span>
                      <template v-if="row.installationStatus === '已安装'">
                        <el-tag size="small" type="success" effect="plain" class="mini-status-tag">交付✓</el-tag>
                      </template>
                      <template v-else>
                        <el-tag
                          v-if="(getDeliveryInfo(row.deliveryDays, row.deliveryStartDate || row.createdAt)?.remaining ?? 0) >= 0"
                          size="small"
                          type="primary"
                          effect="plain"
                          class="mini-status-tag"
                        >
                          剩{{ getDeliveryInfo(row.deliveryDays, row.deliveryStartDate || row.createdAt)?.remaining }}天
                        </el-tag>
                        <el-tag v-else size="small" type="danger" effect="dark" class="mini-status-tag">
                          超期{{ Math.abs(getDeliveryInfo(row.deliveryDays, row.deliveryStartDate || row.createdAt)?.remaining ?? 0) }}天
                        </el-tag>
                      </template>
                    </div>

                    <div v-if="!row.workshopDeliveryDays && !row.deliveryDays" style="color: #94a3b8; font-size: 12px;">
                      未设工期
                    </div>

                    <!-- 订单备注（若有） -->
                    <div v-if="row.remark" class="schedule-remark" :title="row.remark">
                      注: {{ row.remark }}
                    </div>
                  </div>
                </template>
              </AutoFitColumn>

              <el-table-column label="操作" width="180" align="center" fixed="right">
                <template #default="{ row }">
                  <ActionButtons
                    link
                    :actions="getFinanceActions(row)"
                  />
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!displayFinanceOrders.length" description="该客户暂无复购订单，点击右上角立即登记" :image-size="60" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="业务跟进记录" name="overview">
          <div class="tab-content-scroll">
            <div class="section-block">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
                <h4>业务跟进记录</h4>
                <AppButton variant="add" size="small" @click="showFollowUpDialog = true">记录跟进</AppButton>
              </div>
              <el-timeline v-if="customer.followUps && customer.followUps.length">
                <el-timeline-item 
                  v-for="log in customer.followUps" 
                  :key="log.id"
                  :timestamp="new Date(log.createdAt).toLocaleString()"
                  placement="top"
                >
                  <el-card shadow="hover">
                    <p>{{ log.content }}</p>
                    <small v-if="log.nextTime" style="color: #e6a23c;">下次跟进计划：{{ new Date(log.nextTime).toLocaleDateString() }}</small>
                  </el-card>
                </el-timeline-item>
              </el-timeline>
              <el-empty v-else description="暂无跟进记录" :image-size="60" />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="历史报价单" name="quotes">
          <div class="tab-content-scroll">
            <div style="margin-bottom: 15px; text-align: right;">
              <AppButton type="primary" size="small" label="跳转至新增报价单" @click="goCreateQuotation" />
            </div>
            <el-table :data="quotes" border style="width: 100%" stripe>
              <AutoFitColumn :data="quotes" prop="name" label="报价单名称" :min="180" :max="400">
                <template #default="{ row }">
                  <span
                    style="font-weight: bold; cursor: pointer; color: var(--el-color-primary);"
                    title="点击查看该报价单"
                    @click="viewQuotationDetail(row)"
                  >
                    {{ (row.name || row.companyName || '-') + (row.createDate ? '；' + row.createDate : '') }}
                  </span>
                </template>
              </AutoFitColumn>
              <AutoFitColumn :data="quotes" prop="finalPrice" label="成交总额(元)" :min="130" :max="180" align="center">
                <template #default="{ row }">
                  <span style="color: #f56c6c; font-weight: bold;">¥ {{ Number(row.finalPrice || 0).toLocaleString() }}</span>
                </template>
              </AutoFitColumn>
              <AutoFitColumn :data="quotes" prop="ownerName" label="提交人" :min="100" :max="140" align="center" />
              <AutoFitColumn :data="quotes" prop="createDate" label="创建时间" :min="130" :max="180" align="center" />
              <AutoFitColumn :data="quotes" label="操作" :min="130" :max="160" align="center">
                <template #default="{ row }">
                  <AppButton variant="view" size="small" @click="viewQuotationDetail(row)">查看该报价单</AppButton>
                </template>
              </AutoFitColumn>
              <AutoFitColumn :data="quotes" prop="status" label="状态" :min="110" :max="130" align="center">
                <template #default="scope">
                  <el-tag :type="scope.row.status === 'approved' ? 'success' : (scope.row.status === 'rejected' ? 'danger' : 'warning')">
                    {{ scope.row.status === 'approved' ? '已通过' : (scope.row.status === 'rejected' ? '已拒绝' : '草稿/待定') }}
                  </el-tag>
                </template>
              </AutoFitColumn>
            </el-table>
            <el-empty v-if="quotes.length === 0" description="该客户暂未生成报价单" :image-size="60" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="车间下单记录" name="orders">
          <div class="tab-content-scroll">
            <div style="margin-bottom: 15px; text-align: right;">
              <AppButton type="primary" size="small" @click="goCreateOrder">
                跳转至新增下单
              </AppButton>
            </div>
            <el-table :data="orders" border style="width: 100%" stripe>
              <AutoFitColumn :data="orders" prop="name" label="下单名称" :min="180" :max="360">
                <template #default="{ row }">
                  <span
                    style="font-weight: bold; cursor: pointer; color: var(--el-color-primary);"
                    title="点击查看该下单"
                    @click="viewOrderDetail(row)"
                  >
                    {{ (row.name || '-') + (row.orderDate ? '；' + row.orderDate : '') }}
                  </span>
                </template>
              </AutoFitColumn>
              <AutoFitColumn :data="orders" prop="deliveryAddress" label="交货地址" :min="180" :max="400" show-overflow-tooltip />
              <AutoFitColumn :data="orders" prop="orderDate" label="下单日期" :min="120" :max="160" align="center" />
              <AutoFitColumn :data="orders" prop="ownerName" label="业务员" :min="100" :max="140" align="center" />
              <AutoFitColumn :data="orders" label="操作" :min="130" :max="160" align="center">
                <template #default="{ row }">
                  <AppButton variant="view" size="small" @click="viewOrderDetail(row)">查看该下单</AppButton>
                </template>
              </AutoFitColumn>
            </el-table>
            <el-empty v-if="orders.length === 0" description="该客户暂无真实车间下单记录" :image-size="60" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="正式合同与账款" name="contracts">
          <div class="tab-content-scroll">
            <div style="margin-bottom: 15px; text-align: right;">
              <AppButton type="primary" size="small" label="跳转至新增合同" @click="goCreateContract" />
            </div>
            <el-table :data="contracts" border style="width: 100%" stripe>
              <AutoFitColumn :data="contracts" prop="title" label="合同标题" :min="180" :max="400">
                <template #default="{ row }">
                  <span
                    style="font-weight: bold; cursor: pointer; color: var(--el-color-primary);"
                    title="点击查看该合同"
                    @click="viewContractDetail(row)"
                  >
                    {{ (row.title || '-') + ((row.contractDate || row.createdAt) ? '；' + new Date(row.contractDate || row.createdAt).toLocaleDateString() : '') }}
                  </span>
                </template>
              </AutoFitColumn>
              <AutoFitColumn :data="contracts" prop="amount" label="合同确定总额(元)" :min="140" :max="200" align="center">
                <template #default="scope">
                  <strong style="color: #f56c6c;">¥ {{ Number(scope.row.amount || 0).toLocaleString() }}</strong>
                </template>
              </AutoFitColumn>
              <AutoFitColumn :data="contracts" prop="contractDate" label="合同时间" :min="120" :max="160" align="center">
                <template #default="scope">{{ scope.row.contractDate ? new Date(scope.row.contractDate).toLocaleDateString() : (scope.row.createdAt ? new Date(scope.row.createdAt).toLocaleDateString() : '-') }}</template>
              </AutoFitColumn>
              <AutoFitColumn :data="contracts" prop="ownerName" label="录入人" :min="100" :max="140" align="center" />
              <AutoFitColumn :data="contracts" label="操作" :min="130" :max="160" align="center">
                <template #default="{ row }">
                  <AppButton variant="view" size="small" @click="viewContractDetail(row)">查看该合同</AppButton>
                </template>
              </AutoFitColumn>
            </el-table>
            <el-empty v-if="contracts.length === 0" description="该客户暂未签订正式合同" :image-size="60" />
          </div>
        </el-tab-pane>

      </el-tabs>
    </div>

    <!-- Dialogs -->
    <el-dialog v-model="showFollowUpDialog" title="写跟进记录" width="500px" append-to-body>
      <el-form :model="followUpForm" label-width="80px" label-position="top">
        <el-form-item label="跟进详情"><el-input type="textarea" v-model="followUpForm.content" rows="3" /></el-form-item>
        <el-form-item label="下次跟进计划(可选)"><el-date-picker v-model="followUpForm.nextTime" type="date" value-format="YYYY-MM-DD" placeholder="选择下次联系时间" style="width: 100%" /></el-form-item>
      </el-form>
      <template #footer>
        <FormButtons submit-text="保存" @cancel="showFollowUpDialog = false" @submit="submitFollowUp" />
      </template>
    </el-dialog>

    <el-dialog v-model="showFinanceDialog" :title="editingFinanceId ? '登记回款与更新状态' : '新增交易账单'" width="650px" append-to-body>
      <el-form :model="financeForm" label-width="120px">
        <el-form-item label="账单/订单名称">
          <el-input v-model="financeForm.orderName" placeholder="如：第一笔订单、二期工程..." />
        </el-form-item>
        <el-form-item label="账单总额(元)">
          <el-input-number v-model="financeForm.orderAmount" :min="0" style="width:100%" />
        </el-form-item>
        <el-form-item label="当前欠款(元)">
          <span style="color: #f56c6c; font-weight: bold;">
            ¥ {{ Math.max(0, (Number(financeForm.orderAmount) || 0) - (Number(financeForm.paidAmount) || 0)).toLocaleString() }}
          </span>
          <span v-if="editingFinanceId && Number(financeForm.paidAmount) > 0" style="margin-left: 12px; color: #64748b; font-size: 13px;">
            (已累计回款: ¥{{ Number(financeForm.paidAmount).toLocaleString() }})
          </span>
        </el-form-item>
        <el-form-item label="结款状态">
          <el-tag :type="computedFinanceStatus.type" disable-transitions size="large">
            {{ computedFinanceStatus.label }}
          </el-tag>
          <span style="margin-left: 8px; color: #909399; font-size: 12px;">根据欠款自动判定</span>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="车间生产状态">
              <el-select v-model="financeForm.orderStatus" placeholder="选择生产进度" style="width: 100%;">
                <el-option label="待排产" value="待排产" />
                <el-option label="生产中" value="生产中" />
                <el-option label="生产完成" value="生产完成" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="现场安装状态">
              <el-select v-model="financeForm.installationStatus" placeholder="选择安装进度" style="width: 100%;">
                <el-option label="待安装" value="待安装" />
                <el-option label="已安装" value="已安装" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <div style="margin: 12px 0 14px 0; padding: 12px 14px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="font-weight: 600; font-size: 13px; color: #334155; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
            <span>📅 工期计划与预计交期自动推算</span>
            <span style="font-size: 12px; font-weight: normal; color: #94a3b8;">(输入工期天数后将根据起算日期自动推送完工年月日)</span>
          </div>

          <!-- 车间工期 -->
          <el-row :gutter="14" align="middle" style="margin-bottom: 10px;">
            <el-col :span="10">
              <el-form-item label="车间工期(天)" style="margin-bottom: 0;">
                <el-input-number
                  v-model="financeForm.workshopDeliveryDays"
                  :min="1"
                  :max="365"
                  controls-position="right"
                  placeholder="如：15"
                  style="width: 100%;"
                />
              </el-form-item>
            </el-col>
            <el-col :span="14">
              <el-form-item label="车间起算日" style="margin-bottom: 0;">
                <el-date-picker
                  v-model="financeForm.workshopDeliveryStartDate"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="默认下单当天"
                  style="width: 100%;"
                />
              </el-form-item>
            </el-col>
            <el-col :span="24" v-if="financeForm.workshopDeliveryDays && financeForm.workshopDeliveryDays > 0">
              <div class="date-auto-preview workshop-preview">
                <span>🏭 自动推算车间出厂日：</span>
                <strong>{{ getDeliveryInfo(financeForm.workshopDeliveryDays, financeForm.workshopDeliveryStartDate)?.targetStr }}</strong>
                <span class="preview-badge">（工期 {{ financeForm.workshopDeliveryDays }} 天）</span>
              </div>
            </el-col>
          </el-row>

          <!-- 实际交付工期 -->
          <el-row :gutter="14" align="middle" style="margin-top: 10px;">
            <el-col :span="10">
              <el-form-item label="实际工期(天)" style="margin-bottom: 0;">
                <el-input-number
                  v-model="financeForm.deliveryDays"
                  :min="1"
                  :max="365"
                  controls-position="right"
                  placeholder="如：20"
                  style="width: 100%;"
                />
              </el-form-item>
            </el-col>
            <el-col :span="14">
              <el-form-item label="实际起算日" style="margin-bottom: 0;">
                <el-date-picker
                  v-model="financeForm.deliveryStartDate"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="默认下单当天"
                  style="width: 100%;"
                />
              </el-form-item>
            </el-col>
            <el-col :span="24" v-if="financeForm.deliveryDays && financeForm.deliveryDays > 0">
              <div class="date-auto-preview actual-preview">
                <span>🚚 自动推算实际交付日：</span>
                <strong>{{ getDeliveryInfo(financeForm.deliveryDays, financeForm.deliveryStartDate)?.targetStr }}</strong>
                <span class="preview-badge">（工期 {{ financeForm.deliveryDays }} 天）</span>
              </div>
            </el-col>
          </el-row>
        </div>
        <el-form-item label="订单备注">
          <el-input v-model="financeForm.remark" type="textarea" :rows="2" placeholder="如：一期已发货待款、二期加急冲孔等" />
        </el-form-item>
      </el-form>
      
      <!-- 回款记录模块 -->
      <div v-if="editingFinanceId" style="margin-top: 25px; border-top: 1px solid #ebeef5; padding-top: 20px;">
        <h4 style="margin: 0 0 15px 0; padding-left: 10px; border-left: 4px solid var(--el-color-primary); color: #303133;">分批次回款记录</h4>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
          <el-row :gutter="12" align="middle">
            <el-col :span="8">
              <el-input-number v-model="paymentForm.amount" :min="0" style="width: 100%" :controls="false" placeholder="输入金额(元)" />
            </el-col>
            <el-col :span="12">
              <el-input v-model="paymentForm.remark" placeholder="添加备注（选填）" style="width: 100%" />
            </el-col>
            <el-col :span="4">
              <AppButton type="primary" style="width: 100%" @click="submitPayment" :loading="submittingPayment">记录</AppButton>
            </el-col>
          </el-row>
        </div>

        <el-table :data="currentOrderForPayment?.payments || []" border size="small" style="width: 100%" max-height="250">
          <AutoFitColumn :data="currentOrderForPayment?.payments || []" prop="createdAt" label="回款时间" :min="140" :max="200" align="center">
            <template #default="{ row }">
              <span style="color: #606266;">{{ new Date(row.createdAt).toLocaleString('zh-CN', {month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) }}</span>
            </template>
          </AutoFitColumn>
          <AutoFitColumn :data="currentOrderForPayment?.payments || []" prop="amount" label="金额(元)" :min="100" :max="150" align="center">
            <template #default="{ row }">
              <span style="color: #67c23a; font-weight: bold; font-family: monospace; font-size: 13px;">{{ row.amount.toLocaleString() }}</span>
            </template>
          </AutoFitColumn>
          <AutoFitColumn :data="currentOrderForPayment?.payments || []" prop="remark" label="备注" :min="120" :max="300" align="center" show-overflow-tooltip />
          <AutoFitColumn :data="currentOrderForPayment?.payments || []" label="操作" :min="90" align="center">
            <template #default="{ row }">
              <AppButton variant="delete" type="danger" link @click="deletePaymentRecord(row.id)">删除</AppButton>
            </template>
          </AutoFitColumn>
          <template #empty>
            <span style="color: #909399; font-size: 13px;">暂无回款记录</span>
          </template>
        </el-table>
      </div>

      <template #footer>
        <FormButtons submit-text="保存账单基础信息" @cancel="showFinanceDialog = false" @submit="submitFinance" />
      </template>
    </el-dialog>

    <!-- 极简一键收款登记弹窗 -->
    <el-dialog
      v-model="quickPaymentVisible"
      title="登记回款"
      width="440px"
      append-to-body
      :destroy-on-close="true"
    >
      <div v-if="quickPaymentRow" style="margin-bottom: 16px; font-size: 13px; color: #475569; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
        <div style="font-weight: 600; color: #1e293b; margin-bottom: 6px;">项目：{{ quickPaymentRow.orderName }}</div>
        <div style="display: flex; justify-content: space-between; font-size: 13px;">
          <span>总额: <strong>¥{{ Number(quickPaymentRow.orderAmount || 0).toLocaleString() }}</strong></span>
          <span>已收: <strong style="color: #10b981;">¥{{ Number(quickPaymentRow.paidAmount || 0).toLocaleString() }}</strong></span>
          <span>待收: <strong style="color: #ef4444;">¥{{ Math.max(0, (quickPaymentRow.orderAmount || 0) - (quickPaymentRow.paidAmount || 0)).toLocaleString() }}</strong></span>
        </div>
      </div>
      <el-form label-width="95px">
        <el-form-item label="本次到账(元)">
          <el-input-number
            v-model="quickPaymentAmount"
            :min="0.01"
            :max="quickPaymentMax"
            style="width: 100%;"
            placeholder="输入实收到账金额"
          />
        </el-form-item>
        <el-form-item label="收款备注">
          <el-input v-model="quickPaymentRemark" placeholder="如：预付款、微信转账、第二期进度款等" />
        </el-form-item>
      </el-form>
      <template #footer>
        <FormButtons
          submit-text="确认收款入账"
          :loading="submittingQuickPayment"
          @cancel="quickPaymentVisible = false"
          @submit="submitQuickPayment"
        />
      </template>
    </el-dialog>

    <!-- 详情预览弹窗组件（封装调用，各自独立逻辑） -->
    <QuotationPreviewDialog
      v-model="quotationPreviewVisible"
      :quotation-id="selectedQuotationId"
      :initial-data="selectedQuotation"
      @navigate="visible = false"
    />

    <OrderPreviewDialog
      v-model="orderPreviewVisible"
      :order-id="selectedOrderId"
      :initial-data="selectedOrder"
      @navigate="visible = false"
    />

    <ContractPreviewDialog
      v-model="contractPreviewVisible"
      :contract-id="selectedContractId"
      :initial-data="selectedContract"
      @navigate="visible = false"
    />

  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch, computed, toRef } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import quotationApi from '@/api/quotation'
import contractApi from '@/api/contract'
import orderApi from '@/api/order'
import {
  useCustomerDetailQuery,
  useAddFollowUpMutation,
  useAddOrderMutation,
  useUpdateOrderMutation,
  useDeleteCustomerOrderMutation,
  useAddPaymentMutation,
  useDeletePaymentMutation,
} from '@/composables/useCustomerQueries'
import AppButton from '@/components/common/AppButton.vue'
import AutoFitColumn from '@/components/common/AutoFitColumn.vue'
import ActionButtons from '@/components/common/ActionButtons.vue'
import FormButtons from '@/components/common/FormButtons.vue'
import QuotationPreviewDialog from '@/components/customer/QuotationPreviewDialog.vue'
import OrderPreviewDialog from '@/components/customer/OrderPreviewDialog.vue'
import ContractPreviewDialog from '@/components/customer/ContractPreviewDialog.vue'
import { addDays, formatDate, getRemainingDays } from '@/utils/date'

const props = defineProps<{
  modelValue: boolean
  customerId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'data-changed'): void
  (e: 'edit', customer: any): void
  (e: 'invoice', customer: any): void
}>()

const router = useRouter()

const visible = ref(false)
const activeTab = ref('reorders')

// ---- 工期与交期推算工具函数 ----
const getDeliveryInfo = (days?: number | null, startDate?: string | Date | null) => {
  if (!days || Number(days) <= 0) return null
  const numDays = Number(days)
  const base = startDate ? new Date(startDate) : new Date()
  if (isNaN(base.getTime())) return null
  const targetDate = addDays(numDays, base)
  const targetStr = formatDate(targetDate)
  const remaining = getRemainingDays(targetDate)
  return {
    targetDate,
    targetStr,
    remaining
  }
}

// ---- 客户详情：用 vue-query 自动加载，修改后自动刷新 ----
const customerIdRef = toRef(props, 'customerId')
const { data: customer, isLoading: loading, refetch: refetchCustomer } = useCustomerDetailQuery(customerIdRef)

const quotes = ref<any[]>([])
const contracts = ref<any[]>([])
const orders = ref<any[]>([])

// Dialog forms
const showFollowUpDialog = ref(false)
const followUpForm = ref({ content: '', nextTime: '' })
const showFinanceDialog = ref(false)
const editingFinanceId = ref<number | null>(null)

const defaultFinanceForm = () => ({
  orderName: '',
  orderAmount: 0,
  paidAmount: 0,
  paymentStatus: '待结款',
  orderStatus: '生产中',
  installationStatus: '待安装',
  workshopDeliveryDays: undefined as number | undefined,
  workshopDeliveryStartDate: new Date().toISOString().split('T')[0],
  deliveryDays: undefined as number | undefined,
  deliveryStartDate: new Date().toISOString().split('T')[0],
  remark: ''
})
const financeForm = ref(defaultFinanceForm())

/**
 * 根据账单总额与已收金额自动计算结款状态
 * - 无账单金额 → 待结款
 * - 已收金额 >= 账单总额 → 已结清
 * - 仍有欠款 → 待催款
 */
const computePaymentStatus = (orderAmount: number | null | undefined, paidAmount: number | null | undefined): string => {
  const total = Number(orderAmount) || 0
  const paid = Number(paidAmount) || 0
  if (total <= 0) return '待结款'
  if (paid >= total) return '已结清'
  return '待催款'
}

// 对话框中实时计算的结款状态
const computedFinanceStatus = computed(() => {
  const status = computePaymentStatus(financeForm.value.orderAmount, financeForm.value.paidAmount)
  const typeMap: Record<string, 'success' | 'danger' | 'warning'> = {
    '已结清': 'success',
    '待催款': 'danger',
    '待结款': 'warning',
  }
  return { label: status, type: typeMap[status] || 'warning' }
})

// 表格中根据订单数据动态计算结款状态（不依赖后端存储值，确保旧数据也能正确显示）
const getPaymentStatusInfo = (row: { orderAmount?: number | null; paidAmount?: number | null }) => {
  const status = computePaymentStatus(row.orderAmount, row.paidAmount)
  const typeMap: Record<string, 'success' | 'danger' | 'warning'> = {
    '已结清': 'success',
    '待催款': 'danger',
    '待结款': 'warning',
  }
  return { label: status, type: typeMap[status] || 'warning' }
}

// 监听金额变化，自动同步结款状态到表单（提交时使用）
watch(
  () => [financeForm.value.orderAmount, financeForm.value.paidAmount],
  ([orderAmount, paidAmount]) => {
    financeForm.value.paymentStatus = computePaymentStatus(orderAmount, paidAmount)
  }
)

watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
})

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
  if (newVal) {
    refetchCustomer()
  } else {
    activeTab.value = 'reorders'
  }
})

// 客户详情变化时加载关联的报价单/合同/订单
watch(customer, async (c) => {
  if (!c) {
    quotes.value = []
    contracts.value = []
    orders.value = []
    return
  }
  const currentCustomerId = customer.value?.id
  const companyName = c.companyName || c.customerName || ''
  if (!companyName) return

  try {
    const [qRes, cRes, oRes] = await Promise.all([
      quotationApi.list({ keyword: companyName, page: 1, pageSize: 100 }),
      contractApi.list({ keyword: companyName, page: 1, pageSize: 100 }),
      orderApi.list({ keyword: companyName, page: 1, pageSize: 100 }),
    ])
    if (customer.value?.id !== currentCustomerId) return
    quotes.value = qRes?.list || []
    contracts.value = cRes?.list || []
    orders.value = oRes?.list || []
  } catch (e) {
    console.error('加载关联数据失败', e)
  }
}, { immediate: true })

const goCreateQuotation = () => {
  if (!customer.value) return
  visible.value = false
  router.push({
    path: '/quotation',
    query: { companyName: customer.value.companyName || customer.value.customerName }
  })
}

// ---- 查看报价单详情 ----
const quotationPreviewVisible = ref(false)
const selectedQuotationId = ref<number | null>(null)
const selectedQuotation = ref<any>(null)

const viewQuotationDetail = (row: any) => {
  selectedQuotationId.value = row.id
  selectedQuotation.value = row
  quotationPreviewVisible.value = true
}

// ---- 查看车间下单详情 ----
const orderPreviewVisible = ref(false)
const selectedOrderId = ref<number | null>(null)
const selectedOrder = ref<any>(null)

const viewOrderDetail = (row: any) => {
  selectedOrderId.value = row.id
  selectedOrder.value = row
  orderPreviewVisible.value = true
}

// ---- 查看合同详情 ----
const contractPreviewVisible = ref(false)
const selectedContractId = ref<number | null>(null)
const selectedContract = ref<any>(null)

const viewContractDetail = (row: any) => {
  selectedContractId.value = row.id
  selectedContract.value = row
  contractPreviewVisible.value = true
}

const goCreateOrder = () => {
  if (!customer.value) return
  visible.value = false
  router.push({
    path: '/order',
    query: { customerName: customer.value.companyName || customer.value.customerName }
  })
}

const computedTotalAmount = computed(() => {
  const customerTotal = Number(customer.value?.totalAmount) || 0
  const ordersTotal = (customer.value?.orders || []).reduce((sum: number, o: any) => sum + (Number(o.orderAmount) || 0), 0)
  const contractsTotal = contracts.value.reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)
  return Math.max(customerTotal, ordersTotal, contractsTotal)
})

const computedTotalPaid = computed(() => {
  const customerPaid = Number(customer.value?.totalPaidAmount) || 0
  const ordersPaid = (customer.value?.orders || []).reduce((sum: number, o: any) => sum + (Number(o.paidAmount) || 0), 0)
  return Math.max(customerPaid, ordersPaid)
})

const computedArrears = computed(() => {
  return Math.max(0, computedTotalAmount.value - computedTotalPaid.value)
})

const displayCooperationStatus = computed(() => {
  if (computedTotalAmount.value > 0 || contracts.value.length > 0 || (customer.value?.orders && customer.value.orders.length > 0)) {
    return '已合作'
  }
  return customer.value?.cooperationStatus || '未合作'
})

const displayFinanceOrders = computed(() => {
  const serverOrders = customer.value?.orders || []
  const linkedContractIds = new Set(
    serverOrders
      .filter((o: any) => o.contractId != null)
      .map((o: any) => o.contractId)
  )

  // 找出 contracts 中有金额但尚未关联到 orders 中的合同
  const unlinked = contracts.value.filter(
    (c: any) => Number(c.amount) > 0 && !linkedContractIds.has(c.id)
  )

  if (unlinked.length === 0) {
    return serverOrders
  }

  // 兜底合成展示行（若网络响应存在微小时差，依然能立即展示合同账单）
  const virtualRows = unlinked.map((c: any) => ({
    id: `virtual-contract-${c.id}`,
    customerId: customer.value?.id,
    contractId: c.id,
    orderName: c.title || `${c.companyName || ''} - 合同项目`,
    orderAmount: Number(c.amount) || 0,
    paidAmount: 0,
    orderStatus: '已下单',
    paymentStatus: '待催款',
    isContractVirtual: true,
    createdAt: c.contractDate || c.createdAt,
  }))

  return [...serverOrders, ...virtualRows]
})

const producingCount = computed(() => {
  return displayFinanceOrders.value.filter((o: any) => o.orderStatus === '生产中').length
})

const waitingInstallCount = computed(() => {
  return displayFinanceOrders.value.filter((o: any) => o.installationStatus === '待安装').length
})

// 一键快捷收款弹窗状态
const quickPaymentVisible = ref(false)
const quickPaymentRow = ref<any>(null)
const quickPaymentAmount = ref<number | undefined>(undefined)
const quickPaymentRemark = ref('')
const submittingQuickPayment = ref(false)

const quickPaymentMax = computed(() => {
  if (!quickPaymentRow.value) return undefined
  const unpaid = (Number(quickPaymentRow.value.orderAmount) || 0) - (Number(quickPaymentRow.value.paidAmount) || 0)
  return unpaid > 0 ? unpaid : undefined
})

const openAddPaymentDialog = (row: any) => {
  const unpaid = Math.max(0, (Number(row.orderAmount) || 0) - (Number(row.paidAmount) || 0))
  if (unpaid <= 0) {
    ElMessage.info('该订单已全部结清，如需查看或管理历史收款记录请点击「编辑」')
    return
  }
  quickPaymentRow.value = row
  quickPaymentAmount.value = unpaid
  quickPaymentRemark.value = ''
  quickPaymentVisible.value = true
}

const submitQuickPayment = async () => {
  if (!quickPaymentRow.value || !props.customerId) return
  const amount = Number(quickPaymentAmount.value) || 0
  if (amount <= 0) {
    ElMessage.warning('回款金额必须大于 0')
    return
  }
  const orderUnpaid = Math.max(0, (quickPaymentRow.value.orderAmount || 0) - (quickPaymentRow.value.paidAmount || 0))
  if (orderUnpaid > 0 && amount > orderUnpaid) {
    ElMessage.warning(`回款金额不能超过该订单待收尾款 (¥${orderUnpaid.toLocaleString()})`)
    return
  }
  submittingQuickPayment.value = true
  try {
    await addPaymentMutation.mutateAsync({
      orderId: quickPaymentRow.value.id,
      data: { amount, remark: quickPaymentRemark.value },
      customerId: props.customerId
    })
    ElMessage.success('收款记录已入账')
    quickPaymentVisible.value = false
    await refetchCustomer()
    emit('data-changed')
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || e.message || '登记失败')
  } finally {
    submittingQuickPayment.value = false
  }
}

const goCreateContract = () => {
  if (!customer.value) return
  visible.value = false
  router.push({
    path: '/contract',
    query: {
      customerId: customer.value.id,
      companyName: customer.value.companyName || customer.value.customerName
    }
  })
}

// ---- mutations ----
const addFollowUpMutation = useAddFollowUpMutation()
const addOrderMutation = useAddOrderMutation()
const updateOrderMutation = useUpdateOrderMutation()
const deleteOrderMutation = useDeleteCustomerOrderMutation()

const submitFollowUp = async () => {
  if (!props.customerId) return
  try {
    await addFollowUpMutation.mutateAsync({
      customerId: props.customerId,
      data: { ...followUpForm.value },
    })
    ElMessage.success('跟进记录添加成功')
    showFollowUpDialog.value = false
    followUpForm.value = { content: '', nextTime: '' }
    // mutation 的 onSuccess 已 invalidate ['customer', id] 和 ['customers']，
    // 客户详情会自动刷新，客户管理列表也会自动更新
    emit('data-changed')
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e?.message || ''))
  }
}

const openFinanceAddDialog = () => {
  editingFinanceId.value = null
  financeForm.value = defaultFinanceForm()
  showFinanceDialog.value = true
}

// 快速切换订单状态（生产状态或安装状态）
const quickUpdateOrderStatus = async (row: any, field: 'orderStatus' | 'installationStatus', val: string) => {
  if (!props.customerId || row.isContractVirtual) return
  try {
    await updateOrderMutation.mutateAsync({
      orderId: row.id,
      data: { [field]: val },
      customerId: props.customerId
    })
    ElMessage.success(`状态已更新为：${val}`)
    await refetchCustomer()
    emit('data-changed')
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || e.message || '更新失败')
  }
}

const getFinanceActions = (row: any) => {
  const actions: any[] = []
  if (!row.isContractVirtual) {
    const unpaid = Math.max(0, (Number(row.orderAmount) || 0) - (Number(row.paidAmount) || 0))
    if (unpaid > 0) {
      actions.push({
        key: 'pay',
        label: '收款',
        type: 'success' as const,
        onClick: () => openAddPaymentDialog(row),
      })
    }
    actions.push({
      key: 'edit',
      variant: 'edit' as const,
      label: '编辑',
      onClick: () => openFinanceEditDialog(row),
    })
  } else {
    actions.push({
      key: 'sync',
      variant: 'edit' as const,
      label: '立即同步',
      onClick: async () => {
        await refetchCustomer()
        ElMessage.success('已同步最新账单')
      },
    })
  }
  if (!row.contractId && !row.isContractVirtual) {
    actions.push({
      key: 'delete',
      variant: 'delete' as const,
      label: '删除',
      onClick: () => handleDeleteFinance(row),
    })
  }
  return actions
}

const addPaymentMutation = useAddPaymentMutation()
const deletePaymentMutation = useDeletePaymentMutation()

const currentOrderForPayment = ref<any>(null)
const paymentForm = ref({ amount: 0, remark: '' })
const submittingPayment = ref(false)

watch(() => customer.value?.orders, (newOrders) => {
  if (editingFinanceId.value && currentOrderForPayment.value) {
    const updated = newOrders?.find((o: any) => o.id === currentOrderForPayment.value.id)
    if (updated) {
      currentOrderForPayment.value = updated
      // Sync the paid amount to the edit form as well
      financeForm.value.paidAmount = updated.paidAmount || 0
      financeForm.value.paymentStatus = computePaymentStatus(updated.orderAmount, updated.paidAmount)
    }
  }
}, { deep: true })

const submitPayment = async () => {
  if (!currentOrderForPayment.value || !props.customerId) return
  if (paymentForm.value.amount <= 0) {
    ElMessage.warning('回款金额必须大于 0')
    return
  }
  const maxArrears = computedArrears.value > 0 ? computedArrears.value : Math.max(0, (customer.value?.totalAmount || 0) - (customer.value?.totalPaidAmount || 0));
  if (maxArrears > 0 && paymentForm.value.amount > maxArrears) {
    ElMessage.warning(`回款金额不能超过该客户的总欠款金额 (最多还能登记: ¥${maxArrears})`)
    return
  }
  submittingPayment.value = true
  try {
    await addPaymentMutation.mutateAsync({
      orderId: currentOrderForPayment.value.id,
      data: { ...paymentForm.value },
      customerId: props.customerId
    })
    ElMessage.success('收款记录添加成功')
    paymentForm.value = { amount: 0, remark: '' }
    await refetchCustomer()
    emit('data-changed')
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || e.message || '保存失败')
  } finally {
    submittingPayment.value = false
  }
}

const deletePaymentRecord = async (paymentId: number) => {
  if (!props.customerId) return
  try {
    await ElMessageBox.confirm('确定要删除这条收款记录吗？', '提示', { type: 'warning' })
    await deletePaymentMutation.mutateAsync({ paymentId, customerId: props.customerId })
    ElMessage.success('收款记录删除成功')
    await refetchCustomer()
    emit('data-changed')
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.response?.data?.message || e.message || '删除失败')
  }
}

const openFinanceEditDialog = (row: any) => {
  editingFinanceId.value = row.id
  currentOrderForPayment.value = row
  paymentForm.value = { amount: 0, remark: '' }
  financeForm.value = {
    orderName: row.orderName || '',
    orderAmount: row.orderAmount || 0,
    paidAmount: row.paidAmount || 0,
    paymentStatus: computePaymentStatus(row.orderAmount, row.paidAmount),
    orderStatus: row.orderStatus || '生产中',
    installationStatus: row.installationStatus || '待安装',
    workshopDeliveryDays: row.workshopDeliveryDays,
    workshopDeliveryStartDate: row.workshopDeliveryStartDate ? row.workshopDeliveryStartDate.split('T')[0] : (row.createdAt ? row.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
    deliveryDays: row.deliveryDays,
    deliveryStartDate: row.deliveryStartDate ? row.deliveryStartDate.split('T')[0] : (row.createdAt ? row.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
    remark: row.remark || ''
  }
  showFinanceDialog.value = true
}

const submitFinance = async () => {
  if (!props.customerId) return

  const originalPaidAmount = currentOrderForPayment.value?.paidAmount || 0;
  const increase = financeForm.value.paidAmount - originalPaidAmount;
  const maxArrears = computedArrears.value > 0 ? computedArrears.value : Math.max(0, (customer.value?.totalAmount || 0) - (customer.value?.totalPaidAmount || 0));

  if (maxArrears > 0 && increase > maxArrears) {
    ElMessage.warning(`已收金额的新增量不能超过该客户的总欠款 (最多还能增加: ¥${maxArrears})`)
    return
  }
  
  // 提交前强制重新计算结款状态
  financeForm.value.paymentStatus = computePaymentStatus(financeForm.value.orderAmount, financeForm.value.paidAmount)
  try {
    if (editingFinanceId.value) {
      await updateOrderMutation.mutateAsync({
        orderId: editingFinanceId.value,
        data: {
          orderName: financeForm.value.orderName,
          orderAmount: financeForm.value.orderAmount,
          paidAmount: financeForm.value.paidAmount,
          paymentStatus: financeForm.value.paymentStatus,
          orderStatus: financeForm.value.orderStatus,
          installationStatus: financeForm.value.installationStatus,
          workshopDeliveryDays: financeForm.value.workshopDeliveryDays,
          workshopDeliveryStartDate: financeForm.value.workshopDeliveryStartDate,
          deliveryDays: financeForm.value.deliveryDays,
          deliveryStartDate: financeForm.value.deliveryStartDate,
          remark: financeForm.value.remark
        },
        customerId: props.customerId,
      })
      ElMessage.success('复购订单更新成功')
    } else {
      await addOrderMutation.mutateAsync({
        customerId: props.customerId,
        data: { ...financeForm.value },
      })
      ElMessage.success('复购订单新建成功')
    }
    showFinanceDialog.value = false
    await refetchCustomer()
    emit('data-changed')
  } catch (e: any) {
    const errorMsg = e.response?.data?.message || e.message || '保存失败'
    ElMessage.error('保存失败: ' + errorMsg)
  }
}

const handleDeleteFinance = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这条账单记录吗？', '提示', { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' })
    await deleteOrderMutation.mutateAsync({ orderId: row.id, customerId: props.customerId })
    ElMessage.success('账单删除成功')
    emit('data-changed')
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e.response?.data?.message || e.message || '删除失败')
    }
  }
}
</script>

<style scoped>
.customer-360-drawer :deep(.el-drawer__body) {
  padding: 0;
  background-color: var(--bg-page);
  display: flex;
  flex-direction: column;
}

.drawer-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.loading-state, .empty-state { display: flex; justify-content: center; align-items: center; height: 100%; padding: 40px; }

/* Dashboard Header */
.dashboard-header { display: flex; gap: 20px; align-items: center; padding: 25px 30px; background: var(--bg-card); border-bottom: 1px solid var(--border-color); flex-shrink: 0; }
.dash-avatar { width: 64px; height: 64px; background: var(--el-color-primary); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: bold; }
.dash-info { flex: 1; }
.dash-info h2 { margin: 0 0 8px; font-size: 22px; color: var(--text-primary); }
.dash-info p { margin: 0; color: var(--text-secondary); font-size: 14px; }
.dash-stats { display: flex; gap: 40px; }
.stat-box { text-align: right; }
.stat-box .lbl { font-size: 13px; color: var(--text-secondary); margin-bottom: 5px; }
.stat-box .val { font-size: 24px; font-weight: bold; color: var(--text-primary); }
.stat-box.danger .val { color: #f56c6c; }

/* Tabs */
.dashboard-tabs { flex: 1; border: none; box-shadow: none; display: flex; flex-direction: column; }
:deep(.el-tabs__header) { margin: 0; background: var(--bg-card); }
:deep(.el-tabs__content) { flex: 1; padding: 0; overflow: hidden; background: var(--bg-card); }
:deep(.el-tab-pane) { height: 100%; }
.tab-content-scroll { height: 100%; padding: 20px 30px; overflow-y: auto; box-sizing: border-box; }
.section-block h4 { margin-top: 0; margin-bottom: 0; padding-left: 10px; border-left: 4px solid var(--el-color-primary); font-size: 16px; color: var(--text-primary); }
.mt-20 { margin-top: 30px; }

:deep(.el-table) {
  margin-top: 10px;
}
:deep(.el-table th) {
  background-color: #f5f7fa;
  color: #333;
}

/* 历次复购与订单总览模块 */
.order-summary-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 20px;
  margin-bottom: 16px;
}

.summary-kpis {
  display: flex;
  align-items: center;
  gap: 20px;
}

.kpi-item {
  display: flex;
  flex-direction: column;
}

.kpi-num {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.kpi-num.warning { color: #e6a23c; }
.kpi-num.info { color: #409eff; }
.kpi-num.danger { color: #ef4444; }
.kpi-num.success { color: #10b981; }

.kpi-label {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.kpi-divider {
  width: 1px;
  height: 28px;
  background-color: #cbd5e1;
}

.reorder-table {
  border-radius: 6px;
  overflow: hidden;
}

.order-seq-tag {
  background: #f1f5f9;
  color: #475569;
  font-weight: 700;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}

.order-name-cell {
  display: flex;
  flex-direction: column;
}

.order-name-cell .name-text {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.order-name-cell .date-text {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.clickable-status-tag {
  cursor: pointer;
  font-weight: 500;
}

.payment-progress-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.payment-progress-cell .progress-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.payment-progress-cell .paid-text {
  color: #64748b;
}

.payment-progress-cell .debt-text {
  color: #ef4444;
  font-weight: 600;
}

.remark-cell {
  font-size: 12px;
  line-height: 1.4;
}

.remark-cell .days-line {
  color: #475569;
  font-weight: 500;
}

.remark-cell .remark-text {
  color: #64748b;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 工期推算预览与排产列表样式 */
.date-auto-preview {
  margin-top: 6px;
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.workshop-preview {
  background: #fefce8;
  border: 1px solid #fef08a;
  color: #854d0e;
}
.actual-preview {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
}
.preview-badge {
  font-size: 11px;
  opacity: 0.85;
  margin-left: 4px;
}

.delivery-schedule-cell {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 12px;
}
.schedule-line {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.schedule-line.workshop-line {
  color: #b45309;
}
.schedule-line.actual-line {
  color: #1d4ed8;
}
.schedule-title {
  font-weight: 700;
  font-size: 12px;
}
.days-badge {
  font-weight: 600;
}
.arrow-sep {
  color: #94a3b8;
  font-size: 11px;
}
.target-date {
  font-family: monospace;
  font-weight: 600;
  color: #334155;
  background: #f1f5f9;
  padding: 1px 4px;
  border-radius: 3px;
}
.mini-status-tag {
  height: 20px;
  line-height: 18px;
  padding: 0 5px;
  font-size: 11px;
  border-radius: 4px;
  font-weight: 600;
}
.schedule-remark {
  color: #64748b;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
  border-top: 1px dashed #e2e8f0;
  padding-top: 2px;
}
</style>
