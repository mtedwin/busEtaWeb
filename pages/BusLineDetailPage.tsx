import { useState, useEffect, useRef, useCallback } from "react";
import styles from '../styles/BusDetailPage.module.css'
import GeneralLayout from '../components/Layout';
import { useBusSelectedStore } from '../stores/bus-select-store';
import AxiosClass from "../components/Axios";
import { RouteAllStop } from '../components/TypeCollection';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import Typography from '@mui/material/Typography';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { format } from "date-fns";
import { useFontSelectedStore } from '../stores/font-size-store';
import { StopInfo } from "../components/TypeCollection"


const Axios = new AxiosClass();

export default function BusLineDetailPage() {

    const [thisBusAllStop, setThisBusAllStop] = useState<RouteAllStop[] | undefined>([]);
    const [bound, setInOrOut] = useState('O');
    const [eta, setEta] = useState<string[]>([]);
    const [expanded, setExpanded] = useState<string | false>(false);
    const { fontSizeSelected } = useFontSelectedStore();
    const interval = useRef<NodeJS.Timer>();
    const [eta1, setEta1] = useState<string>('');
    const [eta2, setEta2] = useState<string>('');


    const {
        busSelected: busSelected,
        setBusSelected: setBusSelected,
        clearBusSelected: clearBusSelected,
    } = useBusSelectedStore()

    const handleChange =
        (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
            setExpanded(isExpanded ? panel : false);
        };

    // localStorage based bookmarks
    const getBookmarksFromStorage = () => {
        try {
            if (typeof window === 'undefined') return [];
            const raw = localStorage.getItem('addFavour') || '[]';
            const parsed: StopInfo[] = JSON.parse(raw);
            return parsed;
        } catch (error) {
            console.error("Error reading bookmarks from localStorage", error);
            return [];
        }
    };

    const setBookmarksInStorage = (bookmarks: StopInfo[]) => {
        try {
            if (typeof window === 'undefined') return;
            const raw = JSON.stringify(bookmarks || []);
            localStorage.setItem('addFavour', raw);
            window.dispatchEvent(new CustomEvent('bookmarks-updated', { detail: { count: (bookmarks || []).length } }));
            console.debug('Bookmarks saved to localStorage:', (bookmarks || []).length);
        } catch (error) {
            console.error("Error saving bookmarks to localStorage", error);
        }
    };

    async function processInOrOut() {
        if (bound === 'I') {
            setInOrOut('O')
        } else { setInOrOut("I") }
    }

    async function _KmbFetchETA(stopId: string, route: string, service_type: string) {

        var tempArr :any[] | undefined= [];
        var timeArr = [];

        const response = await Axios.KmbCheckETA(stopId, route, service_type);
        
        if (response !== undefined){
            tempArr = response;
        }

        // format times and filter empty/null
        if (tempArr && tempArr.length > 0) {
            for (var i = 0; i < tempArr.length; i++) {
                if (!tempArr[i]) continue;
                try {
                    var getTheTime = new Date(tempArr[i]);
                    if (!isNaN(getTheTime.getTime())) {
                        var getTime = format(getTheTime, "HH:mm");
                        timeArr.push(getTime);
                    }
                } catch (ex) {
                    // skip invalid
                }
            }
        }

        setEta(timeArr);
        setEta1(timeArr[0] || '');
        setEta2(timeArr[1] || '');

        // If one or both ETA missing, try CTB then NWFB to fill gaps
        if (!timeArr[0] || !timeArr[1]) {
            try {
                const alt1 = await Axios.NwCtbCheckETA('CTB', stopId, route, bound);
                if (alt1 && alt1.length > 0) {
                    const merged = [...timeArr, ...alt1].filter(Boolean).slice(0,2);
                    setEta(merged);
                    setEta1(merged[0] || '');
                    setEta2(merged[1] || '');
                }
            } catch (e) {}
            if ((!timeArr[0] || !timeArr[1])) {
                try {
                    const alt2 = await Axios.NwCtbCheckETA('NWFB', stopId, route, bound);
                    if (alt2 && alt2.length > 0) {
                        const merged = [...timeArr, ...alt2].filter(Boolean).slice(0,2);
                        setEta(merged);
                        setEta1(merged[0] || '');
                        setEta2(merged[1] || '');
                    }
                } catch (e) {}
            }
        }

    }

    async function KmbFetchETA(stopId: string, route: string, service_type: string) {
        try {

            clearInterval(interval.current);

            var tempArr :any[] | undefined= [];
            var timeArr = [];

            const response = await Axios.KmbCheckETA(stopId, route, service_type);

            if (response !== undefined){
                tempArr = response;
            }

            // tempArr = response?.data.data;

            //   console.log(tempArr)

            if (tempArr.length > 0) {
                for (var i = 0; i < tempArr.length; i++) {
                    var getTheTime = new Date(tempArr[i]);
                    var getTime = format(getTheTime, "HH:mm");
                    timeArr.push(getTime);
                }
            }

            setEta(timeArr);
            setEta1(timeArr[0] || '');
            setEta2(timeArr[1] || '');

            // fallback if missing
            if (!timeArr[0] || !timeArr[1]) {
                try {
                    const alt1 = await Axios.NwCtbCheckETA('CTB', stopId, route, bound);
                    if (alt1 && alt1.length > 0) {
                        const merged = [...timeArr, ...alt1].filter(Boolean).slice(0,2);
                        setEta(merged);
                        setEta1(merged[0] || '');
                        setEta2(merged[1] || '');
                    }
                } catch (e) {}
                if (!timeArr[0] || !timeArr[1]) {
                    try {
                        const alt2 = await Axios.NwCtbCheckETA('NWFB', stopId, route, bound);
                        if (alt2 && alt2.length > 0) {
                            const merged = [...timeArr, ...alt2].filter(Boolean).slice(0,2);
                            setEta(merged);
                            setEta1(merged[0] || '');
                            setEta2(merged[1] || '');
                        }
                    } catch (e) {}
                }
            }

            interval.current = setInterval(() => _KmbFetchETA(stopId, route, service_type), 10000);

        } catch (error) {
            console.log(error);
        }
    }

    async function _NwCtbCheckETA(CompanyId: string, StopId: string, route: string, bound: string) {

        var tempArr :any[] | undefined= [];
        var timeArr = [];

        const response = await Axios.NwCtbCheckETA(CompanyId, StopId, route, bound);

        if (response !== undefined){
            tempArr = response;
        }

        if (tempArr && tempArr.length > 0) {
            for (var i = 0; i < tempArr.length; i++) {
                if (!tempArr[i]) continue;
                try {
                    var getTheTime = new Date(tempArr[i]);
                    if (!isNaN(getTheTime.getTime())) {
                        var getTime = format(getTheTime, "HH:mm");
                        timeArr.push(getTime);
                    }
                } catch (ex) {
                    // skip
                }
            }
        }

        setEta(timeArr);
        setEta1(timeArr[0] || '');
        setEta2(timeArr[1] || '');

        // If missing, try other companies (other CTB/NWFB then KMB)
        if (!timeArr[0] || !timeArr[1]) {
            try {
                const other = (CompanyId === 'CTB') ? 'NWFB' : 'CTB';
                const alt = await Axios.NwCtbCheckETA(other, StopId, route, bound);
                if (alt && alt.length > 0) {
                    const merged = [...timeArr, ...alt].filter(Boolean).slice(0,2);
                    setEta(merged);
                    setEta1(merged[0] || '');
                    setEta2(merged[1] || '');
                }
            } catch (e) {}
        }
    }

    async function CtbNwFetchETA(CompanyId: string, StopId: string, route: string, bound: string) {
        try {

            // let intervalHandle: NodeJS.Timeout ;

            clearInterval(interval.current);

            var tempArr :any[] | undefined= [];
            var timeArr = [];

            const response = await Axios.NwCtbCheckETA(CompanyId, StopId, route, bound);

            if (response !== undefined){
                tempArr = response;
            }

            if (tempArr.length > 0) {
                for (var i = 0; i < tempArr.length; i++) {
                    var getTheTime = new Date(tempArr[i]);
                    var getTime = format(getTheTime, "HH:mm");
                    timeArr.push(getTime);
                }
            }

            setEta(timeArr);
            setEta1(timeArr[0] || '');
            setEta2(timeArr[1] || '');

            // fallback attempt if missing
            if (!timeArr[0] || !timeArr[1]) {
                try {
                    const other = (CompanyId === 'CTB') ? 'NWFB' : 'CTB';
                    const alt = await Axios.NwCtbCheckETA(other, StopId, route, bound);
                    if (alt && alt.length > 0) {
                        const merged = [...timeArr, ...alt].filter(Boolean).slice(0,2);
                        setEta(merged);
                        setEta1(merged[0] || '');
                        setEta2(merged[1] || '');
                    }
                } catch (e) {}
            }

            interval.current = setInterval(() => _NwCtbCheckETA(CompanyId, StopId, route, bound), 10000);

        } catch (error) {
            console.log(error);
        }
    }

    async function handleAddFavor(stop: string, stopName: string, route: string, co: string, service_type: string) {

        // Use localStorage helpers instead of cookies
        try {
            const favorList: StopInfo[] = getBookmarksFromStorage();
            const existingList: StopInfo[] = Array.isArray(favorList) ? favorList : [];

            // check exact duplicate by stopid + route + company
            const isDuplicate = existingList.some((thisdata: StopInfo) =>
                thisdata.stopid === stop && thisdata.route === route && thisdata.co === co
            );

            if (isDuplicate) {
                console.log('add favor fail - duplicate');
            } else {
                const newFavorList = [
                    ...existingList,
                    {
                        stopid: stop,
                        stopName: stopName,
                        route: route,
                        co: co,
                        service_type: service_type,
                        bound: bound,
                    } as StopInfo,
                ];

                setBookmarksInStorage(newFavorList);
                console.log('add favor successful');
            }
        } catch (e) {
            console.error('Failed to add favor', e);
        }

    }

    const fetchData = useCallback(async () => {
        try {

            setThisBusAllStop([]);

            var resultData: any[] = [];

            // console.log(busSelected);

            // Try reading pre-seeded route details from public/routeDetails.json
            try {
                const resp = await fetch('/routeDetails.json');
                if (resp.ok) {
                    const allDetails = await resp.json();
                    if (busSelected.co === 'KMB') {
                        const key = `KMB_${busSelected.route}_${busSelected.bound}_${busSelected.service_type}`;
                        if (allDetails[key]) {
                            setThisBusAllStop(allDetails[key]);
                            return;
                        }
                    } else {
                        const keyO = `${busSelected.co}_${busSelected.route}_O`;
                        const keyI = `${busSelected.co}_${busSelected.route}_I`;
                        // prefer the matching bound
                        const pickKey = (busSelected.bound === 'I') ? keyI : keyO;
                        if (allDetails[pickKey]) {
                            setThisBusAllStop(allDetails[pickKey]);
                            return;
                        }
                    }
                }
            } catch (e) {
                // ignore and fallback to Axios
            }

            // if (busSelected.co === 'CTB' || busSelected.co === 'NWFB') {
            //     const response = await Axios.NwCtbOneBusAllRoute(
            //         busSelected.co,
            //         busSelected.route,
            //         bound,
            //     );
            //     //   console.log(response.data.data[0].orig_en);
            //     // resultData = response;
            //     setThisBusAllStop(response);
            // }
            // else if (busSelected.co === 'KMB') {
            //     const response = await Axios.KmbOneBusAllRoute(
            //         busSelected.route,
            //         busSelected.bound,
            //         busSelected.service_type,
            //     );
            //     //   console.log(response.data.data[0].orig_en);
            //     // resultData = response;
            //     setThisBusAllStop(response);
            //     // console.log(resultData);
            // }

        } catch (error) {
            console.log(error);
        }
    }, [busSelected]);

    useEffect(() => {
        fetchData();
        return () => {
            clearInterval(interval.current);
        };
    }, [bound, fetchData]);

    return (
        <GeneralLayout >

            {(busSelected.co === undefined)?(<>請選擇一條想查詢的巴士路線</>):(
            (thisBusAllStop?.length ? (
                <><div>
                    <Box display="flex" sx={{ padding: 0.5, justifyContent: 'space-between' }}>
                        <div>
                            <div >{busSelected.co}  {busSelected.route} 號 巴士</div>
                            <div >{busSelected.orig_tc} -- {busSelected.dest_tc}</div>
                        </div>

                        {(busSelected.co === 'KMB') ? (<></>) :
                            (<Button variant="contained"
                                onClick={() => {
                                    processInOrOut()
                                }}

                            >頭尾站轉換</Button>)}
                    </Box>
                </div>
                </>
            ) : (<>
                <Box display="flex" sx={{ justifyContent: 'center', padding: 5 }}>
                    <CircularProgress />
                </Box>
            </>)))}

            {(busSelected.co === undefined)?(<></>):(
            (thisBusAllStop?.length ? (
                // <div className={styles.center}>{thisBusAllStop[1].stopName}</div>

                thisBusAllStop.map(function (value) {

                    return (
                        <Accordion key={value.seq}
                            sx={{ backgroundColor: '#525ec4', color: 'white' }}
                            expanded={expanded === value.seq} onChange={handleChange(value.seq)}
                            onClick={() => {
                                // alert(value.stop);
                                {
                                    setEta([]);
                                    busSelected.co === 'KMB' ? (KmbFetchETA(value.stop, value.route, value.service_type)) : (
                                        CtbNwFetchETA(busSelected.co, value.stop, value.route, bound))
                                }
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                            >
                                <Typography component="div" sx={{ fontSize: fontSizeSelected }}>{value.seq}.{value.stopName}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography component="div" sx={{ fontSize: fontSizeSelected }}>
                                    {eta?.length ? (<>
                                        <Box display="flex" sx={{ padding: 0.3, justifyContent: 'space-between' }}>
                                            <div><Button
                                                variant="contained"
                                                sx={{ padding: 2 , ml: 1 }}
                                                // onClick={console.log('pressed')}
                                                onClick={() => {
                                                    handleAddFavor(value.stop, value.stopName, value.route, busSelected.co, value.service_type)
                                                }}
                                            >加到常用列表</Button></div>
                                            <div style={{ padding: 2 , marginLeft: 8 }}>{eta[0]}</div>
                                            <div style={{ padding: 2 , marginLeft: 8 }}>{eta[1]}</div>
                                        </Box>
                                    </>
                                    ) : (<>
                                        <Button
                                            variant="contained"
                                            onClick={() => {
                                                handleAddFavor(value.stop, value.stopName, value.route, busSelected.co, value.service_type)
                                            }}
                                        >加到常用列表</Button>
                                    </>)}
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    )
                })) : (<></>)))}

        </GeneralLayout>
    )
}