const fs = require('fs');
let code = fs.readFileSync('src/api/customer.ts', 'utf8');
code = code.replace(
  'const getArrearsList = (params?: { page: number, pageSize: number }) =>\\r\\n  request.get<{ list: any[], total: number, page: number, pageSize: number }>(\\'/api/customers/arrears\\', { params })',
  'const getYearlyOrderStats = () =>\\r\\n  request.get<any[]>(\\'/api/customers/yearly-stats\\')'
);
// fallback for lf vs crlf
code = code.replace(
  /const getArrearsList =.*?\\n.*?\\/api\\/customers\\/arrears.*?\\n/,
  'const getYearlyOrderStats = () =>\\n  request.get<any[]>(\\'/api/customers/yearly-stats\\')\\n'
);

code = code.replace('getArrearsList: unwrap(getArrearsList),', 'getYearlyOrderStats: unwrap(getYearlyOrderStats),');
fs.writeFileSync('src/api/customer.ts', code, 'utf8');
