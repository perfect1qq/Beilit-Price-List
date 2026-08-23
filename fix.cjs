const fs = require('fs');
const path = require('path');
const file = path.join('src/components/customer/Customer360Drawer.vue');
let content = fs.readFileSync(file, 'utf8');

// Replace finance table
const financeOld =               <el-table :data="customer.orders || []" border style="width: 100%" stripe>
                <el-table-column prop="orderName" label="账单/订单名称" min-width="150">
                  <template #default="{ row }">
                    <span style="font-weight: bold;">{{ row.orderName }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="orderAmount" label="账单总额(元)" width="130" align="center">
                  <template #default="{ row }">￥ {{ Number(row.orderAmount || 0).toLocaleString() }}</template>
                </el-table-column>
                <el-table-column prop="paidAmount" label="已收金额(元)" width="130" align="center">
                  <template #default="{ row }">￥ {{ Number(row.paidAmount || 0).toLocaleString() }}</template>
                </el-table-column>
                <el-table-column label="当前欠款(元)" width="130" align="center">
                  <template #default="{ row }">
                    <strong style="color: #f56c6c;">￥ {{ Math.max(0, (row.orderAmount || 0) - (row.paidAmount || 0)).toLocaleString() }}</strong>
                  </template>
                </el-table-column>
                <el-table-column prop="paymentStatus" label="结款状态" width="120" align="center">
                  <template #default="scope">
                    <el-tag :type="getPaymentStatusInfo(scope.row).type">
                      {{ getPaymentStatusInfo(scope.row).label }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="120" align="center">
                  <template #default="scope">
                    <AppButton variant="edit" link size="small" label="登记回款" @click="openFinanceEditDialog(scope.row)" />
                  </template>
                </el-table-column>
              </el-table>;

const financeNew =               <el-table :data="customer.orders || []" border style="width: 100%" stripe>
                <AutoFitColumn :data="customer.orders || []" prop="orderName" label="账单/订单名称" :min="150" :max="400">
                  <template #default="{ row }">
                    <span style="font-weight: bold;">{{ row.orderName }}</span>
                  </template>
                </AutoFitColumn>
                <AutoFitColumn :data="customer.orders || []" prop="orderAmount" label="账单总额(元)" :min="130" :max="200" align="center">
                  <template #default="{ row }">￥ {{ Number(row.orderAmount || 0).toLocaleString() }}</template>
                </AutoFitColumn>
                <AutoFitColumn :data="customer.orders || []" prop="paidAmount" label="已收金额(元)" :min="130" :max="200" align="center">
                  <template #default="{ row }">￥ {{ Number(row.paidAmount || 0).toLocaleString() }}</template>
                </AutoFitColumn>
                <AutoFitColumn :data="customer.orders || []" label="当前欠款(元)" :min="130" :max="200" align="center">
                  <template #default="{ row }">
                    <strong style="color: #f56c6c;">￥ {{ Math.max(0, (row.orderAmount || 0) - (row.paidAmount || 0)).toLocaleString() }}</strong>
                  </template>
                </AutoFitColumn>
                <AutoFitColumn :data="customer.orders || []" prop="paymentStatus" label="结款状态" :min="120" :max="180" align="center">
                  <template #default="scope">
                    <el-tag :type="getPaymentStatusInfo(scope.row).type">
                      {{ getPaymentStatusInfo(scope.row).label }}
                    </el-tag>
                  </template>
                </AutoFitColumn>
                <el-table-column label="操作" min-width="160" align="center">
                  <template #default="scope">
                    <ActionButtons
                      :actions="[
                        { key: 'edit', variant: 'edit', label: '登记回款', onClick: () => openFinanceEditDialog(scope.row) },
                        { key: 'delete', variant: 'delete', label: '删除', onClick: () => handleDeleteFinance(scope.row) }
                      ]"
                    />
                  </template>
                </el-table-column>
              </el-table>;

content = content.replace(financeOld, financeNew);
if (content === fs.readFileSync(file, 'utf8')) {
  console.log("finance replace failed!");
} else {
  console.log("finance replace success");
}

// Ensure ActionButtons is imported
if (!content.includes('import ActionButtons')) {
  content = content.replace(
    import AppButton from '@/components/common/AppButton.vue',
    import AppButton from '@/components/common/AppButton.vue'\nimport ActionButtons from '@/components/common/ActionButtons.vue'
  );
}

// Replace script end to include handleDeleteFinance
const scriptOld =   }
</script>;

const scriptNew =   }

  const handleDeleteFinance = async (row: any) => {
    try {
      await ElMessageBox.confirm('确定要删除这条账单记录吗？', '提示', { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' })
      await customerApi.deleteOrder(row.id)
      ElMessage.success('账单删除成功')
      emit('data-changed')
    } catch (e: any) {
      if (e !== 'cancel') {
        ElMessage.error(e.response?.data?.message || e.message || '删除失败')
      }
    }
  }
</script>;

if (!content.includes('handleDeleteFinance')) {
  content = content.replace(scriptOld, scriptNew);
}

fs.writeFileSync(file, content, 'utf8');
