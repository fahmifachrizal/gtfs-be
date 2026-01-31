import * as gtfsService from '../services/gtfs/index.js';

export const uploadGTFS = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { project_id } = req.body;

        if (!req.file) {
            throw new Error("No file uploaded");
        }

        const buffer = req.file.buffer;
        const fileName = req.file.originalname;

        const result = await gtfsService.uploadGTFS(userId, project_id, buffer, fileName);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

export const getRoutes = async (req, res, next) => {
    try {
        // We expect projectId to be passed in query or path, or attached to request if nested route
        const project_id = req.query.project_id || req.params.id;
        // NOTE: The previous service assumed filtering by project_id is mandatory or handled.
        // My new service enforces it. If existing frontend doesn't send project_id, we need to know.
        // Assuming project_id is sent in query for now.

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.getRoutes(project_id, req.query);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

export const getStops = async (req, res, next) => {
    try {
        const project_id = req.query.project_id || req.params.id;
        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.getStops(project_id, req.query);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

export const getRouteById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const project_id = req.query.project_id || req.params.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.getRouteById(project_id, id);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

export const getRouteDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const project_id = req.query.project_id || req.params.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const route = await gtfsService.getRouteDetails(project_id, id);
        res.json({ success: true, data: { route } });
    } catch (error) {
        next(error);
    }
};

export const resetGTFS = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { project_id } = req.body; // Explicit confirmation

        const result = await gtfsService.resetGTFS(userId, project_id);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

export const createStop = async (req, res, next) => {
    try {
        // Project ID from path or body, depending on route
        // Assuming route is /api/projects/:projectId/stops, so it might be attached to body by middleware or directly available
        const { project_id } = req.body;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.createStop(project_id, req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const updateStop = async (req, res, next) => {
    try {
        const { project_id } = req.body; // Attached by middleware
        // Fix: Use stopId from params if available (nested route), otherwise fallback to id
        const stopId = req.params.stopId || req.params.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.updateStop(project_id, stopId, req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

// ============ TRIPS ============

export const getTrips = async (req, res, next) => {
    try {
        const project_id = req.query.project_id || req.params.id;
        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.getTrips(project_id, req.query);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

export const getTripById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const project_id = req.query.project_id || req.params.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.getTripById(project_id, id);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const createTrip = async (req, res, next) => {
    try {
        const { project_id } = req.body;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.createTrip(project_id, req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const updateTrip = async (req, res, next) => {
    try {
        const { project_id } = req.body;
        const tripId = req.params.tripId || req.params.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.updateTrip(project_id, tripId, req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

// ============ CALENDAR ============

export const getCalendar = async (req, res, next) => {
    try {
        const project_id = req.query.project_id || req.params.id;
        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.getCalendar(project_id, req.query);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

export const createCalendar = async (req, res, next) => {
    try {
        const { project_id } = req.body;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.createCalendar(project_id, req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const updateCalendar = async (req, res, next) => {
    try {
        const { project_id } = req.body;
        const serviceId = req.params.serviceId || req.params.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.updateCalendar(project_id, serviceId, req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

// ============ FARES ============

export const getFares = async (req, res, next) => {
    try {
        const project_id = req.query.project_id || req.params.id;
        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.getFares(project_id, req.query);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

export const createFare = async (req, res, next) => {
    try {
        const { project_id } = req.body;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.createFare(project_id, req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const updateFare = async (req, res, next) => {
    try {
        const { project_id } = req.body;
        const fareId = req.params.fareId || req.params.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.updateFare(project_id, fareId, req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

// ============ ROUTES ============

export const createRoute = async (req, res, next) => {
    try {
        const { project_id } = req.body;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.createRoute(project_id, req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const assignStopsToRoute = async (req, res, next) => {
    try {
        const { project_id } = req.body; // MapProjectId middleware ensures this
        const { routeId } = req.params;
        const stops = req.body.stops; // Array of stops

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.assignStopsToRoute(project_id, routeId, stops, req.body.direction_id || 0);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const getRouteStops = async (req, res, next) => {
    try {
        const { project_id } = req.query; // Or from params/auth context if standardized
        const { routeId } = req.params;

        if (!project_id && req.params.id) {
            // Fallback if project_id not in query but in parent route param
            // ideally passed via mapProjectId or query
        }

        // Actually, let's trust mapProjectId if we use it, or req.query like getStops
        const pid = req.query.project_id || req.params.id;

        if (!pid) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.getRouteStops(pid, routeId);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const updateRoute = async (req, res, next) => {
    try {
        const { project_id } = req.body;
        const routeId = req.params.routeId || req.params.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.updateRoute(project_id, routeId, req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

// ============ AGENCIES ============

export const getAgencies = async (req, res, next) => {
    try {
        const project_id = req.query.project_id || req.params.id;
        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.getAgencies(project_id);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

