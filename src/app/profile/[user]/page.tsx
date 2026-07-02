"use client";
import PageLayout from '@/app/components/PageLayout';
import { TMDBMovie } from '@/app/movie/page';
import { TMDBShow } from '@/app/series/page';
import { Sheet } from '@mui/joy';
import { useRouter } from 'next/navigation';
import { Fragment, useEffect, useState } from 'react';

interface ProfileProps {
    params: Promise<{ user: string }>;
}

type SectionItem = { type: 'tv' | 'movie'; id: string; name: string } | TMDBMovie | TMDBShow;

interface Section {
    title: string;
    items: SectionItem[];
}

export default function ProfilePage({ params }: ProfileProps) {
    const [profileData, setProfileData] = useState<any>(null);
    const [collections, setCollections] = useState<Section[]>([]);

    useEffect(() => {
        async function fetchProfile() {
            const { user } = await params;
            try {
                const response = await fetch(`/api/profiles/get-profile?username=${user}`);
                if (!response.ok) throw new Error(`Error fetching profile: ${response.statusText}`);
                const data = await response.json();

                setProfileData(data);
                setCollections(data.sections);

                const itemsToFetch = data.sections.flatMap((section: any) => section.items);
                const detailsResponse = await fetch(`/api/get-movies?type=multiple`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ entries: itemsToFetch }),
                });
                if (!detailsResponse.ok) throw new Error(`Error fetching item details: ${detailsResponse.statusText}`);
                const detailsData = await detailsResponse.json();

                setCollections(data.sections.map((section: any) => ({
                    ...section,
                    items: section.items.map((item: any) => {
                        const detail = detailsData.find((d: any) => d.id.toString() === item.id);
                        return detail ? { ...detail, ...item } : item;
                    }),
                })));
            } catch (error) {
                console.error(error);
            }
        }
        fetchProfile();
    }, [params]);

    if (!profileData) return <div>Loading...</div>;

    const router = useRouter();
    function goTo(id: number, type: string) {
        router.push(`/${type.replaceAll('tv', 'series')}/${id}`);
    }

    function getNameOrTitle(item: SectionItem) {
        if ('title' in item) return item.title;
        if ('name' in item) return item.name;
        return '';
    }

    return (
        <PageLayout title={`${profileData.name}'s Profile`}>
            <Sheet variant={'plain'} sx={{ height: '20%', overflow: 'hidden', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <img src={profileData.image} alt={`${profileData.name}'s profile picture`} style={{ borderRadius: '50%', width: '100px', height: '100px', marginRight: '20px' }} />
                    <div>
                        <b>{profileData.name}</b>
                        <p>@{profileData.username}</p>
                    </div>
                </div>
            </Sheet>
            <div className="full-w" style={{ height: '20px' }}></div>
            <div className="flex-align-flex-col list-list">
                <p>{profileData.bio}</p>
                {collections.map((section: any, index: number) => <Fragment key={section.id}>
                    <b>{section.title}</b>
                    <div className="flex gap-1 movie-list">
                        {section.items.map((item: any) => (
                            <div key={item.id} className={`movie-card`} onClick={() => { goTo(item.id, item.media_type) }}>
                                <img src={!item.poster_path ? '/assets/placeholder.png' : `https://image.tmdb.org/t/p/w342${item.poster_path}`} alt={getNameOrTitle(item)} />
                                <span>{getNameOrTitle(item)}</span>
                            </div>
                        ))}
                    </div>
                </Fragment>)}
            </div>
        </PageLayout>
    );
}