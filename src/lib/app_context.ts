import {Observable} from "lib/observer";
import {DBEntry, ExifDBEntry, ImageFileMap, ImageFileGroupMap} from "../types";

export const currentUser = new Observable<firebase.User | null>(null);
export const currentImageFiles = new Observable<ImageFileMap | undefined>(undefined);
export const currentImageFileGroups = new Observable<ImageFileGroupMap | undefined>(undefined);
export const currentImageDbEntries = new Observable<Map<string, DBEntry> | undefined>(undefined);
export const currentExifDbEntries = new Observable<Map<string, ExifDBEntry> | undefined>(undefined);
