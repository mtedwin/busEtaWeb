import GeneralLayout from "../components/Layout";
import { StopInfo } from "../components/TypeCollection";
import AxiosClass from "../components/Axios";
import { format } from "date-fns";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import Typography from '@mui/material/Typography';
import AccordionDetails from '@mui/material/AccordionDetails';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useBusSelectedStore } from '../stores/bus-select-store';
import { useRouter } from "next/router";
import { useFontSelectedStore } from "../stores/font-size-store";

// Helper functions for localStorage
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
        // dispatch a custom event so other tabs/components can react
        window.dispatchEvent(new CustomEvent('bookmarks-updated', { detail: { count: bookmarks.length } }));
        console.debug('Bookmarks saved to localStorage:', bookmarks.length);
    } catch (error) {
        console.error("Error saving bookmarks to localStorage", error);
    }
};

export default function BookmarkPage() {

    const Axios = useMemo(() => new AxiosClass(), []);
    const { fontSizeSelected } = useFontSelectedStore();
    const [favorList, setFavorList] = useState<StopInfo[]>([]);
    const interval = useRef<NodeJS.Timer>();
    const [expanded, setExpanded] = useState<string | false>(false);
    const router = useRouter();

    const {
        setBusSelected: setBusSelected,
    } = useBusSelectedStore()

    const handleChange =
        (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
            setExpanded(isExpanded ? panel : false);
        };

    const CtbNwFetchETA = useCallback(async (CompanyId: string, StopId: string, route: string, bound: string) => {
        try {
            var tempArr: any[] | undefined = [];
            var timeArr = [];
            const response = await Axios.NwCtbCheckETA(CompanyId, StopId, route, bound);
            if (response !== undefined) {
                tempArr = response;
            }
            if (tempArr.length > 0) {
                for (var i = 0; i < tempArr.length; i++) {
                    var getTheTime = new Date(tempArr[i]);
                    var getTime = format(getTheTime, "HH:mm");
                    timeArr.push(getTime);
                }
            }
            return timeArr
        } catch (error) {
            console.log(error);
        }
    }, [Axios]);

    const KmbFetchETA = useCallback(async (StopId: string, route: string, service_type: string) => {
        try {
            var tempArr: any[] | undefined = [];
            var timeArr = [];
            const response = await Axios.KmbCheckETA(StopId, route, service_type);
            if (response !== undefined) {
                tempArr = response;
            }
            if (tempArr.length > 0) {
                for (var i = 0; i < tempArr.length; i++) {
                    var getTheTime = new Date(tempArr[i]);
                    var getTime = format(getTheTime, "HH:mm");
                    timeArr.push(getTime);
                }
            }
            return timeArr
        } catch (error) {
            console.log(error);
        }
    }, [Axios]);

    async function handleDeleteFavor(stopid: string, route: string, co: string) {
        const currentBookmarks: StopInfo[] = getBookmarksFromStorage();
        const filtered = currentBookmarks.filter((item: StopInfo) => !(item.stopid === stopid && item.route === route && item.co === co));

        if (filtered && filtered.length > 0) {
            const normalized = filtered.map((it: StopInfo, idx: number) => ({
                ...it,
                id: it.id || `${it.co || 'UNK'}_${it.route || 'UNK'}_${it.stopid || idx}_${idx}`
            }));
            setBookmarksInStorage(normalized);
            setFavorList(normalized);
        } else {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('addFavour');
            }
            setFavorList([]);
        }
    }

    function moveItem(oldIndex: number, newIndex: number) {
        const list: StopInfo[] = getBookmarksFromStorage();
        if (oldIndex < 0 || oldIndex >= list.length || newIndex < 0 || newIndex >= list.length) return;
        const item = list.splice(oldIndex, 1)[0];
        list.splice(newIndex, 0, item);
        const normalized = list.map((it: StopInfo, idx: number) => ({ ...it, id: it.id || `${it.co || 'UNK'}_${it.route || 'UNK'}_${it.stopid || idx}_${idx}` }));
        setBookmarksInStorage(normalized);
        setFavorList(normalized);
    }

    async function goToBusLineDetail(busLine: StopInfo) {
        const tempBusLine = {
            route: busLine.route,
            co: busLine.co,
            orig_en: "",
            orig_tc: "",
            orig_sc: "",
            dest_en: "",
            dest_tc: "",
            dest_sc: "",
            bound: busLine.bound,
            service_type: busLine.service_type,
        }

        setBusSelected(tempBusLine)

        router.push({
            pathname: '/BusLineDetailPage',
        });

    }

    const setBookmarkDataToState = useCallback(async () => {
        const thisfavorList: StopInfo[] = getBookmarksFromStorage();
        const normalized = thisfavorList.map((it: StopInfo, idx: number) => ({
            ...it,
            id: it.id || `${it.co || 'UNK'}_${it.route || 'UNK'}_${it.stopid || idx}_${idx}`
        }));
        setFavorList(normalized);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            await setBookmarkDataToState();
            const sourceList = getBookmarksFromStorage();
            var tempArr: any[] = []

            for (var i = 0; i < sourceList.length; i++) {
                const item: StopInfo = sourceList[i];
                const id = item?.id || `${item?.co || 'UNK'}_${item?.route || 'UNK'}_${item?.stopid || i}_${i}`;

                let ETA: string[] | undefined = undefined;
                if (item?.co === 'CTB' || item?.co === 'NWFB') {
                    ETA = await CtbNwFetchETA(item.co, item.stopid, item.route, item.bound)
                } else {
                    ETA = await KmbFetchETA(item.stopid, item.route, item.service_type)
                }

                tempArr.push({
                    id,
                    stopid: item.stopid,
                    stopName: item.stopName,
                    route: item.route,
                    co: item.co,
                    services_type: item.service_type,
                    bound: item.bound,
                    ETD1: ETA ? ETA[0] : undefined,
                    ETD2: ETA ? ETA[1] : undefined,
                })
            }
            setFavorList(tempArr);
        } catch (error) {
            console.log(error);
        }
    }, [CtbNwFetchETA, KmbFetchETA, setBookmarkDataToState]);

    useEffect(() => {
        fetchData();
        interval.current = setInterval(() => {
            fetchData();
        }, 10000);
        return () => {
            if (interval.current) clearInterval(interval.current);
        };
    }, [fetchData]);

    // Listen for custom event and storage changes so UI stays in sync across components/tabs
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleBookmarksUpdated = () => {
            console.debug('Received bookmarks-updated event, refreshing state');
            setBookmarkDataToState();
        };

        const handleStorageEvent = (e: StorageEvent) => {
            if (e.key === 'addFavour') {
                console.debug('Storage event for addFavour detected, refreshing state');
                setBookmarkDataToState();
            }
        };

        window.addEventListener('bookmarks-updated', handleBookmarksUpdated as EventListener);
        window.addEventListener('storage', handleStorageEvent as EventListener);

        return () => {
            window.removeEventListener('bookmarks-updated', handleBookmarksUpdated as EventListener);
            window.removeEventListener('storage', handleStorageEvent as EventListener);
        };
    }, [setBookmarkDataToState]);

    return (<>
        <GeneralLayout >
            <Box padding={0}>
                <>我的最愛</>
                {favorList?.length ? (
                    favorList.map(function (value) {
                        return (<><Accordion key={value.id}
                            sx={{ backgroundColor: '#52aec4', color: 'white' }}
                            expanded={expanded === value.id} onChange={handleChange(value.id)}
                            onClick={() => {
                                // alert(value.stop);
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                            >
                                <Typography component="div" sx={{ fontSize: fontSizeSelected }}>
                                    <Box>{value.co} {value.route} {value.stopName}</Box>
                                    <Box sx={{ color: '#e3df0b' }}>到站時間 {value.ETD1} {value.ETD2}</Box>
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography component={"div"} sx={{ fontSize: fontSizeSelected }}>
                                    <Box display="flex" sx={{ padding: 0.3, justifyContent: 'space-between' }}>

                                        <Button
                                            sx={{ padding: 2 }}
                                            variant="contained"
                                            onClick={() => {
                                                handleDeleteFavor(value.stopid, value.route, value.co)
                                            }}
                                        >刪除我的最愛</Button>

                                        <Button
                                            variant="contained"
                                            sx={{ padding: 2, ml: 1 }}
                                            onClick={() => {
                                                const idx = favorList.findIndex(f => f.id === value.id);
                                                if (idx > 0) moveItem(idx, idx - 1);
                                            }}
                                        >上移</Button>
                                        <Button
                                            variant="contained"
                                            sx={{ padding: 2, ml: 1 }}
                                            onClick={() => {
                                                const idx = favorList.findIndex(f => f.id === value.id);
                                                if (idx >= 0 && idx < favorList.length - 1) moveItem(idx, idx + 1);
                                            }}
                                        >下移</Button>
                                    </Box>
                                </Typography>
                            </AccordionDetails>
                        </Accordion></>

                        )
                    }
                    )) : (<></>)}
            </Box>
        </GeneralLayout>
    </>)
}
