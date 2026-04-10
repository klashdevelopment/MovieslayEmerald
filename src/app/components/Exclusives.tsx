import { desc } from "framer-motion/client";

export interface Exclusive {
    title: string;
    description: string;
    image: string;
    link: string;
    id: string;
    type: string;
}

const exclusives: Exclusive[] = [
    {
        title: "Designing Empires",
        description: "A ragtag team of designers, engineers and middle managers attempts to save their account, and their lives, with the biggest pitch of their lives: a total galactic re-brand.",
        image: "https://m.media-amazon.com/images/M/MV5BNGMwMmU1NjAtZTc4NS00ZTdlLWEzNWQtMWQ3MjRhNjQ4N2M5XkEyXkFqcGc@._V1_FMjpg_UY720_.jpg",
        link: 'designing-empires',
        id: "designing-empires",
        type: "series"
    },
    {
        title: "Nirvanna: The Band - the Show - the Movie",
        description: "Matt and Jay's plan to book a show at the Rivoli goes horribly wrong, resulting in them accidentally travelling back to the year 2008.",
        image: "https://www.themoviedb.org/t/p/w1280/rmaQL7IFFXeeU33ztEN0z5ucHDy.jpg",
        link: 'nirvanna-tb-ts-tm',
        id: "nirvanna-tb-ts-tm",
        type: "movie"
    },
    {
        title: "Project Hail Mary [HD]",
        description: "Ryland Grace wakes up alone on a spaceship, with no memory of how he got there. As his memories slowly return, he realizes he's on a mission to save humanity from an extinction-level threat. This exclusive combines the best audio and best video we could find - please give the media up to a minute to load.",
        image: "https://image.tmdb.org/t/p/w600_and_h900_face/huVzcVrlK8aiLd240ienleODvWl.jpg",
        link: 'phm-hd',
        id: "phm-hd",
        type: "movie"
    }
];
export default exclusives;