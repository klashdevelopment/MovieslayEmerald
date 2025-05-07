"use client";
import { useRouter } from "next/navigation";
import PageLayout from "../../../components/PageLayout";
import { sports } from "../../Sports";
import { useEffect, useState } from "react";

interface SportParams {
    params: Promise<{ id: string }>;
}

export default function SportsMatches({ params }: SportParams) {
    const [sport, setSport] = useState<{name: string, id: string} | null>(null);
    const [matches, setMatches] = useState<any[]>([]);

    useEffect(() => {
        params.then(({id}) => {
            const sport = sportFromId(id);
            if (sport) {
                setSport(sport);
                fetch(`https://streamed.su/api/matches/${sport.id}`)
                    .then((res) => res.json())
                    .then((data) => {
                        setMatches(data);
                        console.log(data);
                    });
            } else {
                console.error("Sport not found");
            }
        });
    }, [params]);

    const router = useRouter();

    function sportFromId(id: string) {
        const sport = sports.find((sport) => sport.id === id);
        return sport || null;
    }
    function Item({ name, id, image, full=false }: { name: string; id: string; image: string, full?: boolean }) {
        return (
            <div onClick={()=>{
                if(!full) {
                    router.push(`/sports/${sport?.id}/${id}`);
                }
            }} className={!full ? 'hover-game' : ''} style={{width: '100%', height: `${full ? '200px' : '125px'}`, border: '1px solid #32383e', padding: '4px', marginTop:'10px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <img src={image} style={{
                    height: '100%',
                    borderRadius: '8px',
                    border: '1px solid #32383e'
                }} />
                <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '24px',
                    textAlign: 'center',
                }}>{name}</div>
            </div>
        )
    }
    function formatPoster(poster: string) {
        if(!poster) return `/sport/${sport?.id||'other'}.webp`;
        if(poster.startsWith('/')) {
            return `https://streamed.su${poster}`;
        } else {
            return poster;
        }
    }
    return (
        <PageLayout title={`${sport?.name} - Movieslay`}>
            <Item full name={sport?.name || 'Loading'} id={sport?.id || ''} image={`/sport/${sport?.id||'other'}.webp`} />
            {matches.map((match, index) => (
                <Item key={index} name={match.title} id={match.id} image={formatPoster(match.poster)} /> 
            ))}
        </PageLayout>
    );
}