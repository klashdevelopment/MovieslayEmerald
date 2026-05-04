import { Tooltip } from "@mui/joy";
import React from "react";
import sources from "./Sources";

export default function Controls({
    fullscreen,
    setFullscreen,
    source=null,
    setSource=null,
    isMovie,
    nextEpisode=()=>{},
    lastEpisode=()=>{},
    onCustomServerChange=null,
    customServerNumber=0,
}: {
    fullscreen: boolean;
    setFullscreen: any;
    source?: (keyof typeof sources)|null;
    setSource?: any|null;
    isMovie: boolean;
    nextEpisode?: any;
    lastEpisode?: any;
    onCustomServerChange?: ((amount: number) => void)|null;
    customServerNumber?: string|number;
}) {
    return <>
        <button className="server" onClick={() => {
            setFullscreen(!fullscreen);
        }}>
            <i className="fa-solid fa-expand"></i>
            <div className="hide-on-mobile">Expand</div>
            <div className="hide-on-desktop">Big</div>
        </button>
        {isMovie ? null : <div className="server light">
            <div className="server-split">
                <div className="ss-item left-corners" onClick={lastEpisode}>
                    <i className="fa-solid fa-backward"></i>
                </div>
                <div className="ss-item right-corners" onClick={nextEpisode}>
                    <i className="fa-solid fa-forward"></i>
                </div>
            </div>
        </div>}
        {onCustomServerChange && (
            <div className="server light">
                <div className="server-split">
                    <div className="ss-item left-corners" onClick={()=>{
                        onCustomServerChange(-1);
                    }}>
                        <i className="fa-solid fa-backward"></i>
                    </div>
                    <div className="ss-item not-button" style={{ width: '100%' }}>
                        {customServerNumber}
                    </div>
                    <div className="ss-item right-corners" onClick={()=>{
                        onCustomServerChange(1);
                    }}>
                        <i className="fa-solid fa-forward"></i>
                    </div>
                </div>
            </div>
        )}
        {(source && setSource) && (
            <div className="server light">
                <div className="server-split">
                    {Object.keys(sources).slice(0, 4).map((key, i) => (
                        <Tooltip key={key} title={sources[key].tooltip} className={`ss-item ${key==='movieslay' && 'movieslaysource'}
                            ${i===3 && 'right-corners'}
                            ${i===0 && 'left-corners'} ${source == key && 'active'}`} onClick={() => {
                            setSource(key);
                        }}>
                            {key!=='movieslay' ? <i className={`fa-solid fa-dice-${['one', 'two', 'three', 'four'][i]}`}></i> :
                                <i>
                                    <img src="/assets/source_icon.png" style={{width:'25px',height:'25px',margin:'0 auto'}} />
                                </i>
                            }
                        </Tooltip>
                        // <Tooltip title="2Embed (Third best)" className={`ss-item ${source == '2embed' && 'active'}`} onClick={() => {
                        //     setSource('2embed');
                        // }}>
                        //     <i className="fa-solid fa-dice-two"></i>
                        // </Tooltip>
                        // <Tooltip title="Smashy (Bad popups)" className={`ss-item ${source == 'smashy' && 'active'}`} onClick={() => {
                        //     setSource('smashy');
                        // }}>
                        //     <i className="fa-solid fa-dice-three"></i>
                        // </Tooltip>
                        // <Tooltip title="VSrc2 (Reccomended)" className={`ss-item right-corners ${source == 'vsrc2' && 'active'}`} onClick={() => {
                        //     setSource('vsrc2');
                        // }}>
                        //     <i className="fa-solid fa-dice-four"></i>
                        // </Tooltip>
                    ))}
                </div>
            </div>
        )}
    </>;
}