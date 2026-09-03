const fs = require('fs');
let code = fs.readFileSync('src/views/CustomerManagement.vue', 'utf8');

// Replace button text and method
code = code.replace(/<AppButton @click="handleViewArrears" plain type="warning">.*?<\/AppButton>/, '<AppButton @click="handleViewYearlyOrders" plain type="warning">查看所有订单</AppButton>');

// Replace dialog content
code = code.replace(/<el-dialog v-model="arrearsDialogVisible".*?<\/el-dialog>/s, \<el-dialog v-model="yearlyDialogVisible" title="年度订单统计" width="800px">
      <el-table :data="yearlyList" v-loading="yearlyLoading" border stripe>
        <el-table-column prop="year" label="年份" align="center" min-width="100" />
        <el-table-column prop="orderCount" label="合作订单数" align="center" min-width="120" />
        <el-table-column prop="totalOrderAmount" label="年度总金额" align="center" min-width="150">
          <template #default="{ row }">
            ￥ {{ Number(row.totalOrderAmount || 0).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalPaidAmount" label="已收金额" align="center" min-width="150">
          <template #default="{ row }">
            ￥ {{ Number(row.totalPaidAmount || 0).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalArrears" label="欠款金额" align="center" min-width="150">
          <template #default="{ row }">
            <span :style="{ color: row.totalArrears > 0 ? '#f56c6c' : '#67c23a' }">
              ￥ {{ Number(row.totalArrears || 0).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top: 15px; text-align: right; font-weight: bold; font-size: 16px;">
        总欠款合计：<span style="color: #f56c6c;">￥ {{ totalArrearsAmount }}</span>
      </div>
    </el-dialog>\);

// Replace variables and methods
code = code.replace('const arrearsDialogVisible = ref(false);', 'const yearlyDialogVisible = ref(false);');
code = code.replace('const arrearsLoading = ref(false);', 'const yearlyLoading = ref(false);');
code = code.replace('const arrearsList = ref<any[]>([]);', 'const yearlyList = ref<any[]>([]);');

code = code.replace(/const totalArrearsAmount = computed\(\(\) => \{[\s\S]*?\}\);/, \const totalArrearsAmount = computed(() => {
  return yearlyList.value.reduce((sum, item) => sum + (Number(item.totalArrears) || 0), 0).toFixed(2);
});\);

code = code.replace(/const handleViewArrears = async \(\) => \{[\s\S]*?\}\);/s, \const handleViewYearlyOrders = async () => {
  yearlyDialogVisible.value = true;
  yearlyLoading.value = true;
  try {
    const customerApi = (await import("@/api/customer")).default;
    const res = await customerApi.getYearlyOrderStats();
    yearlyList.value = res || [];
  } catch (err) {
    showError(err, "加载年度订单统计失败");
  } finally {
    yearlyLoading.value = false;
  }
};\);

// Also need to remove the arrearsParams and arrearsTotal because they are unused now
code = code.replace(/const arrearsParams = reactive\(\{\s*page: 1,\s*pageSize: 20\s*\}\);\s*const arrearsTotal = ref\(0\);/, '');

fs.writeFileSync('src/views/CustomerManagement.vue', code, 'utf8');
