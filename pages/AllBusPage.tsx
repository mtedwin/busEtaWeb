import styles from '../styles/AllBusPage.module.css'
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { FixedSizeList } from 'react-window';
import { CardActionArea } from '@mui/material'
import { useState, useEffect } from "react";
import { BusInfo } from '../components/TypeCollection';
import { useRouter } from "next/router";
import { useStore } from '../stores/bus-search-store';
import { useBusSelectedStore } from '../stores/bus-select-store';
import { useFontSelectedStore } from '../stores/font-size-store';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/system/Box';


export default function AllBusPage() {

    const [windowHeight, setWindowHeight] = useState(0);
    const [allBus, setAllBus] = useState<BusInfo[]>([]);
    const [showNoSearchResult, setShowNoSearchResult] = useState<boolean>(false);
    const router = useRouter();
    const { fontSizeSelected: fontSizeSelected } = useFontSelectedStore();
    const { setSearchText: setSearchText, clearSearch: clearSearch, searchText: searchText } = useStore()

    const {
        busSelected: busSelected,
        setBusSelected: setBusSelected,
        clearBusSelected: clearBusSelected,
    } = useBusSelectedStore()

    let resizeWindow = () => {
        setWindowHeight(window.innerHeight);
    };

    const Rows = ({ index, style }: { index: number, style: React.CSSProperties }) => {
        const bus = allBus[index];

        return (
            <div className={styles.row} style={style}>
                <Card className={styles.card} elevation={0}>
                    <CardActionArea
                        className={styles.cardAction}
                        onClick={() => {
                            setBusSelected(bus);
                            router.push({ pathname: '/BusLineDetailPage' });
                        }}
                        sx={{ fontSize: fontSizeSelected }}
                    >
                        <CardContent className={styles.cardContent}>
                            <div className={styles.routeHeader}>
                                <span className={styles.company}>{bus.co}</span>
                                <span className={styles.route}>{bus.route}</span>
                            </div>
                            <div className={styles.locations}>
                                <span><span className={styles.label}>由</span>{bus.orig_tc}</span>
                                <span><span className={styles.label}>往</span>{bus.dest_tc}</span>
                            </div>
                        </CardContent>
                    </CardActionArea>
                </Card>
            </div>
        );
    }

    async function fetchData(thissearchText: string) {
        try {
            setShowNoSearchResult(false);
            var resultData = [];
            var afterSearchData = [];

            const response = await fetch('/data.json');
            resultData = await response.json();

            if (thissearchText === undefined) {
                setAllBus(resultData);
            } else {
                afterSearchData = await resultData.filter((thisdata: BusInfo) =>
                    thisdata.route.includes(thissearchText))

                if (afterSearchData.length > 0) {
                    setAllBus(afterSearchData);
                } else{setShowNoSearchResult(true)}
            }

        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        fetchData(searchText)
        resizeWindow();
        window.addEventListener("resize", resizeWindow)
        return () => window.removeEventListener("resize", resizeWindow)
    }, [searchText]);


    return (
        <>
            {showNoSearchResult ? (
                <Box display="flex" sx={{ justifyContent: 'center', padding: 5 }}>
                    沒有找到巴士線路
                </Box>
            ) : (
                allBus.length ? (<>
                    <section className={styles.page}>
                        <div className={styles.heading}>
                            <h1>巴士路線</h1>
                            <span className={styles.count}>{allBus.length} 條</span>
                        </div>
                        <FixedSizeList
                            className={styles.list}
                            height={Math.max(windowHeight * 0.78, 240)}
                            itemCount={allBus.length}
                            itemSize={112}
                            width="100%"
                        >
                            {Rows}
                        </FixedSizeList>
                    </section>
                </>
                ) : (<>
                    <Box display="flex" sx={{ justifyContent: 'center', padding: 5 }}>
                        <CircularProgress />
                    </Box></>)

            )}
        </>
    )
}
