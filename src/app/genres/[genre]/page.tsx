"use client";

import PageLayout from "@/app/components/PageLayout";
import { Button, Sheet } from "@mui/joy";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";


interface GenrePageProps {
    params: Promise<{ genre: string }>;
}

export default function GenrePage({ params }: GenrePageProps) {
    const [genreData, setGenreData] = useState<any>(null);
    const [allGenres, setAllGenres] = useState<any[]>([]);

    const [genre, setGenre] = useState<string>("");
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        params.then(({ genre }) => {
            setGenre(genre);
            let URL = `discover-genre`;
            if (genre.split('-')[0] === 'tv') {
                URL = `discover-tv-genre`;
            }
            fetch(`/api/get-movies?type=${URL}&genreId=${genre.split('-')[1]}&page=1`).then(res => res.json()).then(data => {
                if (data.success === false) {
                    setFailed(true);
                    return;
                }
                setGenreData(data);
            }).catch(() => setFailed(true));

            let GenresURL = `genres`;
            if (genre.split('-')[0] === 'tv') {
                GenresURL = `genres-tv`;
            }
            fetch(`/api/get-movies?type=${GenresURL}`).then(res => res.json()).then(data => {
                if (data.success === false) {
                    setFailed(true);
                    return;
                }
                setAllGenres(data.genres);
            }).catch(() => setFailed(true));
        });
    }, [params]);


    const router = useRouter();

    function goTo(id: string | number, type: string) {
        router.push(`/${type}/${id}`);
    }

    if (failed) return <div>Failed to load genre data.</div>;
    if (!genreData) return <div>Loading...</div>;

    return (
        <PageLayout title="Movies">
            <Sheet variant={'plain'} sx={{ height: '30%', overflow: 'hidden', marginTop: '8px' }}>
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: `url("/genres/${allGenres.find(g => g.id === parseInt(genre.split('-')[1]))?.name.split(' & ')[0] || ''}.webp")`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '12px' }}>
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'brightness(0.5) blur(20px)', borderRadius: 'inherit' }}>
                        <h1 className="relative z-10 text-lg md:text-7xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] bg-clip-text text-transparent bg-gradient-to-b from-[#ffffff] to-[#9090ff]  text-center font-sans font-bold">
                            {allGenres.find(g => g.id === parseInt(genre.split('-')[1]))?.name || 'Unknown Genre'}
                        </h1>
                    </div>
                </div>
            </Sheet>

            <div className="full-w" style={{ height: '20px' }}></div>
            <div className="flex-align-flex-col list-list">
                {(() => {
                    const rows: any[] = [];
                    const items = genreData?.results || [];
                    for (let i = 0; i < items.length; i += 2) {
                        rows.push(items.slice(i, i + 2));
                    }
                    return rows.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex gap-1 movie-list" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-around', gap: '100px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
                                {row.map((movie: any) => (
                                    <div key={movie.id} style={{ width: '50%', maxHeight: '300px', gap: '10px' }} className={'mobile-center'}>
                                        <div style={{ flexDirection: 'column' }} className={`movie-card${movie.adult ? ' adult' : ''}`} onClick={() => { goTo(movie.id, movie.title ? 'movie' : 'series') }}>
                                            <img src={!item.poster_path ? '/assets/placeholder.png' : `https://image.tmdb.org/t/p/w342${movie.poster_path}`} alt={movie.title} />
                                            <span>{movie.title || movie.name}</span>
                                        </div>
                                        <div className={"hide-on-mobile"} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', minHeight: 0 }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minHeight: 0, overflow: 'hidden' }}>
                                                <span style={{ fontSize: '12px', color: '#888', flexShrink: 0 }}>{movie.release_date ? movie.release_date.split('-')[0] : (movie.first_air_date ? movie.first_air_date.split('-')[0] : 'N/A')} ({movie.original_language.toUpperCase()})</span>
                                                <span style={{ fontSize: '12px', color: '#888', flexShrink: 0 }}>{allGenres.filter((g: any) => movie.genre_ids.includes(g.id)).map((g: any) => g.name).join(', ')}</span>
                                                <span style={{ position: 'relative', fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', width: '75px', flexShrink: 0 }}>
                                                    <span>
                                                        <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i>
                                                    </span>
                                                    <span style={{ position: 'absolute', left: 0, top: 0, overflow: 'hidden', width: `${(movie.vote_average * 10)}%`, whiteSpace: 'nowrap', color: '#f5c518cc' }}>
                                                        <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i>
                                                    </span>
                                                </span>

                                                <span style={{ fontSize: '12px', color: '#888', flexShrink: 0 }}>{movie.vote_average.toFixed(2)}/10 ({movie.vote_count} votes)</span>

                                                <span style={{ fontSize: '14px', color: '#ccc', minHeight: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{movie.overview}</span>
                                            
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '30px', flexShrink: 0 }}>
                                                <Button variant="outlined" size="sm" onClick={() => { goTo(movie.id, movie.title ? 'movie' : 'series') }} startDecorator={<i className="fas fa-play"></i>} sx={{ fontSize: '12px', width: 'fit-content' }}>
                                                    Watch Now
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ));
                })()}
            </div>
        </PageLayout>
    );
}