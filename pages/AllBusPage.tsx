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
import Typography from '@mui/material/Typography';


export default function AllBusPage() {

    const [windowWidth, setWindowWidth] = useState(0);
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
        setWindowWidth(window.innerWidth);
        setWindowHeight(window.innerHeight);
    };

    const Rows = ({ index, style }: { index: number, style: any }) => (
        <div style={style}>

            <Card sx={{
                // minWidth: 200, 
                bgcolor:
                    (
                        (index % 2) ?
                            'primary.main' : '#90caf9'
                    ),

                color: ((index % 2) ? ('white') : ('black'))
                // , margin: 0.3
            }}>
                <Typography sx={{ padding: 0 }}>
                    <CardActionArea
                        onClick={() => {
                            // setSelectedBus(allBus[index]);
                            setBusSelected(allBus[index]);
                            // alert(allBus[index].route);
                            router.push({
                                pathname: '/BusLineDetailPage',
                            });
                        }}
                        sx={{ fontSize:  fontSizeSelected }}
                    >
                        <CardContent>
                            <div  >
                                公司:{allBus[index].co}
                                ---
                                路線:{allBus[index].route}
                            </div>
                            <div >
                                由: {allBus[index].orig_tc}
                            </div>
                            <div >
                                去: {allBus[index].dest_tc}
                            </div>
                        </CardContent>
                    </CardActionArea>
                </Typography>
            </Card>
        </div>
    )

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
                    <div>巴士路線 {allBus.length} 條</div>

                    <FixedSizeList
                        height={windowHeight * 0.8}
                        itemCount={allBus.length}
                        itemSize={110}
                        width={windowWidth * 0.9}
                    >
                        {Rows}
                    </FixedSizeList>
                </>
                ) : (<>
                    <Box display="flex" sx={{ justifyContent: 'center', padding: 5 }}>
                        <CircularProgress />
                    </Box></>)

            )}
        </>
    )
}

