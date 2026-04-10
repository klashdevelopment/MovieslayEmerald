"use client";
import { CSSProperties } from "react";
import { useRouter } from "next/navigation";

export default function PHM_Exclusive() {
    return (
        <>
            <div style={{
                height: '100vh',
                width: '100vw',
                background: 'rgba(10, 10, 15, 1)',
                color: 'white'
            }}>
                <h1 style={{
                    fontSize: '3rem',
                    textAlign: 'center',
                    paddingTop: '2rem'
                }}>Project Hail Mary [HD]</h1>
                <p style={{
                    fontSize: '1.5rem',
                    textAlign: 'center',
                    padding: '1rem',
                    maxWidth: '600px',
                    margin: '0 auto'
                }}>
                    Our Project Hail Mary exclusive combines the best audio and video we could find.
                    You'll need to access the source directly to view the media, and please give it up to a minute to load.
                    <br/>
                    <a href="http://n1.eclipsesystems.org:25043/" style={{ color: 'lightblue' }} target="_blank">Open in New Tab</a>
                </p>
                <p style={{
                    fontSize: '1rem',
                    textAlign: 'center',
                    padding: '1rem',
                    maxWidth: '600px',
                    margin: '0 auto',
                    color: 'gray',
                    marginTop: '2rem'
                }}>
                    (We couldn't display the media directly on the page due to technical limitations - being unable to get an SSL certificate to display the 'http' page on this 'https' page. The linked site is completely safe to visit, extremely lightweight (no javascript), and has zero advertisements.)
                </p>
            </div>
        </>
    );
}