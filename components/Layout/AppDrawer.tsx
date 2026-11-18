import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import Link from "next/link";
import { useStore } from "../../stores/bus-search-store";

export default function AppDrawer({ isOpened, toggleDrawer }: { isOpened: any, toggleDrawer: any }) {
    
    const { clearSearch } = useStore();

    return (

        <Drawer open={isOpened} onClose={toggleDrawer}
            PaperProps={{
                sx: {
                    backgroundColor: "#497cb3",
                    // height: '50%',
                    width: '50%',
                    color: 'white',
                    // textAlign: 'center',
                }
            }}
        >
            <Box sx={{ padding: 2 }}  >
                列表
            </Box>
            <Divider sx={{ borderBottomWidth: 5, bgcolor: "#adb1c7" }} />
            <Box sx={{ padding: 0.5 }}  >

                <ul>
                    <li onClick={clearSearch}> <Link href="/">主頁</Link></li>
                    <li> <Link href="/BusLineDetailPage">巴士詳情</Link></li>
                    <li><Link href="/BookmarkPage">我的最愛</Link> </li>
                    <li><Link href="/Setting">設定</Link> </li>


                </ul>
            </Box>
        </Drawer>

    )
}