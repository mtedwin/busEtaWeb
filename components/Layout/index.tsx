import { Container } from "@mui/material";
import { Dispatch, SetStateAction } from "react";
import SearchAppBar from "./AppBar";
import PageFooter from "./Footer";
import { useState } from "react";
import AppDrawer from "./AppDrawer";

export default function GeneralLayout({ children }: { children: any, }) {
    const [isOpened, setOpened] = useState(false);

    const toggleDrawer = () => {
        setOpened((prev) => !prev);
    };

    return (
        <>

            {<AppDrawer isOpened={isOpened} toggleDrawer={toggleDrawer}/>}

            <SearchAppBar toggleDrawer={toggleDrawer} />
            <Container maxWidth="lg">
                {children}
            </Container>
            <PageFooter />
        </>
    );
}