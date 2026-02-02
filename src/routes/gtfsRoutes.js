import express from 'express';
import multer from 'multer';
import {
    // Upload & Reset
    uploadGTFS,
    resetGTFS,

    // Agencies
    getAgencies,
    getAgency,
    createAgency,
    updateAgency,
    deleteAgency,

    // Routes
    getRoutes,
    getRouteById,
    getRouteDetails,
    createRoute,
    updateRoute,
    deleteRoute,

    // Route Stops
    getRouteStops,
    assignStopsToRoute,
    clearRouteStops,
    addStopToRoute,
    removeStopFromRoute,
    reorderRouteStops,

    // Stops
    getStops,
    getStopById,
    createStop,
    updateStop,
    deleteStop,
    searchStops,
    getStopsNearby,

    // Trips
    getTrips,
    getTripById,
    getRoutePathAndStops,
    createTrip,
    updateTrip,

    // Stop Times
    getAllStopTimes,
    getStopTimes,
    createStopTimes,
    autoGenerateStopTimes,
    updateStopTime,
    deleteStopTimes,

    // Calendar
    getCalendar,
    createCalendar,
    updateCalendar,

    // Fares
    getFares,
    createFare,
    updateFare,

    // Shapes
    getShapes,
    getShape,
    createOrUpdateShape,
    deleteShape,
    generateShapeFromRoute,

    // Frequencies
    getFrequencies,
    getFrequenciesByTrip,
    createFrequency,
    updateFrequency,
    deleteFrequency,
    generateDefaultFrequencies,

    // Transfers
    getTransfers,
    getTransfersByStop,
    createTransfer,
    updateTransfer,
    deleteTransfer,
    generateTransfersForNearbyStops
} from '../controllers/gtfsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

router.use(requireAuth);

// ============ UPLOAD & RESET ============
router.post('/upload', upload.single('file'), uploadGTFS);
router.post('/reset', resetGTFS);

// ============ AGENCIES ============
router.get('/agency', getAgencies);
router.get('/agency/:agencyId', getAgency);
router.post('/agency', createAgency);
router.put('/agency/:agencyId', updateAgency);
router.delete('/agency/:agencyId', deleteAgency);

// ============ STOPS ============
router.get('/stops', getStops);
router.get('/stops/search', searchStops);
router.get('/stops/nearby', getStopsNearby);
router.get('/stops/:id', getStopById);
router.post('/stops', createStop);
router.put('/stops/:id', updateStop);
router.delete('/stops/:id', deleteStop);

// ============ ROUTES ============
router.get('/routes', getRoutes);
router.get('/routes/:id', getRouteById);
router.get('/routes/:id/details', getRouteDetails);
router.post('/routes', createRoute);
router.put('/routes/:routeId', updateRoute);
router.delete('/routes/:routeId', deleteRoute);

// ============ ROUTE STOPS ============
router.get('/routes/:routeId/stops', getRouteStops);
router.post('/routes/:routeId/stops', assignStopsToRoute);
router.delete('/routes/:routeId/stops', clearRouteStops);
router.post('/routes/:routeId/stops/:stopId', addStopToRoute);
router.delete('/routes/:routeId/stops/:stopId', removeStopFromRoute);
router.put('/routes/:routeId/stops/reorder', reorderRouteStops);

// ============ TRIPS ============
router.get('/trips', getTrips);
router.get('/trips/:id', getTripById);
router.post('/trips', createTrip);
router.put('/trips/:id', updateTrip);

// ============ ROUTE PATH & STOPS ============
router.get('/routes/:routeId/path-and-stops', getRoutePathAndStops);

// ============ STOP TIMES ============
router.get('/stop-times', getAllStopTimes);
router.get('/trips/:tripId/stop-times', getStopTimes);
router.post('/trips/:tripId/stop-times', createStopTimes);
router.post('/trips/:tripId/stop-times/auto-generate', autoGenerateStopTimes);
router.put('/trips/:tripId/stop-times/:stopSequence', updateStopTime);
router.delete('/trips/:tripId/stop-times', deleteStopTimes);

// ============ CALENDAR ============
router.get('/calendar', getCalendar);
router.post('/calendar', createCalendar);
router.put('/calendar/:id', updateCalendar);

// ============ FARES ============
router.get('/fares', getFares);
router.post('/fares', createFare);
router.put('/fares/:id', updateFare);

// ============ SHAPES ============
router.get('/shapes', getShapes);
router.get('/shapes/:shapeId', getShape);
router.post('/shapes', createOrUpdateShape);
router.delete('/shapes/:shapeId', deleteShape);
router.post('/routes/:routeId/shapes/generate', generateShapeFromRoute);

// ============ FREQUENCIES ============
router.get('/frequencies', getFrequencies);
router.get('/trips/:tripId/frequencies', getFrequenciesByTrip);
router.post('/frequencies', createFrequency);
router.put('/frequencies/:frequencyId', updateFrequency);
router.delete('/frequencies/:frequencyId', deleteFrequency);
router.post('/trips/:tripId/frequencies/generate', generateDefaultFrequencies);

// ============ TRANSFERS ============
router.get('/transfers', getTransfers);
router.get('/stops/:stopId/transfers', getTransfersByStop);
router.post('/transfers', createTransfer);
router.put('/transfers/:transferId', updateTransfer);
router.delete('/transfers/:transferId', deleteTransfer);
router.post('/transfers/generate', generateTransfersForNearbyStops);

export default router;

