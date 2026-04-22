const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function fetchAndSave() {
  try {
    const urls = [
    //   'https://rt.data.gov.hk/v2/transport/citybus/route/CTB/',
      'https://data.etabus.gov.hk/v1/transport/kmb/route/'
    ];

    const responses = await Promise.all(urls.map(u => axios.get(u)));
    const datas = responses.map(r => r.data || {});

    // const dataCTB = (datas[0] && datas[0].data) || [];
    const dataKMB = (datas[0] && datas[0].data) || [];

    // add `co` company code to entries so other scripts can detect provider
    const annotatedKMB = dataKMB.map(it => ({ ...it, co: 'KMB' }));
    // const annotatedCTB = dataCTB.map(it => ({ ...it, co: 'CTB' }));

    // const dataArray = annotatedCTB.concat(annotatedKMB);
    const dataArray = annotatedKMB;

    const outPath = path.join(__dirname, '..', 'public', 'data.json');
    const tempPath = path.join(__dirname, '..', 'public', 'data.json.tmp');
    fs.writeFileSync(tempPath, JSON.stringify(dataArray, null, 2), 'utf8');
    // atomic replace
    fs.renameSync(tempPath, outPath);
    console.log('Saved', dataArray.length, 'routes to', outPath);
  } catch (err) {
    console.error('Seed failed:', err.message || err);
    process.exit(1);
  }
}

fetchAndSave();
