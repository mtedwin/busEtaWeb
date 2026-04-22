import axios from "axios";
// Make axios requests appear more like a browser to reduce blocking when running in Node.
// Browsers forbid setting certain headers (like `User-Agent`), so set them only server-side.
const isNode = typeof window === 'undefined';
if (isNode) {
  axios.defaults.headers.common['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  axios.defaults.headers.common['Accept'] = 'application/json, text/plain, */*';
} else {
  // In browser, setting Accept is allowed and may help; avoid unsafe headers.
  axios.defaults.headers.common['Accept'] = 'application/json, text/plain, */*';
}
// data.json moved to `public/data.json` for runtime updates.
// Provide a runtime loader: on server use fs, on client use fetch.
let jsonData: any[] = [];
const loadLocalData = async () => {
  if (typeof window === 'undefined') {
    // server-side: read from file system
    try {
      const fs = require('fs');
      const path = require('path');
      const p = path.join(process.cwd(), 'public', 'data.json');
      if (fs.existsSync(p)) {
        jsonData = JSON.parse(fs.readFileSync(p, 'utf8'));
      } else {
        jsonData = [];
      }
    } catch (e) {
      jsonData = [];
    }
  } else {
    // client-side: fetch the public asset
    try {
      const resp = await fetch('/data.json');
      if (resp.ok) jsonData = await resp.json();
      else jsonData = [];
    } catch (e) {
      jsonData = [];
    }
  }
};

// pre-load on module init (server) so server-side callers have data available
if (typeof window === 'undefined') {
  loadLocalData();
}

const BASE_URL = "https://data.etabus.gov.hk/v1/transport/";
const BASE_URL_NWCTB ="https://rt.data.gov.hk/v2/transport/";

export default class AxiosClass {

  async GetAllRoute(){
    const response = await fetch(
    "https://rt.data.gov.hk/v2/transport/citybus/route/CTB/"
  );
  const data = await response.json();


  const response2 = await fetch(
    "https://data.etabus.gov.hk/v1/transport/kmb/route/"
  );
  const data2 = await response2.json();

  var dataArray = data.data
  const dataArray2 = data2.data

  for(var i = 0; i < dataArray2.length; i++){
    const checkStopName = "KMB"
    dataArray2[i].co =  checkStopName;
    // console.log(tempArr[i].stop)
  }

  dataArray = dataArray.concat(dataArray2)

  return dataArray;
  }

  async KmbOneBusAllRoute(route:string,bound:string,service_type:string) {
    let tempArr = [];
    try {
      if (bound === "O"){bound = 'outbound'};
      if (bound ==="I"){bound = 'inbound'};
      const thisURL = "kmb/route-stop/" + route + "/" + bound + "/" + service_type 
      const res = await axios.get(BASE_URL + thisURL);
      tempArr = await res.data.data;

      for(var i = 0; i < tempArr.length; i++){
        // if jsonData hasn't been loaded yet on client, try to load synchronously via fetch
        if ((!jsonData || jsonData.length === 0) && typeof window !== 'undefined') {
          try { await loadLocalData(); } catch (e) { /* ignore */ }
        }
        var checkStopName = await this.KmbFindBusStopName(tempArr[i].stop)
        tempArr[i].stopName =  checkStopName;
        // console.log(tempArr[i].stop)
      }
     
      // console.log(tempArr);

      if ("status" in res) {
        if (res.status === 200) {
          // console.log(res);
          return tempArr;
        }
      }
    } catch (error:any) {
      console.log(error.response);
      console.log(error.response.status);
      if (error.response.status === 401) {
      }
    }
  }

  async KmbFindBusStopName(busStopId:string) {
    try {
      const res = await axios.get(BASE_URL + "kmb/stop/" + busStopId);
      if ("status" in res) {
        if (res.status === 200) {
          // console.log(res);
          return res.data.data.name_tc;
        }
      }
    } catch (error:any) {
      console.log(error.response);
      console.log(error.response.status);
      if (error.response.status === 401) {
      }
    }
  }

  async KmbCheckETA(busStopId:string,route:string,service_type:string){
    try {
      const res = await axios.get(BASE_URL + "kmb/eta/" + busStopId + "/" + route + "/" + service_type);
      if ("status" in res) {
        if (res.status === 200) {

          // console.log(res)

          var returnArr = [];
          var tempArr = res.data.data
          for(var i = 0; i < tempArr.length; i++){
            if (tempArr[i].eta !== null && tempArr[i].eta !== ""){
              returnArr.push(tempArr[i].eta)
            } 
          }

          // console.log(returnArr)

          return returnArr;
        }
      }
    } catch (error:any) {
      console.log(error.response);
      console.log(error.response.status);
      if (error.response.status === 401) {
      }
    }
  }

  async NwCtbOneBusAllRoute(company:string,route:string,bound:string) {

    type LocalJson = {
      stopid:string,
      stopName:string,
  }

    var tempArr: any[] = [];
    var localData = [];

    try {
      if (bound === "O"){bound = 'outbound'};
      if (bound ==="I"){bound = 'inbound'};
      const thisURL = "citybus/route-stop/" + company + "/" + route + "/" + bound 
      const res = await axios.get(BASE_URL_NWCTB + thisURL);
      tempArr = await res.data.data;

      localData = jsonData

      // console.log(localData);

      for(var i = 0; i < tempArr.length; i++){
        // try to find matching stopName in local jsonData first (defensive -> jsonData may contain mixed entries)
        let afterSortingStopName = (jsonData as any[]).filter((thisdata:any) => {
          return thisdata && thisdata.stopid && String(thisdata.stopid).includes(String(tempArr[i].stop));
        });

        if (afterSortingStopName && afterSortingStopName.length > 0 && afterSortingStopName[0].stopName) {
          tempArr[i].stopName = afterSortingStopName[0].stopName;
        } else {
          // fallback to API lookup for stop name if local mapping not found
          try {
            const checkStopName = await this.NwCtbFindBusStopName(tempArr[i].stop);
            tempArr[i].stopName = checkStopName || '';
          } catch (e) {
            tempArr[i].stopName = '';
          }
        }
      }
     
      // console.log(tempArr);

      if ("status" in res) {
        if (res.status === 200) {
          // console.log(res);
          return tempArr;
        }
      }
    } catch (error:any) {
      console.log(error.response);
      console.log(error.response.status);
      if (error.response.status === 401) {
      }
    }
  }

  async NwCtbFindBusStopName(busStopId:string) {
    try {
      const res = await axios.get(BASE_URL_NWCTB + "citybus/stop/" + busStopId);
      if ("status" in res) {
        if (res.status === 200) {
          // console.log(res);
          return res.data.data.name_tc;
        }
      }
    } catch (error:any) {
      // console.log(error.response);
      // console.log(error.response.status);
      if (error.response.status === 401) {
      }
    }
  }

  async NwCtbCheckETA(companyId:string,stopId:string,route:string, bound:string){
    try {
      const res = await axios.get(BASE_URL_NWCTB + "citybus/eta/" + companyId + "/" + stopId + "/" + route);
      if ("status" in res) {
        if (res.status === 200) {
          // console.log(res);
          var returnArr = [];

          var tempArr = res.data.data
          for(var i = 0; i < tempArr.length; i++){
            if (tempArr[i].dir === bound && tempArr[i].eta !== ""){
              returnArr.push(tempArr[i].eta)
            }
          }
          return returnArr;
        }
      }
    } catch (error:any) {
      console.log(error.response);
      console.log(error.response.status);
      if (error.response.status === 401) {
      }
    }
  }
}
