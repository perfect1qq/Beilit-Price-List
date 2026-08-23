
const fs = require("fs");
let content = fs.readFileSync("src/views/CustomerManagement.vue", "utf8");

content = content.replace(
  /:class="getRemainingClass\(item\.deliveryDate\s*\)"/g,
  `:` + `class="getRemainingClass(item.deliveryDate, item.installationStatus)"`
);
content = content.replace(
  /\{\{\s*getRemainingText\(item\.deliveryDate\s*\)\s*\}\}/g,
  `{{ getRemainingText(item.deliveryDate, item.installationStatus) }}`
);
content = content.replace(
  /:class="getRemainingClass\(item\.workshopDeliveryDate\s*\)"/g,
  `:` + `class="getRemainingClass(item.workshopDeliveryDate, item.installationStatus)"`
);
content = content.replace(
  /\{\{\s*getRemainingText\(item\.workshopDeliveryDate\s*\)\s*\}\}/g,
  `{{ getRemainingText(item.workshopDeliveryDate, item.installationStatus) }}`
);

content = content.replace(
  /const getRemainingClass = \(dateStr: string\) => \{/,
  `const getRemainingClass = (dateStr: string, installationStatus?: string) => {\n    if (installationStatus === InstallationStatus.INSTALLED) return "text-success";`
);

content = content.replace(
  /const getRemainingText = \(dateStr: string\) => \{/,
  `const getRemainingText = (dateStr: string, installationStatus?: string) => {\n    if (installationStatus === InstallationStatus.INSTALLED) return "ÒÑÍê¹¤";`
);

fs.writeFileSync("src/views/CustomerManagement.vue", content, "utf8");
console.log("Done");

