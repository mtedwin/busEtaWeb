import { useFontSelectedStore } from "../stores/font-size-store"
import GeneralLayout from '../components/Layout';
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import { useCookies } from "react-cookie";
import { useEffect } from "react";

export default function SettingPage() {

    const { fontSizeSelected: fontSizeSelected, setFontSize: setFontSize } = useFontSelectedStore();

    const [cookie, setCookie] = useCookies(["fontSize"])

    useEffect(() => {
        // On initial load, set the font size from the cookie into the store
        if (cookie.fontSize) {
            setFontSize(Number(cookie.fontSize));
        }
    }, []); // Empty dependency array ensures this runs only once

    function handleFontChange (event:any, newValue: number | number[]) {
        const newSize = Array.isArray(newValue) ? newValue[0] : newValue;
        setFontSize(newSize);
        setCookie("fontSize", newSize);
    }


    return (<>
        <GeneralLayout >

            <Box padding={2}>
            <div>字體大小 </div>   
            </Box>

            <Box padding={2}>
                <Slider 
                value={fontSizeSelected}
                aria-label="Default" 
                valueLabelDisplay="auto" 
                min={20}
                max={30}
                onChange={handleFontChange}
                />
            </Box>

            <Box padding={2}>
                版本 2.3
            </Box>

        </GeneralLayout>

    </>)
}