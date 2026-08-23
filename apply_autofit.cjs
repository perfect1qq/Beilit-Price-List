const fs = require('fs');
const path = require('path');
const file = path.join('d:\\work\\Beilit-Price-List\\src\\components\\customer\\Customer360Drawer.vue');
let content = fs.readFileSync(file, 'utf8');

// Add import
if (!content.includes('AutoFitColumn')) {
  content = content.replace(
    import AppButton from '@/components/common/AppButton.vue',
    import AppButton from '@/components/common/AppButton.vue'\nimport AutoFitColumn from '@/components/common/AutoFitColumn.vue'
  );
}

// Finance Table
const financeTableStart = content.indexOf('<el-table :data="customer.orders || []"');
const financeTableEnd = content.indexOf('</el-table>', financeTableStart);
let financeTable = content.substring(financeTableStart, financeTableEnd);

financeTable = financeTable.replace(
  <el-table-column prop="orderName" label="账单/订单名称" min-width="150">,
  <AutoFitColumn :data="customer.orders || []" prop="orderName" label="账单/订单名称" :min="150">
).replace(
  </el-table-column>,
  </AutoFitColumn>
).replace(
  <el-table-column prop="orderAmount" label="账单总额(元)" width="130" align="center">,
  <AutoFitColumn :data="customer.orders || []" prop="orderAmount" label="账单总额(元)" :min="130" align="center">
).replace(
  </el-table-column>,
  </AutoFitColumn>
).replace(
  <el-table-column prop="paidAmount" label="已收金额(元)" width="130" align="center">,
  <AutoFitColumn :data="customer.orders || []" prop="paidAmount" label="已收金额(元)" :min="130" align="center">
).replace(
  </el-table-column>,
  </AutoFitColumn>
).replace(
  <el-table-column label="当前欠款(元)" width="130" align="center">,
  <AutoFitColumn :data="customer.orders || []" label="当前欠款(元)" :min="130" align="center">
).replace(
  </el-table-column>,
  </AutoFitColumn>
).replace(
  <el-table-column prop="paymentStatus" label="结款状态" width="120" align="center">,
  <AutoFitColumn :data="customer.orders || []" prop="paymentStatus" label="结款状态" :min="120" align="center">
).replace(
  </el-table-column>,
  </AutoFitColumn>
);

// We keep the last column as el-table-column with min-width="160" so it takes remaining space, or maybe we just leave it as is.
// Actually, if we want it to NOT take remaining space, we should make sure the LAST column has min-width, or just let AutoFitColumn's min-widths distribute proportionally.

content = content.substring(0, financeTableStart) + financeTable + content.substring(financeTableEnd);
fs.writeFileSync(file, content, 'utf8');
