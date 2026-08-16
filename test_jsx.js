const fs = require('fs');
const babel = require('@babel/core');

const code = fs.readFileSync('C:\\Users\\bhush\\OneDrive\\Desktop\\de\\Debattlex-client\\src\\Components\\Dashboard\\Dash.jsx', 'utf-8');

try {
  babel.transformSync(code, {
    presets: ['@babel/preset-react'],
    filename: 'Dash.jsx'
  });
  console.log('✅ Babel parsed successfully');
} catch (e) {
  console.error(e.message);
  console.error(e.codeFrame);
}
