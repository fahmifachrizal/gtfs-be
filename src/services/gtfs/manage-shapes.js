import { prisma } from "../../utils/prisma.js"

/**
 * Create or update shape points for a route
 * This supports adding waypoints between stops within a route
 */
export async function createOrUpdateShape(projectId, data, userId = null) {
    const { shape_id, points } = data

    if (!shape_id) {
        throw new Error("shape_id is required")
    }

    if (!points || !Array.isArray(points) || points.length === 0) {
        throw new Error("points array is required and must not be empty")
    }

    // Validate all points have required fields
    for (let i = 0; i < points.length; i++) {
        const point = points[i]
        if (point.shape_pt_lat === undefined || point.shape_pt_lon === undefined) {
            throw new Error(`Point at index ${i} is missing latitude or longitude`)
        }
    }

    // Delete existing shape points for this shape_id
    await prisma.shape.deleteMany({
        where: {
            shape_id: shape_id,
            project_id: projectId
        }
    })

    // Create new shape points in bulk
    const shapePoints = points.map((point, index) => ({
        shape_id: shape_id,
        shape_pt_sequence: point.shape_pt_sequence !== undefined ? point.shape_pt_sequence : index,
        shape_pt_lat: parseFloat(point.shape_pt_lat),
        shape_pt_lon: parseFloat(point.shape_pt_lon),
        shape_dist_traveled: point.shape_dist_traveled ? parseFloat(point.shape_dist_traveled) : null,
        project_id: projectId,
        created_by: userId
    }))

    await prisma.shape.createMany({
        data: shapePoints
    })

    // Return the created shape points
    return await prisma.shape.findMany({
        where: {
            shape_id: shape_id,
            project_id: projectId
        },
        orderBy: {
            shape_pt_sequence: 'asc'
        }
    })
}

/**
 * Get shape points for a specific shape_id
 */
export async function getShape(projectId, shapeId) {
    return await prisma.shape.findMany({
        where: {
            shape_id: shapeId,
            project_id: projectId
        },
        orderBy: {
            shape_pt_sequence: 'asc'
        }
    })
}

/**
 * Get all shapes for a project (grouped by shape_id)
 */
export async function getShapes(projectId, { page = 1, limit = 10, search = '' } = {}) {
    const offset = (page - 1) * limit

    // Get distinct shape_ids with search
    const shapes = await prisma.shape.groupBy({
        by: ['shape_id'],
        where: {
            project_id: projectId,
            ...(search && {
                shape_id: {
                    contains: search,
                    mode: 'insensitive'
                }
            })
        },
        _count: {
            shape_id: true
        },
        skip: offset,
        take: limit
    })

    // Get total count for pagination
    const totalCount = await prisma.shape.groupBy({
        by: ['shape_id'],
        where: {
            project_id: projectId,
            ...(search && {
                shape_id: {
                    contains: search,
                    mode: 'insensitive'
                }
            })
        },
        _count: {
            shape_id: true
        }
    })

    const total = totalCount.length

    // For each shape_id, get the first and last point for preview
    const shapesWithPoints = await Promise.all(
        shapes.map(async (shape) => {
            const points = await prisma.shape.findMany({
                where: {
                    shape_id: shape.shape_id,
                    project_id: projectId
                },
                orderBy: {
                    shape_pt_sequence: 'asc'
                }
            })

            return {
                shape_id: shape.shape_id,
                point_count: shape._count.shape_id,
                points: points
            }
        })
    )

    return {
        data: shapesWithPoints,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }
}

/**
 * Delete a shape and all its points
 */
export async function deleteShape(projectId, shapeId) {
    const deleted = await prisma.shape.deleteMany({
        where: {
            shape_id: shapeId,
            project_id: projectId
        }
    })

    if (deleted.count === 0) {
        throw new Error("Shape not found in this project")
    }

    return { success: true, deleted: deleted.count }
}

/**
 * Generate shape from route stops
 * This creates a basic shape by connecting the stops in a route
 */
export async function generateShapeFromRoute(projectId, routeId, directionId = 0) {
    // Get route stops in sequence
    const routeStops = await prisma.routeStop.findMany({
        where: {
            route_id: routeId,
            direction_id: directionId,
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
        throw new Error("No stops found for this route and direction")
    }

    // Generate shape_id
    const shapeId = `shape-${routeId}-${directionId}-${Date.now()}`

    // Create shape points from stops
    const shapePoints = routeStops.map((routeStop, index) => ({
        shape_id: shapeId,
        shape_pt_sequence: index,
        shape_pt_lat: routeStop.stop.stop_lat,
        shape_pt_lon: routeStop.stop.stop_lon,
        project_id: projectId
    }))

    await prisma.shape.createMany({
        data: shapePoints
    })

    return {
        shape_id: shapeId,
        points: await getShape(projectId, shapeId)
    }
}
