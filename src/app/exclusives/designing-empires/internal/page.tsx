"use client";
import { CSSProperties } from "react";
import "./internal.css";
import { useRouter } from "next/navigation";

function select(params: any) {
    const r = useRouter();
    return (
        <div key={params.id} className="select" style={{
            width: '230px',
            background: '#121218',
            textAlign: 'center',
            padding: '5px 1.2rem',
            borderRadius: '0.4rem',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
        } as CSSProperties} onClick={()=>{
            r.push('https://youtube.com/embed/' + params.id);
        }}>{params.name}</div>
    )
}

export default function DE_Exclusive() {
    return (
        <>
            <div style={{
                height: '100vh',
                width: '100vw',
                background: '#020204',
            }}>
                <div style={{
                    display: 'flex',
                    padding: '1rem',
                    alignItems: 'safe center',
                    justifyContent: 'safe center',
                    flexDirection: 'column',
                    gap: '0.45rem',
                    height: '100vh',
                    overflowY: 'auto'
                }}>
                    <b>Designing Empires</b>
                    {[
                        { name: 'Episode 1', id: 'lLQdJ59U53o' },
                        { name: 'Episode 2', id: 'Z6ghrasjLY0' },
                        { name: 'Episode 3', id: 'LWIYwtLsVEk' },
                        { name: 'Episode 4', id: 'naatRZFzlrI' },
                        { name: 'Episode 5', id: 'BWDEw5ng-BY' },
                        { name: 'Episode 6', id: 'KR2Qm5oR3FY' },
                        { name: 'Episode 7', id: 'Pi9vNv3GQT0' },
                        { name: 'Episode 8', id: 'Rrlp_PHyyjE' },
                        { name: 'Episode 9', id: 'lDmmaI6hCq4' }
                    ].map(item => select(item))}
                </div>
            </div>
        </>
    );
}