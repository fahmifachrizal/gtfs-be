import * as gtfsService from '../services/gtfs/index.js';

// ============ UPLOAD & RESET ============

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

export const resetGTFS = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { project_id } = req.body;

        const result = await gtfsService.resetGTFS(userId, project_id);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

// ============ ROUTES ============

export const getRoutes = async (req, res, next) => {
    try {
        const project_id = req.query.project_id || req.params.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.getRoutes(project_id, req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const getRouteById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const project_id = req.query.project_id || req.body.project_id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        // Use getRouteDetails to return route with directions and stops
        const route = await gtfsService.getRouteDetails(project_id, id);
        res.json({ success: true, data: { route } });
    } catch (error) {
        next(error);
    }
};

export const getRouteDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const project_id = req.query.project_id || req.body.project_id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const route = await gtfsService.getRouteDetails(project_id, id);
        res.json({ success: true, data: { route } });
    } catch (error) {
        next(error);
    }
};

export const createRoute = async (req, res, next) => {
    try {
        const { project_id } = req.body;
        const userId = req.user.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const route = await gtfsService.createRoute(project_id, req.body, userId);
        res.status(201).json({ success: true, data: route });
    } catch (error) {
        next(error);
    }
};

export const updateRoute = async (req, res, next) => {
    try {
        const { project_id } = req.body;
        const routeId = req.params.routeId || req.params.id;
        const userId = req.user.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const route = await gtfsService.updateRoute(project_id, routeId, req.body, userId);
        res.json({ success: true, data: route });
    } catch (error) {
        next(error);
    }
};

