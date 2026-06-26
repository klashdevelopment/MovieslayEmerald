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
        title: "The Oldest View / Project Rolling Giant",
        description: "Originally a web series by Kane Parsons, this short film by Kendrew Lee is a creepy and atmospheric horror story about memory and nostalgia.",
        image: "https://files.catbox.moe/takexb.png",
        link: 'project-rolling-giant',
        id: "project-rolling-giant",
        type: "movie"
    }
];
export default exclusives;