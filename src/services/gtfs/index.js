// GTFS Services Index
// Compatible with existing file structure

// Upload and Reset
export { uploadGTFS } from './upload.js';
export { resetGTFS } from './reset.js';

// Agencies
export { getAgencies } from './get-agencies.js';
export {
    createAgency,
    getAgency,
    updateAgency,
    deleteAgency,
    ensureDefaultAgency
} from './manage-agencies.js';

// Stops - use existing files
export { getStops } from './get-stops.js';
export { createStop, updateStop } from './manage-stops.js';
export { getStopById, searchStops as searchStopsService, getStopsNearby } from './stops/query.service.js';
export { deleteStop } from './stops/crud.service.js';

// Routes - use existing files
export { getRoutes, getRouteById } from './get-routes.js';
export { getRouteDetails } from './get-route-details.js';
export { createRoute, updateRoute } from './manage-routes.js';
export { assignStopsToRoute, getRouteStops, getRouteStopsByDirection } from './manage-route-stops.js';
export { clearRouteStops } from './routes/stops.service.js';

// Shapes
export {
    createOrUpdateShape,
    getShape,
    getShapes,
    deleteShape,
    generateShapeFromRoute
} from './manage-shapes.js';

// Trips - use existing files
export { getTrips, getTripById, getRoutePathAndStops, getRouteGroups } from './get-trips.js';
export { createTrip, updateTrip, deleteTrip } from './manage-trips.js';

// Calendar - use existing files
export { getCalendar } from './get-calendar.js';
export { createCalendar, updateCalendar, deleteCalendar } from './manage-calendar.js';

// Stop Times
export {
    createStopTimes,
    getStopTimes,
    getAllStopTimes,
    autoGenerateStopTimes,
    updateStopTime,
    deleteStopTimes
} from './manage-stop-times.js';

// Frequencies
export {
    createFrequency,
    getFrequenciesByTrip,
    getFrequencies,
    updateFrequency,
    deleteFrequency,
    generateDefaultFrequencies
} from './manage-frequencies.js';

// Transfers
export {
    createTransfer,
    getTransfers,
    getTransfersByStop,
    updateTransfer,
    deleteTransfer,
    generateTransfersForNearbyStops
} from './manage-transfers.js';

// Fares - use existing files
export { getFares } from './get-fares.js';
export { createFare, updateFare, deleteFare, createFareRule, deleteFareRule } from './manage-fares.js';