import { GLOBAL } from "@/constants/global";

const storage = GLOBAL.storage;
  
export const normalizePhotos = (photos: any = {}) => {
    return Object.entries(photos).reduce((acc: any, [key, path]) => {
        if (!path) {
            acc[key] = null;
            return acc;
        }

        acc[key] = {
            type: "existing",
            uri: `${storage}/${path}`, 
        };

        return acc;
    }, {});
};