import * as React from "react";
import {useEffect, useState} from "react";
import {
    currentExifDbEntries,
    currentImageDbEntries,
    currentImageFileGroups,
    currentImageFiles,
    currentUser
} from "lib/app_context";
import {ImageFileGroup} from "../../types";

declare const firebase: typeof import('firebase');

const renderImageFileGroup = (g?: ImageFileGroup): React.ReactNode => {
    if (!g) return <></>;

    const thumbnails: any = {};
    for (const [size, thumbnail] of g.thumbnails) {
        thumbnails[size] = thumbnail;
    }

    const dumpable = {
        ...g,
        thumbnails,
    };

    return <pre>{JSON.stringify(dumpable, null, 2)}</pre>
};

const Wiring = () => {
    const [user, setUser] = useState(currentUser.getValue());
    useEffect(() => currentUser.observe(setUser), []);

    const [imageMap, setImageMap] = useState(currentImageDbEntries.getValue());
    useEffect(() => currentImageDbEntries.observe(setImageMap), []);

    const [exifMap, setExifMap] = useState(currentExifDbEntries.getValue());
    useEffect(() => currentExifDbEntries.observe(setExifMap), []);

    const [imageFiles, setImageFiles] = useState(currentImageFiles.getValue());
    useEffect(() => currentImageFiles.observe(setImageFiles), []);

    const [imageFileGroups, setImageFileGroups] = useState(currentImageFileGroups.getValue());
    useEffect(() => currentImageFileGroups.observe(setImageFileGroups), []);

    return <div>

        <h1>currentUser</h1>
        <div><pre>{JSON.stringify(user, null, 2)}</pre></div>

        <h1>currentImageDbEntries</h1>
        {imageMap &&
        <table>
            <thead>
                <tr>
                    <th>key</th>
                    <th>value</th>
                </tr>
            </thead>
            <tbody>
                {Array.from(imageMap.keys()).sort().map(key => <tr key={key}>
                    <td>{key}</td>
                    <td><pre>{JSON.stringify(imageMap.get(key), null, 2)}</pre></td>
                </tr>)}
            </tbody>
        </table>}

        <h1>currentExifDbEntries</h1>
        {exifMap &&
        <table>
            <thead>
                <tr>
                    <th>key</th>
                    <th>value</th>
                </tr>
            </thead>
            <tbody>
                {Array.from(exifMap.keys()).sort().map(key => <tr key={key}>
                    <td>{key}</td>
                    <td><pre>{JSON.stringify(exifMap.get(key), null, 2)}</pre></td>
                </tr>)}
            </tbody>
        </table>}

        <h1>currentImageFiles</h1>
        {imageFiles &&
        <table>
            <thead>
                <tr>
                    <th>key</th>
                    <th>value</th>
                </tr>
            </thead>
            <tbody>
                {Array.from(imageFiles.keys()).sort().map(key => <tr key={key}>
                    <td>{key}</td>
                    <td><pre>{JSON.stringify(imageFiles.get(key), null, 2)}</pre></td>
                </tr>)}
            </tbody>
        </table>}

        <h1>currentImageFileGroups</h1>
        {imageFileGroups &&
        <table>
            <thead>
                <tr>
                    <th>key</th>
                    <th>value</th>
                </tr>
            </thead>
            <tbody>
                {Array.from(imageFileGroups.keys()).sort().map(sha => <tr key={sha}>
                    <td>{sha}</td>
                    <td>{renderImageFileGroup(imageFileGroups.get(sha))}</td>
                </tr>)}
            </tbody>
        </table>}

    </div>;
};

export default Wiring;
