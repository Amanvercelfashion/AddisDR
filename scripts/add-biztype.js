const fs = require('fs');
let d = fs.readFileSync('api/data.json', 'utf-8');
const data = JSON.parse(d);

for (const biz of data.businesses) {
  if (biz.id === 13 || biz.id === 15 || biz.id === 16 || biz.id === 17) {
    biz.business_type = 'product';
  } else {
    biz.business_type = 'service';
  }
}

fs.writeFileSync('api/data.json', JSON.stringify(data, null, 2) + '\n');
console.log('Done');
