const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Browser-like headers
axios.defaults.headers.common['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
axios.defaults.headers.common['Accept'] = 'application/json, text/plain, */*';

const BASE_URL = 'https://data.etabus.gov.hk/v1/transport/';
const BASE_URL_NWCTB = 'https://rt.data.gov.hk/v2/transport/';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchWithRetry(url, retries = 3, backoff = 200) {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.get(url, { timeout: 10000 });
    } catch (e) {
      const status = e && e.response && e.response.status;
      // If 403, apply extended exponential backoff and more retries
      if (status === 403) {
        const extraRetries = 5;
        for (let k = 0; k < extraRetries; k++) {
          const wait = Math.pow(2, k) * 1000; // 1s,2s,4s,8s...
          await sleep(wait);
          try {
            return await axios.get(url, { timeout: 10000 });
          } catch (e2) {
            if (k === extraRetries - 1) throw e2;
            continue;
          }
        }
      }
      if (i === retries - 1) throw e;
      await sleep(backoff * (i + 1));
    }
  }
}

async function main() {
  const dataPath = path.join(__dirname, '..', 'public', 'data.json');
  const raw = fs.readFileSync(dataPath, 'utf8');
  const routes = JSON.parse(raw);

  const seenKeys = new Set();
  for (const r of routes) {
    if (r.co === 'KMB') {
      const key = `KMB_${r.route}_${r.bound || 'O'}_${r.service_type || ''}`;
      seenKeys.add(key);
    } else {
      seenKeys.add(`${r.co}_${r.route}_O`);
      seenKeys.add(`${r.co}_${r.route}_I`);
    }
  }

  const outFile = path.join(__dirname, '..', 'public', 'routeDetails.json');
  const tempOutFile = path.join(__dirname, '..', 'public', 'routeDetails.json.tmp');
  
  // Always fetch all keys, ignoring any existing file content.
  const keys = Array.from(seenKeys);
  const allRouteDetails = {}; // Store new results in a fresh object.
  console.log('Total keys to seed:', keys.length);

  const concurrency = Math.min(8, Math.max(2, Math.floor(require('os').cpus().length)));

  const queue = keys.slice();
  let pauseUntil = 0; // timestamp in ms; workers wait if Date.now()<pauseUntil

  function getNextKey() {
    return queue.shift();
  }

  async function worker() {
    while (true) {
      // global pause check
      if (Date.now() < pauseUntil) {
        await sleep(pauseUntil - Date.now());
      }

      const key = getNextKey();
      if (!key) return;
      try {
        if (key.startsWith('KMB_')) {
          const parts = key.split('_');
          const route = parts[1];
          const bound = parts[2] || 'O';
          const service_type = parts[3] || '';
          const boundWord = bound === 'O' ? 'outbound' : 'inbound';
          const url = `${BASE_URL}kmb/route-stop/${route}/${boundWord}/${service_type}`;
          const res = await fetchWithRetry(url, 3);
          let tempArr = (res.data && res.data.data) || [];
          for (let j = 0; j < tempArr.length; j++) {
            try {
              const sid = tempArr[j].stop;
              const sres = await fetchWithRetry(`${BASE_URL}kmb/stop/${sid}`, 2);
              tempArr[j].stopName = (sres.data && sres.data.data && sres.data.data.name_tc) || '';
            } catch (e) {
              tempArr[j].stopName = '';
            }
          }
          allRouteDetails[key] = tempArr;
        } else {
          const parts = key.split('_');
          const co = parts[0];
          const route = parts[1];
          const bound = parts[2] || 'O';
          const boundWord = bound === 'O' ? 'outbound' : 'inbound';
          const url = `${BASE_URL_NWCTB}citybus/route-stop/${co}/${route}/${boundWord}`;
          const res = await fetchWithRetry(url, 3);
          let tempArr = (res.data && res.data.data) || [];
          for (let j = 0; j < tempArr.length; j++) {
            const stopid = tempArr[j].stop;
            const found = routes.find(s => s.stopid && s.stopid.includes(stopid));
            if (found && found.stopName) {
              tempArr[j].stopName = found.stopName;
            } else {
              try {
                const sres = await fetchWithRetry(`${BASE_URL_NWCTB}citybus/stop/${stopid}`, 2);
                tempArr[j].stopName = (sres.data && sres.data.data && sres.data.data.name_tc) || '';
              } catch (e) {
                tempArr[j].stopName = '';
              }
            }
          }
          allRouteDetails[key] = tempArr;
        }
      } catch (err) {
        const status = err && err.response && err.response.status;
        console.error('Error seeding', key, err.message || err);
        if (status === 403) {
          console.log('403 detected — pausing all workers for 60s and requeuing', key);
          pauseUntil = Date.now() + 60000;
          queue.push(key);
        } else {
          queue.push(key);
        }
      }

      // Periodically save progress to the temp file
      if (Object.keys(allRouteDetails).length % 20 === 0) {
        try { 
          fs.writeFileSync(tempOutFile, JSON.stringify(allRouteDetails, null, 2), 'utf8'); 
          console.log(`Progress: ${Object.keys(allRouteDetails).length} / ${keys.length} keys seeded.`);
        } catch (e) { 
          console.error("Error writing to temp file:", e);
        }
      }
    }
  }

  const workers = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);

  // Final write and atomic rename
  console.log('All workers finished. Writing final data...');
  fs.writeFileSync(tempOutFile, JSON.stringify(allRouteDetails, null, 2), 'utf8');
  fs.renameSync(tempOutFile, outFile);

  console.log('Seeding complete; wrote', Object.keys(allRouteDetails).length, 'keys to', outFile);
}

main().catch(e => console.error(e));
