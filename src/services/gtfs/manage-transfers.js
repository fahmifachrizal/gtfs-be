import { prisma } from "../../utils/prisma.js"

/**
 * Create a transfer rule between two stops
 */
export async function createTransfer(projectId, data, userId = null) {
    const { from_stop_id, to_stop_id, transfer_type, min_transfer_time } = data

    if (!from_stop_id || !to_stop_id) {
        throw new Error("from_stop_id and to_stop_id are required")
    }

    if (from_stop_id === to_stop_id) {
        throw new Error("from_stop_id and to_stop_id cannot be the same")
    }

    // Verify both stops exist
    const [fromStop, toStop] = await Promise.all([
        prisma.stop.findFirst({
            where: {
                stop_id: from_stop_id,
                project_id: projectId
            }
        }),
        prisma.stop.findFirst({
            where: {
                stop_id: to_stop_id,
                project_id: projectId
            }
        })
    ])

    if (!fromStop) {
        throw new Error("from_stop not found in this project")
    }

    if (!toStop) {
        throw new Error("to_stop not found in this project")
    }

    // Validate transfer_type (0-3)
    const transferTypeInt = transfer_type !== undefined ? parseInt(transfer_type) : 0
    if (transferTypeInt < 0 || transferTypeInt > 3) {
        throw new Error("transfer_type must be 0, 1, 2, or 3")
    }

    // Check if transfer already exists
    const existing = await prisma.transfer.findFirst({
        where: {
            from_stop_id: from_stop_id,
            to_stop_id: to_stop_id,
            project_id: projectId
        }
    })

    if (existing) {
        throw new Error("Transfer rule already exists for these stops")
    }

    return await prisma.transfer.create({
        data: {
            from_stop_id: from_stop_id,
            to_stop_id: to_stop_id,
            transfer_type: transferTypeInt,
            min_transfer_time: min_transfer_time ? parseInt(min_transfer_time) : null,
            project_id: projectId,
            created_by: userId
        }
    })
}

/**
 * Get all transfers for a project
 */
export async function getTransfers(projectId, { page = 1, limit = 10, from_stop_id = null, to_stop_id = null } = {}) {
    const offset = (page - 1) * limit

    const where = {
        project_id: projectId,
        ...(from_stop_id && { from_stop_id }),
        ...(to_stop_id && { to_stop_id })
    }

    const [data, total] = await Promise.all([
        prisma.transfer.findMany({
            where,
            include: {
                fromStop: {
                    select: {
                        stop_id: true,
                        stop_name: true,
                        stop_lat: true,
                        stop_lon: true
                    }
                },
                toStop: {
                    select: {
                        stop_id: true,
                        stop_name: true,
                        stop_lat: true,
                        stop_lon: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            },
            skip: offset,
            take: limit
        }),
        prisma.transfer.count({ where })
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
 * Get transfers for a specific stop (both incoming and outgoing)
 */
export async function getTransfersByStop(projectId, stopId) {
    const [fromTransfers, toTransfers] = await Promise.all([
        prisma.transfer.findMany({
            where: {
                from_stop_id: stopId,
                project_id: projectId
            },
            include: {
                toStop: {
                    select: {
                        stop_id: true,
                        stop_name: true
                    }
                }
            }
        }),
        prisma.transfer.findMany({
            where: {
                to_stop_id: stopId,
                project_id: projectId
            },
            include: {
                fromStop: {
                    select: {
                        stop_id: true,
                        stop_name: true
                    }
                }
            }
        })
    ])

    return {
        outgoing: fromTransfers,
        incoming: toTransfers
    }
}

/**
 * Update a transfer rule
 */
export async function updateTransfer(projectId, transferId, data, userId = null) {
    const existing = await prisma.transfer.findFirst({
        where: {
            id: transferId,
            project_id: projectId
        }
    })

    if (!existing) {
        throw new Error("Transfer not found in this project")
    }

    const updateData = {}

    if (data.transfer_type !== undefined) {
        const transferTypeInt = parseInt(data.transfer_type)
        if (transferTypeInt < 0 || transferTypeInt > 3) {
            throw new Error("transfer_type must be 0, 1, 2, or 3")
        }
        updateData.transfer_type = transferTypeInt
    }

    if (data.min_transfer_time !== undefined) {
        updateData.min_transfer_time = data.min_transfer_time ? parseInt(data.min_transfer_time) : null
    }

    return await prisma.transfer.update({
        where: {
            id: transferId
        },
        data: updateData
    })
}

/**
 * Delete a transfer rule
 */
export async function deleteTransfer(projectId, transferId) {
    const existing = await prisma.transfer.findFirst({
        where: {
            id: transferId,
            project_id: projectId
        }
    })

    if (!existing) {
        throw new Error("Transfer not found in this project")
    }

    await prisma.transfer.delete({
        where: {
            id: transferId
        }
    })

    return { success: true }
}

/**
 * Auto-generate transfer rules for nearby stops
 * Creates transfers for stops within a certain distance
 */
export async function generateTransfersForNearbyStops(projectId, options = {}) {
    const {
        max_distance_meters = 200,
        default_transfer_type = 2, // Minimum time required
        default_min_transfer_time = 300 // 5 minutes in seconds
    } = options

    // Get all stops for the project
    const stops = await prisma.stop.findMany({
        where: {
            project_id: projectId
        },
        select: {
            stop_id: true,
            stop_name: true,
            stop_lat: true,
            stop_lon: true
        }
    })

    if (stops.length === 0) {
        return { generated: 0, transfers: [] }
    }

    // Calculate distance between two points using Haversine formula
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000 // Earth's radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    // Find pairs of nearby stops
    const transfersToCreate = []
    for (let i = 0; i < stops.length; i++) {
        for (let j = i + 1; j < stops.length; j++) {
            const stop1 = stops[i]
            const stop2 = stops[j]

            const distance = calculateDistance(
                stop1.stop_lat,
                stop1.stop_lon,
                stop2.stop_lat,
                stop2.stop_lon
            )

            if (distance <= max_distance_meters) {
                // Check if transfer already exists in either direction
                const existingTransfer = await prisma.transfer.findFirst({
                    where: {
                        project_id: projectId,
                        OR: [
                            {
                                from_stop_id: stop1.stop_id,
                                to_stop_id: stop2.stop_id
                            },
                            {
                                from_stop_id: stop2.stop_id,
                                to_stop_id: stop1.stop_id
                            }
                        ]
                    }
                })

                if (!existingTransfer) {
                    // Create bidirectional transfers
                    transfersToCreate.push({
                        from_stop_id: stop1.stop_id,
                        to_stop_id: stop2.stop_id,
                        transfer_type: default_transfer_type,
                        min_transfer_time: default_min_transfer_time,
                        project_id: projectId
                    })
                    transfersToCreate.push({
                        from_stop_id: stop2.stop_id,
                        to_stop_id: stop1.stop_id,
                        transfer_type: default_transfer_type,
                        min_transfer_time: default_min_transfer_time,
                        project_id: projectId
                    })
                }
            }
        }
    }

    // Create transfers in bulk
    if (transfersToCreate.length > 0) {
        await prisma.transfer.createMany({
            data: transfersToCreate
        })
    }

    return {
        generated: transfersToCreate.length,
        transfers: await getTransfers(projectId, { limit: 100 })
    }
}
