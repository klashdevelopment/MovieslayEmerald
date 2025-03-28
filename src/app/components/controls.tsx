export default function Controls({
    fullscreen,
    setFullscreen,
    source,
    setSource,
    isMovie,
    nextEpisode=()=>{},
    lastEpisode=()=>{}
}: {
    fullscreen: boolean;
    setFullscreen: any;
    source: string;
    setSource: any;
    isMovie: boolean;
    nextEpisode?: any;
    lastEpisode?: any;
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
        <div className="server light">
            <div className="server-split">
                <div className={`ss-item left-corners ${source == 'vidsrc' && 'active'}`} onClick={() => {
                    setSource('vidsrc');
                }}>
                    <i className="fa-solid fa-dice-one"></i>
                </div>
                <div className={`ss-item ${source == '2embed' && 'active'}`} onClick={() => {
                    setSource('2embed');
                }}>
                    <i className="fa-solid fa-dice-two"></i>
                </div>
                <div className={`ss-item right-corners ${source == 'smashy' && 'active'}`} onClick={() => {
                    setSource('smashy');
                }}>
                    <i className="fa-solid fa-dice-three"></i>
                </div>
            </div>
        </div>
    </>;
}