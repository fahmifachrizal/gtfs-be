import { prisma } from "../../utils/prisma.js"

export async function createTrip(projectId, data) {
    const {
        trip_id,
        route_id,
        service_id,
        trip_headsign,
        trip_short_name,
        direction_id,
        block_id,
        shape_id,
        wheelchair_accessible,
        bikes_allowed
    } = data

    if (!route_id || !service_id) {
        throw new Error("Route ID and Service ID are required")
    }

    // Generate trip_id if not provided
    const finalTripId = trip_id || `trip-${Date.now()}`

    return await prisma.trip.create({
        data: {
            trip_id: finalTripId,
            route_id,
            service_id,
            trip_headsign,
            trip_short_name,
            direction_id: direction_id !== undefined ? parseInt(direction_id) : 0,
            block_id,
            shape_id,
            wheelchair_accessible: wheelchair_accessible !== undefined ? parseInt(wheelchair_accessible) : 0,
            bikes_allowed: bikes_allowed !== undefined ? parseInt(bikes_allowed) : 0,
            project_id: projectId
        }
    })
}

export async function updateTrip(projectId, tripId, data) {
    const existing = await prisma.trip.findFirst({
        where: {
            trip_id: tripId,
            project_id: projectId
        }
    })

    if (!existing) {
        throw new Error("Trip not found in this project")
    }

    const updateData = {}
    if (data.route_id !== undefined) updateData.route_id = data.route_id
    if (data.service_id !== undefined) updateData.service_id = data.service_id
    if (data.trip_headsign !== undefined) updateData.trip_headsign = data.trip_headsign
    if (data.trip_short_name !== undefined) updateData.trip_short_name = data.trip_short_name
    if (data.direction_id !== undefined) updateData.direction_id = parseInt(data.direction_id)
    if (data.block_id !== undefined) updateData.block_id = data.block_id
    if (data.shape_id !== undefined) updateData.shape_id = data.shape_id
    if (data.wheelchair_accessible !== undefined) updateData.wheelchair_accessible = parseInt(data.wheelchair_accessible)
    if (data.bikes_allowed !== undefined) updateData.bikes_allowed = parseInt(data.bikes_allowed)

    return await prisma.trip.update({
        where: {
            trip_id_project_id: {
                trip_id: tripId,
                project_id: projectId
            }
        },
        data: updateData
    })
}

export async function deleteTrip(projectId, tripId) {
    const existing = await prisma.trip.findFirst({
        where: {
            trip_id: tripId,
            project_id: projectId
        }
    })

    if (!existing) {
        throw new Error("Trip not found in this project")
    }

    return await prisma.trip.delete({
        where: {
            trip_id_project_id: {
                trip_id: tripId,
                project_id: projectId
            }
        }
    })
}
