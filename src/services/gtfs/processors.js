
/**
 * Deduplicates stop times by removing consecutive duplicate stops within the same trip.
 * @param {Array} records - Array of stop_time objects.
 * @returns {Array} - Deduplicated array of stop_time objects.
 */
export function deduplicateStopTimes(records) {
    // 1. Group by trip_id
    const trips = {};
    for (const record of records) {
        if (!trips[record.trip_id]) {
            trips[record.trip_id] = [];
        }
        trips[record.trip_id].push(record);
    }

    const cleanedRecords = [];

    // 2. Process each trip
    for (const tripId in trips) {
        const stops = trips[tripId];

        // Sort by stop_sequence
        stops.sort((a, b) => a.stop_sequence - b.stop_sequence);

        // Filter consecutive duplicates
        if (stops.length > 0) {
            cleanedRecords.push(stops[0]); // Always keep the first one

            for (let i = 1; i < stops.length; i++) {
                const current = stops[i];
                const previous = stops[i - 1];

                // If stop_id is different, keep it
                // Note: We only check stop_id. A bus might visit the same stop twice (loop),
                // but not consecutively (unless it's a mistake we want to fix).
                if (current.stop_id !== previous.stop_id) {
                    cleanedRecords.push(current);
                }
            }
        }
    }

    return cleanedRecords;
}
