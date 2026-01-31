import express from 'express';
import {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
    shareProject,
    unshareProject
} from '../controllers/projectController.js';
import {
    uploadGTFS,
    getStops,
    getRoutes,
    createRoute,
    updateRoute,
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
    getAgencies,
    getRouteStops,
    assignStopsToRoute
} from '../controllers/gtfsController.js';
import { requireAuth } from '../middleware/auth.js';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Project CRUD
router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// Sharing
router.post('/:id/share', shareProject);
router.delete('/:id/share/:userId', unshareProject);

// Middleware to map params.id to body.project_id
const mapProjectId = (req, res, next) => {
    if (req.params.id) {
        req.body.project_id = req.params.id;
    }
    next();
};



// Import GTFS
router.post('/:id/import', upload.single('file'), mapProjectId, uploadGTFS);

// Stops
router.get('/:id/stops', getStops);
router.post('/:id/stops', mapProjectId, createStop);
router.put('/:id/stops/:stopId', mapProjectId, updateStop);

// Routes
router.get('/:id/routes', getRoutes);
router.post('/:id/routes', mapProjectId, createRoute);
router.put('/:id/routes/:routeId', mapProjectId, updateRoute);
router.get('/:id/routes/:routeId/stops', getRouteStops);
router.post('/:id/routes/:routeId/stops', mapProjectId, assignStopsToRoute);

// Trips
router.get('/:id/trips', getTrips);
router.post('/:id/trips', mapProjectId, createTrip);
router.put('/:id/trips/:tripId', mapProjectId, updateTrip);

// Calendar
router.get('/:id/calendar', getCalendar);
router.post('/:id/calendar', mapProjectId, createCalendar);
router.put('/:id/calendar/:serviceId', mapProjectId, updateCalendar);

// Fares
router.get('/:id/fares', getFares);
router.post('/:id/fares', mapProjectId, createFare);
router.put('/:id/fares/:fareId', mapProjectId, updateFare);

// Agencies
router.get('/:id/agencies', getAgencies);

export default router;

