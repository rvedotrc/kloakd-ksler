import {Observable} from "lib/observer";
import {DBEntry, ExifDBEntry} from "../types";

export const currentUser = new Observable<firebase.User | null>(null);
export const currentImageDbEntries = new Observable<Map<string, DBEntry>>(new Map());
export const currentExifDbEntries = new Observable<Map<string, ExifDBEntry>>(new Map());
