import { prisma } from "../../utils/prisma.js"

/**
 * Helper function to format time as HH:MM:SS
 */
function formatGTFSTime(hours, minutes, seconds = 0) {
    const h = String(hours).padStart(2, '0')
    const m = String(minutes).padStart(2, '0')
    const s = String(seconds).padStart(2, '0')
    return `${h}:${m}:${s}`
}

/**
 * Helper function to add minutes to a time string
 */
function addMinutesToTime(timeStr, minutesToAdd) {
    const [h, m, s] = timeStr.split(':').map(Number)
    let totalMinutes = h * 60 + m + minutesToAdd
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return formatGTFSTime(hours, minutes, s || 0)
}

/**
 * Create stop times for a trip
 */
export async function createStopTimes(projectId, tripId, stopTimesData, userId = null) {
    if (!Array.isArray(stopTimesData) || stopTimesData.length === 0) {
        throw new Error("stopTimesData must be a non-empty array")
    }

    // Verify trip exists
    const trip = await prisma.trip.findFirst({
        where: {
            trip_id: tripId,
            project_id: projectId
        }
    })

    if (!trip) {
        throw new Error("Trip not found in this project")
    }

    // Validate all stop times have required fields
    for (let i = 0; i < stopTimesData.length; i++) {
        const st = stopTimesData[i]
        if (!st.stop_id) {
            throw new Error(`Stop time at index ${i} is missing stop_id`)
        }
        if (st.stop_sequence === undefined) {
            throw new Error(`Stop time at index ${i} is missing stop_sequence`)
        }
    }

    // Delete existing stop times for this trip
    await prisma.stopTime.deleteMany({
        where: {
            trip_id: tripId,
            project_id: projectId
        }
    })

    // Create new stop times
    const stopTimes = stopTimesData.map((st) => ({
        trip_id: tripId,
        stop_id: st.stop_id,
        arrival_time: st.arrival_time,
        departure_time: st.departure_time,
        stop_sequence: parseInt(st.stop_sequence),
        stop_headsign: st.stop_headsign,
        pickup_type: st.pickup_type !== undefined ? parseInt(st.pickup_type) : 0,
        drop_off_type: st.drop_off_type !== undefined ? parseInt(st.drop_off_type) : 0,
        continuous_pickup: st.continuous_pickup !== undefined ? parseInt(st.continuous_pickup) : null,
        continuous_drop_off: st.continuous_drop_off !== undefined ? parseInt(st.continuous_drop_off) : null,
        shape_dist_traveled: st.shape_dist_traveled ? parseFloat(st.shape_dist_traveled) : null,
        timepoint: st.timepoint !== undefined ? parseInt(st.timepoint) : 1,
        project_id: projectId,
        created_by: userId
    }))

    await prisma.stopTime.createMany({
        data: stopTimes
    })

    return await getStopTimes(projectId, tripId)
}

/**
 * Get stop times for a trip
 */
export async function getStopTimes(projectId, tripId) {
    return await prisma.stopTime.findMany({
        where: {
            trip_id: tripId,
            project_id: projectId
        },
        include: {
            stop: {
                select: {
                    stop_id: true,
                    stop_name: true,
                    stop_lat: true,
                    stop_lon: true
                }
            }
        },
        orderBy: {
            stop_sequence: 'asc'
        }
    })
}

/**
 * Get all stop times for a project with pagination
 */
export async function getAllStopTimes(projectId, { page = 1, limit = 10, trip_id = null } = {}) {
    const offset = (page - 1) * limit

    const where = {
        project_id: projectId,
        ...(trip_id && { trip_id })
    }

    const [data, total] = await Promise.all([
        prisma.stopTime.findMany({
            where,
            include: {
                stop: {
                    select: {
                        stop_id: true,
                        stop_name: true
                    }
                },
                trip: {
                    select: {
                        trip_id: true,
                        trip_headsign: true,
                        route: {
                            select: {
                                route_short_name: true,
                                route_long_name: true
                            }
                        }
                    }
                }
            },
            orderBy: [
                { trip_id: 'asc' },
                { stop_sequence: 'asc' }
            ],
            skip: offset,
            take: limit
        }),
        prisma.stopTime.count({ where })
    ])

    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }
}

/**
 * Auto-generate stop times for a trip based on route stops
 * This creates stop times with evenly distributed times between stops
 */
export async function autoGenerateStopTimes(projectId, tripId, options = {}, userId = null) {
    const {
        start_time = "06:00:00",
        time_between_stops = 5, // minutes
        dwell_time = 1 // minutes (time stopped at each stop)
    } = options

    // Get trip with route information
    const trip = await prisma.trip.findFirst({
        where: {
            trip_id: tripId,
            project_id: projectId
        },
        include: {
            route: true
        }
    })

    if (!trip) {
        throw new Error("Trip not found in this project")
    }

    // Get route stops for this trip's route and direction
    const routeStops = await prisma.routeStop.findMany({
        where: {
            route_id: trip.route_id,
            direction_id: trip.direction_id || 0,
            project_id: projectId
        },
        include: {
            stop: true
        },
        orderBy: {
            stop_sequence: 'asc'
        }
    })

    if (routeStops.length === 0) {
        throw new Error("No stops found for this trip's route and direction")
    }

    // Generate stop times
    let currentTime = start_time
    const stopTimesData = routeStops.map((routeStop, index) => {
        const arrivalTime = currentTime
        const departureTime = index === routeStops.length - 1
            ? currentTime // Last stop has same arrival and departure
            : addMinutesToTime(currentTime, dwell_time)

        // Update current time for next stop
        if (index < routeStops.length - 1) {
            currentTime = addMinutesToTime(departureTime, time_between_stops)
        }

        return {
            stop_id: routeStop.stop_id,
            stop_sequence: index,
            arrival_time: arrivalTime,
            departure_time: departureTime,
            pickup_type: 0,
            drop_off_type: 0,
            timepoint: 1
        }
    })

    return await createStopTimes(projectId, tripId, stopTimesData, userId)
}

/**
 * Update a single stop time
 */
export async function updateStopTime(projectId, tripId, stopSequence, data, userId = null) {
    const existing = await prisma.stopTime.findFirst({
        where: {
            trip_id: tripId,
            stop_sequence: parseInt(stopSequence),
            project_id: projectId
        }
    })

    if (!existing) {
        throw new Error("Stop time not found")
    }

    const updateData = {}
    if (data.arrival_time !== undefined) updateData.arrival_time = data.arrival_time
    if (data.departure_time !== undefined) updateData.departure_time = data.departure_time
    if (data.stop_headsign !== undefined) updateData.stop_headsign = data.stop_headsign
    if (data.pickup_type !== undefined) updateData.pickup_type = parseInt(data.pickup_type)
    if (data.drop_off_type !== undefined) updateData.drop_off_type = parseInt(data.drop_off_type)
    if (data.timepoint !== undefined) updateData.timepoint = parseInt(data.timepoint)

    return await prisma.stopTime.update({
        where: {
            trip_id_stop_sequence_project_id: {
                trip_id: tripId,
                stop_sequence: parseInt(stopSequence),
                project_id: projectId
            }
        },
        data: updateData
    })
}

/**
 * Delete stop times for a trip
 */
export async function deleteStopTimes(projectId, tripId) {
    const deleted = await prisma.stopTime.deleteMany({
        where: {
            trip_id: tripId,
            project_id: projectId
        }
    })

    return { success: true, deleted: deleted.count }
}
