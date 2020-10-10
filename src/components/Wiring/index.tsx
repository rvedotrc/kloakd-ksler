import * as React from "react";
import {useEffect, useState} from "react";
import {currentExifDbEntries, currentImageDbEntries, currentUser} from "lib/app_context";
import {DBEntry, ExifDBEntry} from "../../types";

declare const firebase: typeof import('firebase');

const Wiring = () => {
    const [user, setUser] = useState<firebase.User | null>();
    useEffect(() => currentUser.observe(setUser), []);

    const [imageMap, setImageMap] = useState<Map<string, DBEntry>>(new Map());
    useEffect(() => currentImageDbEntries.observe(setImageMap), []);

    const [exifMap, setExifMap] = useState<Map<string, ExifDBEntry>>(new Map());
    useEffect(() => currentExifDbEntries.observe(setExifMap), []);

    return <div>

        <h1>currentUser</h1>
        <div><pre>{JSON.stringify(user, null, 2)}</pre></div>

        <h1>currentImageDbEntries</h1>
        <table>
            <thead>
                <tr>
                    <th>key</th>
                    <th>value</th>
                </tr>
            </thead>
            {Array.from(imageMap.keys()).sort().map(key => <tr key={key}>
                <td>{key}</td>
                <td><pre>{JSON.stringify(imageMap.get(key), null, 2)}</pre></td>
            </tr>)}
        </table>

        <h1>currentExifDbEntries</h1>
        <table>
            <thead>
            <tr>
                <th>key</th>
                <th>value</th>
            </tr>
            </thead>
            {Array.from(exifMap.keys()).sort().map(key => <tr key={key}>
                <td>{key}</td>
                <td><pre>{JSON.stringify(exifMap.get(key), null, 2)}</pre></td>
            </tr>)}
        </table>

    </div>;
};

export default Wiring;
