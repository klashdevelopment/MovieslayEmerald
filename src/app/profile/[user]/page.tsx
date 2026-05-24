"use client";
import PageLayout from '@/app/components/PageLayout';
import { TMDBMovie } from '@/app/movie/page';
import { TMDBShow } from '@/app/series/page';
import { useEffect, useState } from 'react';

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

    return (
        <PageLayout title={`${profileData.name}'s Profile`}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <img src={profileData.image} alt={`${profileData.name}'s profile picture`} style={{ borderRadius: '50%', width: '100px', height: '100px', marginRight: '20px' }} />
                <div>
                    <b>{profileData.name}</b>
                    <p>@{profileData.username}</p>
                </div>
            </div>
            <p>{profileData.bio}</p>
            {collections.map((section: any, index: number) => (
                <div key={index} style={{ marginTop: '30px' }}>
                    <h2>{section.title}</h2>
                    <ul>
                        {section.items.map((item: any, idx: number) => (
                            <li key={idx}>{item.title || item.name} ({item.type})</li>
                        ))}
                    </ul>
                </div>
            ))}
        </PageLayout>
    );
}