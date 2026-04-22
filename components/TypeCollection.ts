export type BusInfo = {
    route: string;
    co: string;
    orig_en: string;
    orig_tc: string;
    orig_sc: string;
    dest_en: string;
    dest_tc: string;
    dest_sc: string;
    bound: string;
    service_type:string;
    // inOrOut:string;
}

export type RouteAllStop = {
    bound: string,
    route: string,
    seq: string,
    service_type: string,
    stop: string,
    stopName:string,
}

export type LocalJson = {
    stopid:string,
    stopName:string,
}

export type StopInfo = {
    id:string,
    stopid:string,
    stopName:string,
    route: string;
    co: string;
    service_type:string;
    bound:string;
    ETD1:string;
    ETD2:string;
}

export type ETDtype = {
    ETD1: string;
    ETD2: string;
  }