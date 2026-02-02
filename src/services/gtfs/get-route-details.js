import { prisma } from "../../utils/prisma.js"

/**
 * Get detailed route information including stops for each direction
 *
 * Flow: Route → findMany Trip (distinct direction_id) → findFirst Trip (representative) → findMany StopTime → include Stop
 */
export async function getRouteDetails(projectId, routeId) {
    // Find the route
    const route = await prisma.route.findFirst({
        where: {
            route_id: routeId,
            project_id: projectId
        },
        include: { agency: true }
    })

    if (!route) {
        throw new Error(`Route with ID ${routeId} not found`)
    }

    // Get available directions for this route
    const availableDirectionsResult = await prisma.trip.findMany({
        where: {
            route_id: routeId,
            project_id: projectId
        },
        distinct: ["direction_id"],
        select: { direction_id: true },
        orderBy: { direction_id: "asc" },
    })

    const availableDirections = availableDirectionsResult.map(d => d.direction_id)

    // Get stops from trips (Route → Trip → StopTimes → Stop)
    const directionStops = {}

    for (const direction of availableDirections) {
        // Get a representative trip for this direction
        const representativeTrip = await prisma.trip.findFirst({
            where: {
                route_id: routeId,
                direction_id: direction,
                project_id: projectId
            },
        })

        if (representativeTrip) {
            // Get all stops for this trip via stop_times
            const stops = await prisma.stopTime.findMany({
                where: { trip_id: representativeTrip.trip_id },
                orderBy: { stop_sequence: "asc" },
                include: {
                    stop: true,
                },
            })

            directionStops[direction] = stops.map(st => ({
                stop_id: st.stop.stop_id,
                stop_name: st.stop.stop_name,
                stop_desc: st.stop.stop_desc,
                stop_lat: st.stop.stop_lat,
                stop_lon: st.stop.stop_lon,
                stop_sequence: st.stop_sequence,
                arrival_time: st.arrival_time,
                departure_time: st.departure_time,
                stop_headsign: st.stop_headsign,
                pickup_type: st.pickup_type,
                drop_off_type: st.drop_off_type,
                trip_headsign: representativeTrip.trip_headsign,
                direction_id: representativeTrip.direction_id,
            }))
        } else {
            directionStops[direction] = []
        }
    }

    return {
        id: route.id,
        route_id: route.route_id,
        agency_id: route.agency_id,
        route_short_name: route.route_short_name,
        route_long_name: route.route_long_name,
        route_desc: route.route_desc,
        route_type: route.route_type,
        route_url: route.route_url,
        route_color: route.route_color,
        route_text_color: route.route_text_color,
        route_sort_order: route.route_sort_order,
        agency: route.agency,
        available_directions: availableDirections,
        directions: directionStops,
    }
}
