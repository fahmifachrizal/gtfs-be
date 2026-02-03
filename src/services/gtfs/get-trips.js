import { prisma } from "../../utils/prisma.js"

// Get all trips for a project with pagination and search
export async function getTrips(projectId, query = {}) {
    const { page = 1, limit = 10, search = "", route_id = null } = query
    const skip = (page - 1) * limit

    const whereClause = {
        project_id: projectId,
        ...(search && {
            OR: [
                { trip_id: { contains: search, mode: "insensitive" } },
                { trip_headsign: { contains: search, mode: "insensitive" } },
                { trip_short_name: { contains: search, mode: "insensitive" } },
            ],
        }),
        ...(route_id && { route_id }),
    }

    const [trips, total] = await Promise.all([
        prisma.trip.findMany({
            where: whereClause,
            include: {
                route: {
                    select: {
                        route_id: true,
                        route_short_name: true,
                        route_long_name: true,
                        route_color: true,
                    }
                },
                calendar: {
                    select: {
                        service_id: true,
                        start_date: true,
                        end_date: true,
                    }
                }
            },
            orderBy: [{ route_id: "asc" }, { trip_id: "asc" }],
            skip,
            take: Number(limit),
        }),
        prisma.trip.count({ where: whereClause })
    ])

    return {
        trips,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    }
}

// Get a single trip by ID
export async function getTripById(projectId, tripId) {
    const trip = await prisma.trip.findFirst({
        where: {
            trip_id: tripId,
            project_id: projectId
        },
        include: {
            route: true,
            calendar: true,
            stopTimes: {
                orderBy: { stop_sequence: "asc" },
                include: {
                    stop: true
                }
            }
        }
    })

    if (!trip) throw new Error("Trip not found")
    return trip
}

// Get route path (shape) and stops for a specific route and direction
export async function getRoutePathAndStops(projectId, routeId, directionId = 0) {
    // 1. Find a representative Trip that has a shape_id
    const trip = await prisma.trip.findFirst({
        where: {
            project_id: projectId,
            route_id: routeId,
            direction_id: directionId,
            shape_id: { not: null } // Ensure we get a trip that actually has a path
        },
        include: {
            // 2. Get the stop times with stops
            stopTimes: {
                orderBy: { shape_dist_traveled: 'asc' },
                include: {
                    stop: {
                        select: {
                            stop_id: true,
                            stop_name: true,
                            stop_lat: true,
                            stop_lon: true,
                        }
                    }
                }
            }
        }
    });

    if (!trip) return null;

    // 3. Get the Shape waypoints using the shape_id from the trip
    const shapes = await prisma.shape.findMany({
        where: {
            project_id: projectId,
            shape_id: trip.shape_id
        },
        orderBy: { shape_pt_sequence: 'asc' }
    });

    return {
        trip_id: trip.trip_id,
        shape_id: trip.shape_id,
        // The visual line for the map
        polyline: shapes.map(s => ({
            latitude: s.shape_pt_lat,
            longitude: s.shape_pt_lon,
            sequence: s.shape_pt_sequence,
            distance: s.shape_dist_traveled
        })),
        // The markers/stops along the line (unique stops only)
        stops: trip.stopTimes
            .filter((st, index, self) =>
                // Keep only first occurrence of each stop_id
                index === self.findIndex(t => t.stop.stop_id === st.stop.stop_id)
            )
            .map(st => ({
                ...st.stop,
                arrival_time: st.arrival_time,
                departure_time: st.departure_time,
                stop_sequence: st.stop_sequence,
                distance: st.shape_dist_traveled
            }))
    };
}

export async function getRouteGroups(projectId) {
    // 1. Get all unique route and direction combinations
    // Based on your DB, this identifies distinct paths like 10D-Dir0 and 10D-Dir1
    const uniqueTrips = await prisma.trip.findMany({
        where: { project_id: projectId },
        distinct: ['route_id', 'direction_id'],
        select: {
            route_id: true,
            direction_id: true,
        }
    });

    // 2. Fetch the actual Route metadata for descriptions/colors
    const routeDetails = await prisma.route.findMany({
        where: {
            project_id: projectId,
            route_id: { in: uniqueTrips.map(t => t.route_id) }
        },
        select: {
            route_id: true,
            route_short_name: true,
            route_long_name: true,
            route_color: true,
            route_desc: true,
        }
    });

    // 3. Combine into the dropdown format
    return uniqueTrips.map(trip => {
        const detail = routeDetails.find(r => r.route_id === trip.route_id);
        return {
            route_id: trip.route_id,
            direction_id: trip.direction_id,
            route_short_name: detail?.route_short_name || trip.route_id,
            route_long_name: detail?.route_long_name || "",
            route_color: detail?.route_color || "000000",
            // Helper for your frontend selection
            display_name: `${detail?.route_short_name || trip.route_id} (${trip.direction_id === 0 ? 'Outbound' : 'Inbound'})`
        };
    });
}