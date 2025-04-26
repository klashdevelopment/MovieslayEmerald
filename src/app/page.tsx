import { CssVarsProvider, Sheet } from "@mui/joy";
import Image from "next/image";
import PageLayout, { useIsDesktop } from "./components/PageLayout";
import { BackgroundBeams } from "./components/aceternity/BackgroundBeams";
import Homecontent from "./home/content";

export default function Home() {
    return (
        <PageLayout>
            <BackgroundBeams />
            <div className="flex flex-col align justify full-w h-[100%] m5-[5%] gap-05">
                <Homecontent />
            </div>
        </PageLayout>
    );
}
