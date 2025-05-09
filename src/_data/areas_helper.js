// src/_data/areas_helper.js
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Replaced direct JSON import with fs.readFileSync and JSON.parse
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const areasPath = join(__dirname, 'areas.json');
const areasData = fs.readFileSync(areasPath, 'utf8');
const areas = JSON.parse(areasData);

/**
 * Flattens the nested areas data structure into an array of location objects
 * Each object contains the category, name, and slug
 */
function getSlugs() {
    const slugs = [];

    // Process each category (Cheyenne Neighborhoods, Nearby Cities)
    Object.entries(areas).forEach(([category, locations]) => {
        // Process each location within the category
        if (category === 'Cheyenne Neighborhoods') {
            Object.entries(locations).forEach(([name, data]) => {
                slugs.push({
                    slug: data.slug,
                    title: `${data.title} Neighborhood`,
                    description: data.description,
                    lat: data.location[0].lat,
                    long: data.location[0].long
                });
            });
        } else {
            Object.entries(locations).forEach(([name, data]) => {
                slugs.push({
                    slug: data.slug,
                    title: `${data.title}, WY`,
                    lat: data.location[0].lat,
                    long: data.location[0].long
                });
            });
        }
    });
    return slugs;
}

// Export the flattened locations directly
// This will be available as a global data object in Eleventy
export default getSlugs(); 
