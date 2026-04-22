import fs from 'fs';
import path from 'path';

export default async function getStaticProps() {
  try {
    const dataPath = path.join(process.cwd(), 'components', 'data.json');
    if (fs.existsSync(dataPath)) {
      const raw = fs.readFileSync(dataPath, 'utf8');
      const dataArray = JSON.parse(raw);
      return {
        props: { allBusInfo: dataArray },
        revalidate: 60 * 60 * 24,
      };
    }
  } catch (err) {
    // fall through to fetch if local read fails
    console.warn('Could not read local data.json, fetching remote data', err);
  }

  // Fallback: fetch remote APIs (same behavior as before)
  const response = await fetch(
    'https://rt.data.gov.hk/v1.1/transport/citybus-nwfb/route/CTB/'
  );
  const data = await response.json();

  const response2 = await fetch(
    'https://rt.data.gov.hk/v1.1/transport/citybus-nwfb/route/NWFB/'
  );
  const data2 = await response2.json();

  const response3 = await fetch('https://data.etabus.gov.hk/v1/transport/kmb/route/');
  const data3 = await response3.json();

  let dataArray = data.data;
  const dataArray2 = data2.data;
  let dataArray3 = data3.data;

  for (let i = 0; i < dataArray3.length; i++) {
    dataArray3[i].co = 'KMB';
  }

  dataArray = dataArray.concat(dataArray2).concat(dataArray3);

  return {
    props: { allBusInfo: dataArray },
    revalidate: 60 * 60 * 24,
  };
}