export const deleteRoute = async (req, res, next) => {
    try {
        const { project_id } = req.body;
        const routeId = req.params.routeId || req.params.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.deleteRoute(project_id, routeId);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

// ============ ROUTE STOPS ============

export const getRouteStops = async (req, res, next) => {
    try {
        const project_id = req.query.project_id || req.params.id;
        const { routeId } = req.params;
        const { direction_id } = req.query;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        let result;

        if (direction_id !== undefined) {
            // Get stops for specific direction - return raw array
            result = await gtfsService.getRouteStopsByDirection(
                project_id,
                routeId,
                direction_id
            );
        } else {
            // Get all stops - return raw array
            result = await gtfsService.getRouteStops(project_id, routeId);
        }

        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};


export const assignStopsToRoute = async (req, res, next) => {
    try {
        const { project_id, stops, direction_id = 0 } = req.body;
        const { routeId } = req.params;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        if (!stops || !Array.isArray(stops)) {
            throw new Error("Stops array is required");
        }

        const result = await gtfsService.assignStopsToRoute(
            project_id,
            routeId,
            stops,
            direction_id
        );

        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const clearRouteStops = async (req, res, next) => {
    try {
        const { project_id, direction_id } = req.body;
        const { routeId } = req.params;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.clearRouteStops(
            project_id,
            routeId,
            direction_id
        );

        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

export const addStopToRoute = async (req, res, next) => {
    try {
        const { project_id, stop_id, direction_id = 0, stop_sequence } = req.body;
        const { routeId } = req.params;

        if (!project_id || !stop_id) {
            throw new Error("Project ID and stop_id are required");
        }

        const result = await gtfsService.addStopToRoute(
            project_id,
            routeId,
            stop_id,
            direction_id,
            stop_sequence
        );

        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const removeStopFromRoute = async (req, res, next) => {
    try {
        const { project_id, direction_id } = req.body;
        const { routeId, stopId } = req.params;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        if (direction_id === undefined) {
            throw new Error("direction_id is required");
        }

        const result = await gtfsService.removeStopFromRoute(
            project_id,
            routeId,
            stopId,
            direction_id
        );

        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

export const reorderRouteStops = async (req, res, next) => {
    try {
        const { project_id, direction_id, stops } = req.body;
        const { routeId } = req.params;

        if (!project_id || direction_id === undefined || !stops) {
            throw new Error("project_id, direction_id, and stops are required");
        }

        const result = await gtfsService.reorderRouteStops(
            project_id,
            routeId,
            direction_id,
            stops
        );

        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

// ============ STOPS ============

export const getStops = async (req, res, next) => {
    try {
        const project_id = req.query.project_id || req.params.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.getStops(project_id, req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const getStopById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const project_id = req.query.project_id || req.body.project_id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const stop = await gtfsService.getStopById(project_id, id);
        res.json({ success: true, data: stop });
    } catch (error) {
        next(error);
    }
};

export const createStop = async (req, res, next) => {
    try {
        const { project_id } = req.body;
        const userId = req.user.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const stop = await gtfsService.createStop(project_id, req.body, userId);
        res.status(201).json({ success: true, data: stop });
    } catch (error) {
        next(error);
    }
};

export const updateStop = async (req, res, next) => {
    try {
        const { project_id } = req.body;
        const stopId = req.params.stopId || req.params.id;
        const userId = req.user.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const stop = await gtfsService.updateStop(project_id, stopId, req.body, userId);
        res.json({ success: true, data: stop });
    } catch (error) {
        next(error);
    }
};

export const deleteStop = async (req, res, next) => {
    try {
        const { project_id } = req.body;
        const stopId = req.params.stopId || req.params.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.deleteStop(project_id, stopId);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

export const searchStops = async (req, res, next) => {
    try {
        const project_id = req.query.project_id;
        const { q, limit } = req.query;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const stops = await gtfsService.searchStopsService(
            project_id,
            q,
            limit ? parseInt(limit) : 10
        );

        res.json({ success: true, data: stops });
    } catch (error) {
        next(error);
    }
};

export const getStopsNearby = async (req, res, next) => {
    try {
        const project_id = req.query.project_id;
        const { lat, lon, radius } = req.query;

        if (!project_id || !lat || !lon) {
            throw new Error("project_id, lat, and lon are required");
        }

        const stops = await gtfsService.getStopsNearby(
            project_id,
            parseFloat(lat),
            parseFloat(lon),
            radius ? parseFloat(radius) : 1
        );

        res.json({ success: true, data: stops });
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

export const getRoutePathAndStops = async (req, res, next) => {
    try {
        const { routeId } = req.params;
        const project_id = req.query.project_id;
        const direction_id = parseInt(req.query.direction_id || '0');

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        if (!routeId) {
            throw new Error("Route ID is required");
        }

        const result = await gtfsService.getRoutePathAndStops(project_id, routeId, direction_id);

        if (!result) {
            return res.json({
                success: false,
                message: "No trip with shape found for this route and direction"
            });
        }

        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const createTrip = async (req, res, next) => {
    try {
        const { project_id } = req.body;
        const userId = req.user.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.createTrip(project_id, req.body, userId);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const updateTrip = async (req, res, next) => {
    try {
        const { project_id } = req.body;
        const tripId = req.params.tripId || req.params.id;
        const userId = req.user.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.updateTrip(project_id, tripId, req.body, userId);
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
        const userId = req.user.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.createCalendar(project_id, req.body, userId);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const updateCalendar = async (req, res, next) => {
    try {
        const { project_id } = req.body;
        const serviceId = req.params.serviceId || req.params.id;
        const userId = req.user.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.updateCalendar(project_id, serviceId, req.body, userId);
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
        const userId = req.user.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.createFare(project_id, req.body, userId);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const updateFare = async (req, res, next) => {
    try {
        const { project_id } = req.body;
        const fareId = req.params.fareId || req.params.id;
        const userId = req.user.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.updateFare(project_id, fareId, req.body, userId);
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

        const result = await gtfsService.getAgencies(project_id, req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const getAgency = async (req, res, next) => {
    try {
        const project_id = req.query.project_id || req.params.id;
        const agencyId = req.params.agencyId;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.getAgency(project_id, agencyId);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const createAgency = async (req, res, next) => {
    try {
        const { project_id } = req.body;
        const userId = req.user.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.createAgency(project_id, req.body, userId);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const updateAgency = async (req, res, next) => {
    try {
        const { project_id } = req.body;
        const agencyId = req.params.agencyId;
        const userId = req.user.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.updateAgency(project_id, agencyId, req.body, userId);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const deleteAgency = async (req, res, next) => {
    try {
        const { project_id } = req.body;
        const agencyId = req.params.agencyId;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.deleteAgency(project_id, agencyId);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

// ============ SHAPES ============

export const getShapes = async (req, res, next) => {
    try {
        const project_id = req.query.project_id || req.params.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.getShapes(project_id, req.query);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

export const getShape = async (req, res, next) => {
    try {
        const project_id = req.query.project_id || req.params.id;
        const shapeId = req.params.shapeId;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.getShape(project_id, shapeId);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const createOrUpdateShape = async (req, res, next) => {
    try {
        const { project_id } = req.body;
        const userId = req.user.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.createOrUpdateShape(project_id, req.body, userId);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const deleteShape = async (req, res, next) => {
    try {
        const { project_id } = req.body;
        const shapeId = req.params.shapeId;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.deleteShape(project_id, shapeId);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

export const generateShapeFromRoute = async (req, res, next) => {
    try {
        const { project_id, direction_id = 0 } = req.body;
        const { routeId } = req.params;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.generateShapeFromRoute(project_id, routeId, direction_id);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

// ============ STOP TIMES ============

export const getAllStopTimes = async (req, res, next) => {
    try {
        const project_id = req.query.project_id || req.params.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.getAllStopTimes(project_id, req.query);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

export const getStopTimes = async (req, res, next) => {
    try {
        const project_id = req.query.project_id || req.params.id;
        const { tripId } = req.params;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.getStopTimes(project_id, tripId);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const createStopTimes = async (req, res, next) => {
    try {
        const { project_id, stop_times } = req.body;
        const { tripId } = req.params;
        const userId = req.user.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.createStopTimes(project_id, tripId, stop_times, userId);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const autoGenerateStopTimes = async (req, res, next) => {
    try {
        const { project_id, ...options } = req.body;
        const { tripId } = req.params;
        const userId = req.user.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.autoGenerateStopTimes(project_id, tripId, options, userId);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const updateStopTime = async (req, res, next) => {
    try {
        const { project_id } = req.body;
        const { tripId, stopSequence } = req.params;
        const userId = req.user.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.updateStopTime(project_id, tripId, stopSequence, req.body, userId);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const deleteStopTimes = async (req, res, next) => {
    try {
        const { project_id } = req.body;
        const { tripId } = req.params;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.deleteStopTimes(project_id, tripId);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

// ============ FREQUENCIES ============

export const getFrequencies = async (req, res, next) => {
    try {
        const project_id = req.query.project_id || req.params.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.getFrequencies(project_id, req.query);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

export const getFrequenciesByTrip = async (req, res, next) => {
    try {
        const project_id = req.query.project_id || req.params.id;
        const { tripId } = req.params;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.getFrequenciesByTrip(project_id, tripId);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const createFrequency = async (req, res, next) => {
    try {
        const { project_id } = req.body;
        const userId = req.user.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.createFrequency(project_id, req.body, userId);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const updateFrequency = async (req, res, next) => {
    try {
        const { project_id } = req.body;
        const { frequencyId } = req.params;
        const userId = req.user.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.updateFrequency(project_id, frequencyId, req.body, userId);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const deleteFrequency = async (req, res, next) => {
    try {
        const { project_id } = req.body;
        const { frequencyId } = req.params;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.deleteFrequency(project_id, frequencyId);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

export const generateDefaultFrequencies = async (req, res, next) => {
    try {
        const { project_id } = req.body;
        const { tripId } = req.params;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.generateDefaultFrequencies(project_id, tripId);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

// ============ TRANSFERS ============

export const getTransfers = async (req, res, next) => {
    try {
        const project_id = req.query.project_id || req.params.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.getTransfers(project_id, req.query);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

export const getTransfersByStop = async (req, res, next) => {
    try {
        const project_id = req.query.project_id || req.params.id;
        const { stopId } = req.params;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.getTransfersByStop(project_id, stopId);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const createTransfer = async (req, res, next) => {
    try {
        const { project_id } = req.body;
        const userId = req.user.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.createTransfer(project_id, req.body, userId);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const updateTransfer = async (req, res, next) => {
    try {
        const { project_id } = req.body;
        const { transferId } = req.params;
        const userId = req.user.id;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.updateTransfer(project_id, transferId, req.body, userId);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const deleteTransfer = async (req, res, next) => {
    try {
        const { project_id } = req.body;
        const { transferId } = req.params;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.deleteTransfer(project_id, transferId);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

export const generateTransfersForNearbyStops = async (req, res, next) => {
    try {
        const { project_id, ...options } = req.body;

        if (!project_id) {
            throw new Error("Project ID is required");
        }

        const result = await gtfsService.generateTransfersForNearbyStops(project_id, options);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};
