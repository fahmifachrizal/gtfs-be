import { prisma } from "../../utils/prisma.js"

/**
 * Create a frequency entry for a trip
 */
export async function createFrequency(projectId, data, userId = null) {
    const { trip_id, start_time, end_time, headway_secs, exact_times } = data

    if (!trip_id) {
        throw new Error("trip_id is required")
    }

    if (!start_time || !end_time) {
        throw new Error("start_time and end_time are required")
    }

    if (!headway_secs) {
        throw new Error("headway_secs is required")
    }

    // Verify trip exists
    const trip = await prisma.trip.findFirst({
        where: {
            trip_id: trip_id,
            project_id: projectId
        }
    })

    if (!trip) {
        throw new Error("Trip not found in this project")
    }

    // Validate headway_secs is positive
    const headway = parseInt(headway_secs)
    if (headway <= 0) {
        throw new Error("headway_secs must be a positive number")
    }

    // Check for overlapping frequencies for the same trip
    const overlapping = await prisma.frequency.findFirst({
        where: {
            trip_id: trip_id,
            project_id: projectId,
            OR: [
                {
                    AND: [
                        { start_time: { lte: start_time } },
                        { end_time: { gt: start_time } }
                    ]
                },
                {
                    AND: [
                        { start_time: { lt: end_time } },
                        { end_time: { gte: end_time } }
                    ]
                },
                {
                    AND: [
                        { start_time: { gte: start_time } },
                        { end_time: { lte: end_time } }
                    ]
                }
            ]
        }
    })

    if (overlapping) {
        throw new Error("Frequency time range overlaps with existing frequency for this trip")
    }

    return await prisma.frequency.create({
        data: {
            trip_id: trip_id,
            start_time,
            end_time,
            headway_secs: headway,
            exact_times: exact_times !== undefined ? parseInt(exact_times) : 0,
            project_id: projectId,
            created_by: userId
        }
    })
}

/**
 * Get frequencies for a trip
 */
export async function getFrequenciesByTrip(projectId, tripId) {
    return await prisma.frequency.findMany({
        where: {
            trip_id: tripId,
            project_id: projectId
        },
        orderBy: {
            start_time: 'asc'
        }
    })
}

/**
 * Get all frequencies for a project with pagination
 */
export async function getFrequencies(projectId, { page = 1, limit = 10, trip_id = null } = {}) {
    const offset = (page - 1) * limit

    const where = {
        project_id: projectId,
        ...(trip_id && { trip_id })
    }

    const [data, total] = await Promise.all([
        prisma.frequency.findMany({
            where,
            orderBy: [
                { trip_id: 'asc' },
                { start_time: 'asc' }
            ],
            skip: offset,
            take: limit
        }),
        prisma.frequency.count({ where })
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
 * Update a frequency entry
 */
export async function updateFrequency(projectId, frequencyId, data, userId = null) {
    const existing = await prisma.frequency.findFirst({
        where: {
            id: frequencyId,
            project_id: projectId
        }
    })

    if (!existing) {
        throw new Error("Frequency not found in this project")
    }

    const updateData = {}

    if (data.start_time !== undefined) updateData.start_time = data.start_time
    if (data.end_time !== undefined) updateData.end_time = data.end_time
    if (data.headway_secs !== undefined) {
        const headway = parseInt(data.headway_secs)
        if (headway <= 0) {
            throw new Error("headway_secs must be a positive number")
        }
        updateData.headway_secs = headway
    }
    if (data.exact_times !== undefined) {
        updateData.exact_times = parseInt(data.exact_times)
    }

    // Check for overlapping frequencies (excluding current frequency)
    if (data.start_time || data.end_time) {
        const start = data.start_time || existing.start_time
        const end = data.end_time || existing.end_time

        const overlapping = await prisma.frequency.findFirst({
            where: {
                trip_id: existing.trip_id,
                project_id: projectId,
                id: { not: frequencyId },
                OR: [
                    {
                        AND: [
                            { start_time: { lte: start } },
                            { end_time: { gt: start } }
                        ]
                    },
                    {
                        AND: [
                            { start_time: { lt: end } },
                            { end_time: { gte: end } }
                        ]
                    },
                    {
                        AND: [
                            { start_time: { gte: start } },
                            { end_time: { lte: end } }
                        ]
                    }
                ]
            }
        })

        if (overlapping) {
            throw new Error("Frequency time range overlaps with existing frequency for this trip")
        }
    }

    return await prisma.frequency.update({
        where: {
            id: frequencyId
        },
        data: updateData
    })
}

/**
 * Delete a frequency entry
 */
export async function deleteFrequency(projectId, frequencyId) {
    const existing = await prisma.frequency.findFirst({
        where: {
            id: frequencyId,
            project_id: projectId
        }
    })

    if (!existing) {
        throw new Error("Frequency not found in this project")
    }

    await prisma.frequency.delete({
        where: {
            id: frequencyId
        }
    })

    return { success: true }
}

/**
 * Generate default frequencies for a trip
 * Creates morning peak, midday, and evening peak frequencies
 */
export async function generateDefaultFrequencies(projectId, tripId) {
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

    // Delete existing frequencies
    await prisma.frequency.deleteMany({
        where: {
            trip_id: tripId,
            project_id: projectId
        }
    })

    // Create default frequency periods
    const defaultFrequencies = [
        {
            trip_id: tripId,
            start_time: "06:00:00",
            end_time: "09:00:00",
            headway_secs: 600, // 10 minutes during morning peak
            exact_times: 0,
            project_id: projectId
        },
        {
            trip_id: tripId,
            start_time: "09:00:00",
            end_time: "16:00:00",
            headway_secs: 900, // 15 minutes during midday
            exact_times: 0,
            project_id: projectId
        },
        {
            trip_id: tripId,
            start_time: "16:00:00",
            end_time: "19:00:00",
            headway_secs: 600, // 10 minutes during evening peak
            exact_times: 0,
            project_id: projectId
        }
    ]

    await prisma.frequency.createMany({
        data: defaultFrequencies
    })

    return await getFrequenciesByTrip(projectId, tripId)
}
