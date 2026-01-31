import express from 'express';
import multer from 'multer';
import {
    uploadGTFS,
    getRoutes,
    getRouteDetails,
    getStops,
    resetGTFS,
    createStop,
    updateStop,
    getTrips,
    createTrip,
    updateTrip,
    getCalendar,
    createCalendar,
    updateCalendar,
    getFares,
    createFare,
    updateFare,
    getAgencies
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

router.post('/upload', upload.single('file'), uploadGTFS);
router.post('/reset', resetGTFS);

// Agencies
router.get('/agencies', getAgencies);

// Stops
router.get('/stops', getStops);
router.post('/stops', createStop);
router.put('/stops/:id', updateStop);

// Routes
router.get('/routes', getRoutes);
router.get('/routes/:id', getRouteDetails);

// Trips
router.get('/trips', getTrips);
router.post('/trips', createTrip);
router.put('/trips/:id', updateTrip);

// Calendar
router.get('/calendar', getCalendar);
router.post('/calendar', createCalendar);
router.put('/calendar/:id', updateCalendar);

// Fares
router.get('/fares', getFares);
router.post('/fares', createFare);
router.put('/fares/:id', updateFare);

export default router;

