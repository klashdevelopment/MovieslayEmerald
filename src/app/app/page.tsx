"use client";
import { Button, CssVarsProvider, Sheet } from "@mui/joy";
import Image from "next/image";
import PageLayout from "../components/PageLayout";
import { BackgroundBeams } from "../components/aceternity/BackgroundBeams";
import { SparklesCore } from "../components/aceternity/Sparkles";
import { CardBody, CardItem, CardContainer } from "../components/aceternity/CardItem";
import { useRouter } from "next/navigation";

export default function AppPage() {
    const router = useRouter();
    return (
        <PageLayout>
            <div className="flex flex-col align full-w h-90 gap-05 py-20">
                <h1 className="relative z-10 text-lg md:text-7xl  bg-clip-text text-transparent bg-gradient-to-b from-blue-100 to-indigo-500  text-center font-sans font-bold">
                    Movieslay for Desktop
                </h1>
                <div className={'w-[4px] h-[40px]'}></div>
                <div className="my-0 mb-10 flex flex-row align justify gap-05 mobileCards">
                    <CardContainer>
                        <CardBody className="bg-[url(/img19.jpg)] bg-cover bg-center relative group/card  dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[30rem] h-auto rounded-xl p-6 border  ">
                            <CardItem translateZ="100" className="w-full mt-4">
                                <Image
                                    src="/app_image.png"
                                    height="1000"
                                    width="1000"
                                    className="w-full object-cover group-hover/card:shadow-xl"
                                    alt="thumbnail"
                                />
                            </CardItem>
                        </CardBody>
                    </CardContainer>
                    <CardContainer>
                        <CardBody className="bg-[url(/img23.jpg)] bg-cover bg-center relative group/card  dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[30rem] h-auto rounded-xl p-6 border  ">
                            <CardItem translateZ="100" className="w-full mt-4">
                                <Image
                                    src="/app_image2.png"
                                    height="1000"
                                    width="1000"
                                    className="w-full object-cover group-hover/card:shadow-xl"
                                    alt="thumbnail"
                                />
                            </CardItem>
                        </CardBody>
                    </CardContainer>
                    <CardContainer>
                        <CardBody className="bg-[url(/img26.jpg)] bg-cover bg-center relative group/card  dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[30rem] h-auto rounded-xl p-6 border  ">
                            <CardItem translateZ="100" className="w-full mt-4">
                                <Image
                                    src="/app_image3.png"
                                    height="1000"
                                    width="1000"
                                    className="w-full object-cover group-hover/card:shadow-xl"
                                    alt="thumbnail"
                                />
                            </CardItem>
                        </CardBody>
                    </CardContainer>
                </div>
                <p className="max-w-[1000px]">Movieslay Emerald for Desktop brings a refined experience for viewing your movies and shows from movieslay at ease. With built-in popup prevention, the desktop client ensures a seamless watching experience. Movieslay Desktop also ensures a clean user interface to fit in with movieslay's style and seamless fullscreen and picture in picture integration.</p>

                <div className="flex flex-col gap-1 mt-5 align pb-10">
                    <span className="text-[3rem] font-semibold m-0">Downloads</span>
                    <div className="flex flex-row gap-[4px] mobileButtons">
                        <Button component={"a"} href="/app/movieslay-emerald-desktop.exe" download="movieslay-emerald-desktop.exe" target="_blank" startDecorator={<i className="fa-solid fab fa-windows"></i>}>Windows</Button>
                        <Button component={"a"} href="/app/MEDesktopMac.dmg" download="MEDesktopMac.dmg" target="_blank" startDecorator={<i className="fa-solid fab fa-apple"></i>}>MacOS</Button>
                        <Button onClick={()=>{
                            router.push('/app/ios');
                        }} startDecorator={<i className="fa-solid fab fa-app-store"></i>}>iOS</Button>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
