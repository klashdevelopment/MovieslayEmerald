import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
    // these are user profiles for a letterboxd-like profile page but for funsies the default will be as if mando had a page
    return NextResponse.json({
        name: "Mando",
        username: "themandalorian",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRj9oZABpyDm_6h3LvzdMys-2lzNpK2466dBw&s",
        bio: "Just a guy trying to find his way in the galaxy. Private contractor for the new republic.",
        sections: [
            {
                title: "I'm in these",
                items: [{type: 'tv', id: '82856', name: 'The Mandalorian'}, {type: 'movie', id: '11', name: 'Star Wars'}, {type: 'movie', id: '1228710', name: 'The Mandolorian and Grogu'}]
            }
        ],
        style: {
            backgroundColor: "#000000",
            textColor: "#FFFFFF",
            accentColor: "#FF0000"
        }
    });
}