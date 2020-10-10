import {
    currentExifDbEntries,
    currentImageDbEntries, currentImageFileGroups, currentImageFiles,
    currentUser
} from "lib/app_context";
import {CallbackRemover} from "lib/observer";
import {Observable} from "./observer";
import {ExifDBEntry, ImageFileGroup, ImageFileGroupMap} from "../types";
import getImageFiles from "../file_reader";

declare const firebase: typeof import('firebase');

type DBTransformer<T> = (key: string, data: any) => T;

export const start = (): CallbackRemover => {

    const callbackRemovers: CallbackRemover[] = [];

    // User

    callbackRemovers.unshift(
        firebase.auth().onAuthStateChanged(
            user => currentUser.setValue(user)
        )
    );

    // currentImageFiles
    currentUser.observe(user => {
        if (user) {
            getImageFiles(user).then(map => currentImageFiles.setValue(map));
        } else {
            currentImageFiles.setValue(undefined);
        }
    });

    // currentImageFileGroups
    currentImageFiles.observe(files => {
        if (!files) {
            currentImageFileGroups.setValue(undefined);
            return;
        }

        const map: ImageFileGroupMap = new Map();

        const addEntry = (sha: string): ImageFileGroup => {
            const entry: ImageFileGroup = {
                sha,
                main: undefined,
                thumbnails: new Map(),
            };
            map.set(sha, entry);
            return entry;
        };

        for (const image of files.values()) {
            const entry: ImageFileGroup = map.get(image.sha) || addEntry(image.sha);

            if ("thumbnailSize" in image) {
                entry.thumbnails.set(image.thumbnailSize, image);
            } else {
                entry.main = image;
            }
        }

        console.log(`Built ${map.size} file groups`);
        currentImageFileGroups.setValue(map);
    });

    // Database watchers:

    const watchDB = <T>(
        child: string,
        observer: Observable<Map<string, T> | undefined>,
        transformer: DBTransformer<T | null>
    ): void => {

        let dbRef: firebase.database.Reference | null;
        const dbListener = (snapshot: firebase.database.DataSnapshot) => {
            const value = snapshot.val() || {};
            const newMap: Map<string, T> = new Map();

            for (const key of Object.keys(value)) {
                const v = transformer(key, value[key]);
                if (v !== null) newMap.set(key, v);
            }

            observer.setValue(newMap);
        };

        callbackRemovers.unshift(() => dbRef?.off('value', dbListener));

        callbackRemovers.unshift(
            currentUser.observe(user => {
                dbRef?.off('value', dbListener);

                if (user) {
                    dbRef = firebase.database().ref(`users/${user.uid}/${child}`);
                    dbRef.on('value', dbListener);
                } else {
                    dbRef = null;
                    observer.setValue(undefined);
                }
            })
        );
    };

    watchDB("images", currentImageDbEntries, (key: string, data: any) => {
        if (!key.match(/^(\w{64})$/)) return null;

        // TODO: parse data to a DBEntry
        return {
            text: data.text || "",
            tags: data.tags || [],
            rotateDegrees: data.rotateDegrees || 0,
            centerXRatio: data.centerXRatio || 0.5,
            centerYRatio: data.centerYRatio || 0.5,
            radiusRatio: data.radiusRatio || 0.5,
        };
    });

    watchDB("exif", currentExifDbEntries, (key: string, data: any) => {
        if (!key.match(/^(\w{64})$/)) return null;

        // TODO: parse data to an ExifDBEntry
        const parsedValue: ExifDBEntry = {
            tags: [],
            rawData: data,
        };

        return parsedValue;
    });

    // Teardown

    return () => {
        callbackRemovers.forEach(remover => remover());
    };

};
